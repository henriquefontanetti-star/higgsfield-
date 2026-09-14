import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireSession } from "@/app/lib/api-auth";
import { PRIORITIES, isIn } from "@/app/lib/constants";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const { session, response } = await requireSession();
  if (!session) return response;

  const orderId = Number((await ctx.params).id);
  if (!Number.isInteger(orderId)) return NextResponse.json({ error: "OS inválida" }, { status: 400 });

  const body = await request.json().catch(() => null);
  if (!body?.categoryId) {
    return NextResponse.json({ error: "Categoria é obrigatória" }, { status: 400 });
  }

  const service = await prisma.serviceItem.create({
    data: {
      orderId,
      categoryId: body.categoryId,
      description: body.description || null,
      value: Number(body.value) || 0,
      responsibleId: body.responsibleId || null,
      priority: isIn(PRIORITIES, body.priority) ? body.priority : "NORMAL",
      deadline: body.deadline ? new Date(body.deadline) : null,
    },
    include: { category: true, responsible: { select: { id: true, name: true } } },
  });

  return NextResponse.json(service, { status: 201 });
}
