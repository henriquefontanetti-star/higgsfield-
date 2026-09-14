import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../app/lib/password";
import { DEFAULT_SERVICE_CATEGORIES } from "../app/lib/constants";

const prisma = new PrismaClient();

async function main() {
  // Categorias padrão de serviço.
  for (const [index, name] of DEFAULT_SERVICE_CATEGORIES.entries()) {
    await prisma.serviceCategory.upsert({
      where: { name },
      update: {},
      create: { name, order: index },
    });
  }

  // Usuários iniciais: proprietário, gestor (Denner) e um funcionário.
  const owner = await prisma.user.upsert({
    where: { email: "proprietario@hgmotors.com.br" },
    update: {},
    create: {
      name: "Proprietário",
      email: "proprietario@hgmotors.com.br",
      passwordHash: hashPassword("hgmotors123"),
      role: "PROPRIETARIO",
      position: "Proprietário",
    },
  });

  const denner = await prisma.user.upsert({
    where: { email: "denner@hgmotors.com.br" },
    update: {},
    create: {
      name: "Denner",
      email: "denner@hgmotors.com.br",
      passwordHash: hashPassword("hgmotors123"),
      role: "GESTOR",
      position: "Gestor operacional",
    },
  });

  await prisma.user.upsert({
    where: { email: "tecnico@hgmotors.com.br" },
    update: {},
    create: {
      name: "Técnico",
      email: "tecnico@hgmotors.com.br",
      passwordHash: hashPassword("hgmotors123"),
      role: "FUNCIONARIO",
      position: "Retificador",
      skills: "Cabeçote, Cilindro, Usinagem",
    },
  });

  console.log("Seed concluído.");
  console.log("Usuários criados (senha padrão: hgmotors123):");
  console.log(`- ${owner.email} (PROPRIETARIO)`);
  console.log(`- ${denner.email} (GESTOR)`);
  console.log("- tecnico@hgmotors.com.br (FUNCIONARIO)");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
