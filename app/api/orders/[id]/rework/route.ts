import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireSession } from "@/app/lib/api-auth";
import { logAudit } from "@/app/lib/audit";
import { changeOrderStatus } from "@/app/lib/orders";

type Ctx = { params: Promise<{ id: string }> };

// Marca a OS como retrabalho: registra motivo/responsável/custo estimado e
// move a OS para o status especial RETRABALHO, alimentando a taxa de
// retrabalho no dashboard.
export async function POST(request: Request, ctx: Ctx) {
  const { session, response } = await requireSession();
  if (!session) return response;

  const orderId = Number((await ctx.params).id);
  if (!Number.isInteger(orderId)) return NextResponse.json({ error: "OS inválida" }, { status: 400 });

  const body = await request.json().catch(() => null);
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
  if (!reason) return NextResponse.json({ error: "Informe o motivo do retrabalho" }, { status: 400 });

  const order = await prisma.serviceOrder.findUnique({ where: { id: orderId } });
  if (!order) return NextResponse.json({ error: "OS não encontrada" }, { status: 404 });

  const rework = await prisma.rework.create({
    data: {
      orderId,
      reason,
      responsibleId: body.responsibleId || null,
      estimatedCost: typeof body.estimatedCost === "number" ? body.estimatedCost : null,
      notes: body.notes || null,
    },
    include: { responsible: { select: { id: true, name: true } } },
  });

  await logAudit({
    entity: "ServiceOrder",
    entityId: String(orderId),
    field: "retrabalho",
    oldValue: null,
    newValue: reason,
    action: "REWORK",
    actorId: session.userId,
  });

  await changeOrderStatus(orderId, "RETRABALHO", session.userId, `Retrabalho: ${reason}`);

  return NextResponse.json(rework, { status: 201 });
}
