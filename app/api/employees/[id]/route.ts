import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireSession } from "@/app/lib/api-auth";

type Ctx = { params: Promise<{ id: string }> };

// Produtividade individual: serviços atribuídos, concluídos, atrasados,
// tempo médio de execução, retrabalhos e faturamento relacionado.
export async function GET(_request: Request, ctx: Ctx) {
  const { session, response } = await requireSession();
  if (!session) return response;

  const { id } = await ctx.params;
  const employee = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      position: true,
      skills: true,
      active: true,
      hiredAt: true,
    },
  });
  if (!employee) return NextResponse.json({ error: "Funcionário não encontrado" }, { status: 404 });

  const services = await prisma.serviceItem.findMany({
    where: { responsibleId: id },
    include: {
      order: { select: { id: true, status: true, isCanceled: true, discount: true, services: { select: { value: true } } } },
    },
  });

  const now = Date.now();
  const assigned = services.length;
  const completed = services.filter((s) => s.status === "CONCLUIDO");
  const lateOpen = services.filter(
    (s) => s.status !== "CONCLUIDO" && s.deadline && s.deadline.getTime() < now
  );
  const durationsHours = completed
    .filter((s) => s.startedAt && s.completedAt)
    .map((s) => (s.completedAt!.getTime() - s.startedAt!.getTime()) / 3_600_000);
  const avgDurationHours =
    durationsHours.length > 0 ? durationsHours.reduce((a, b) => a + b, 0) / durationsHours.length : null;

  const billedOrderIds = new Set<number>();
  let revenue = 0;
  for (const s of services) {
    if (!s.order.isCanceled && (s.order.status === "ENTREGUE" || s.order.status === "FINALIZADO")) {
      revenue += s.value;
      billedOrderIds.add(s.order.id);
    }
  }

  const reworks = await prisma.rework.count({ where: { responsibleId: id } });

  return NextResponse.json({
    employee,
    productivity: {
      servicesAssigned: assigned,
      servicesCompleted: completed.length,
      servicesLate: lateOpen.length,
      avgDurationHours,
      revenue,
      billedOrdersCount: billedOrderIds.size,
      reworks,
    },
  });
}

export async function PUT(request: Request, ctx: Ctx) {
  const { session, response } = await requireSession(["PROPRIETARIO", "GESTOR"]);
  if (!session) return response;

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (typeof body.position === "string" || body.position === null) data.position = body.position;
  if (typeof body.skills === "string" || body.skills === null) data.skills = body.skills;
  if (typeof body.active === "boolean") data.active = body.active;

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true, position: true, skills: true, active: true },
  });
  return NextResponse.json(user);
}
