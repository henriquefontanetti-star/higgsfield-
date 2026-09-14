import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireSession } from "@/app/lib/api-auth";
import { logAudit } from "@/app/lib/audit";
import { PAYMENT_METHODS, PAYMENT_STATUSES, isIn } from "@/app/lib/constants";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, ctx: Ctx) {
  const { session, response } = await requireSession();
  if (!session) return response;

  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "OS inválida" }, { status: 400 });

  const existing = await prisma.serviceOrder.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "OS não encontrada" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const data: Record<string, unknown> = {};

  if (isIn(PAYMENT_METHODS, body?.paymentMethod) || body?.paymentMethod === null) {
    data.paymentMethod = body.paymentMethod;
  }
  if (isIn(PAYMENT_STATUSES, body?.paymentStatus) && body.paymentStatus !== existing.paymentStatus) {
    data.paymentStatus = body.paymentStatus;
    if (body.paymentStatus === "PAGO") data.paymentDate = new Date();
    await logAudit({
      entity: "ServiceOrder",
      entityId: String(id),
      field: "paymentStatus",
      oldValue: existing.paymentStatus,
      newValue: body.paymentStatus,
      action: "PAYMENT",
      actorId: session.userId,
    });
  }

  const order = await prisma.serviceOrder.update({ where: { id }, data });
  return NextResponse.json(order);
}
