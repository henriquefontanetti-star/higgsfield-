import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireSession } from "@/app/lib/api-auth";
import { hashPassword } from "@/app/lib/auth";
import { ROLES, isIn } from "@/app/lib/constants";

export async function GET() {
  const { session, response } = await requireSession();
  if (!session) return response;

  const employees = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      position: true,
      skills: true,
      active: true,
      hiredAt: true,
      _count: {
        select: { serviceItems: true },
      },
    },
  });

  return NextResponse.json(employees);
}

export async function POST(request: Request) {
  // Só proprietário/gestor podem cadastrar novos usuários.
  const { session, response } = await requireSession(["PROPRIETARIO", "GESTOR"]);
  if (!session) return response;

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const role = isIn(ROLES, body?.role) ? body.role : "FUNCIONARIO";

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Nome, e-mail e senha são obrigatórios" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "A senha deve ter pelo menos 6 caracteres" }, { status: 400 });
  }
  // Somente o proprietário pode criar outro proprietário.
  if (role === "PROPRIETARIO" && session.role !== "PROPRIETARIO") {
    return NextResponse.json({ error: "Sem permissão para criar este papel" }, { status: 403 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Já existe um usuário com este e-mail" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: hashPassword(password),
      role,
      position: body?.position || null,
      skills: body?.skills || null,
    },
    select: { id: true, name: true, email: true, role: true, position: true, skills: true, active: true },
  });

  return NextResponse.json(user, { status: 201 });
}
