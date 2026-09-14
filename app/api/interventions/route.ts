import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireSession } from "@/app/lib/api-auth";
import { getPeriodRange, type PeriodKey } from "@/app/lib/metrics";

export async function GET(request: Request) {
  const { session, response } = await requireSession();
  if (!session) return response;

  const { searchParams } = new URL(request.url);
  const period = (searchParams.get("period") as PeriodKey) || "month";
  const { start, end } = getPeriodRange(period, searchParams.get("from"), searchParams.get("to"));

  const interventions = await prisma.ownerIntervention.findMany({
    where: { occurredAt: { gte: start, lte: end } },
    include: { resolvedBy: { select: { id: true, name: true } }, order: { select: { id: true } } },
    orderBy: { occurredAt: "desc" },
  });

  return NextResponse.json(interventions);
}

// Sempre que um problema precisa ser escalado para o proprietário, o
// gestor registra aqui: OS relacionada, categoria, descrição, solução e
// responsável — para reduzir a dependência do proprietário ao longo do tempo.
export async function POST(request: Request) {
  const { session, response } = await requireSession();
  if (!session) return response;

  const body = await request.json().catch(() => null);
  const category = typeof body?.category === "string" ? body.category.trim() : "";
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  if (!category || !description) {
    return NextResponse.json({ error: "Categoria e descrição são obrigatórias" }, { status: 400 });
  }

  const intervention = await prisma.ownerIntervention.create({
    data: {
      orderId: body.orderId ? Number(body.orderId) : null,
      category,
      description,
      solution: body.solution || null,
      resolvedById: body.resolvedById || null,
    },
  });

  return NextResponse.json(intervention, { status: 201 });
}
