import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireSession } from "@/app/lib/api-auth";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, ctx: Ctx) {
  const { session, response } = await requireSession(["PROPRIETARIO", "GESTOR"]);
  if (!session) return response;

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const data: Record<string, unknown> = {};
  if (typeof body?.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (typeof body?.active === "boolean") data.active = body.active;

  const category = await prisma.serviceCategory.update({ where: { id }, data });
  return NextResponse.json(category);
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { session, response } = await requireSession(["PROPRIETARIO", "GESTOR"]);
  if (!session) return response;

  const { id } = await ctx.params;
  // Não apagamos de fato para preservar o histórico de serviços já lançados;
  // apenas desativamos a categoria para novos lançamentos.
  const category = await prisma.serviceCategory.update({ where: { id }, data: { active: false } });
  return NextResponse.json(category);
}
