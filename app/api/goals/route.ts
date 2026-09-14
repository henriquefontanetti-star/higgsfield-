import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireSession } from "@/app/lib/api-auth";

export async function GET(request: Request) {
  const { session, response } = await requireSession();
  if (!session) return response;

  const { searchParams } = new URL(request.url);
  const month = Number(searchParams.get("month"));
  const year = Number(searchParams.get("year"));

  if (month && year) {
    const goal = await prisma.goal.findUnique({ where: { month_year: { month, year } } });
    return NextResponse.json(goal);
  }

  const goals = await prisma.goal.findMany({ orderBy: [{ year: "desc" }, { month: "desc" }] });
  return NextResponse.json(goals);
}

// Cadastro de metas mensais (só proprietário/gestor definem metas).
export async function POST(request: Request) {
  const { session, response } = await requireSession(["PROPRIETARIO", "GESTOR"]);
  if (!session) return response;

  const body = await request.json().catch(() => null);
  const month = Number(body?.month);
  const year = Number(body?.year);
  if (!month || !year || month < 1 || month > 12) {
    return NextResponse.json({ error: "Mês e ano são obrigatórios" }, { status: 400 });
  }

  const data = {
    revenueTarget: typeof body.revenueTarget === "number" ? body.revenueTarget : null,
    ordersTarget: typeof body.ordersTarget === "number" ? body.ordersTarget : null,
    avgTicketTarget: typeof body.avgTicketTarget === "number" ? body.avgTicketTarget : null,
    conversionTarget: typeof body.conversionTarget === "number" ? body.conversionTarget : null,
    maxReworkRate: typeof body.maxReworkRate === "number" ? body.maxReworkRate : null,
    maxAvgDeadlineDays: typeof body.maxAvgDeadlineDays === "number" ? body.maxAvgDeadlineDays : null,
  };

  const goal = await prisma.goal.upsert({
    where: { month_year: { month, year } },
    create: { month, year, ...data },
    update: data,
  });

  return NextResponse.json(goal, { status: 201 });
}
