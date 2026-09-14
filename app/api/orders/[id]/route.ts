import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireSession } from "@/app/lib/api-auth";
import { logAudit } from "@/app/lib/audit";
import { computeOrderValue } from "@/app/lib/metrics";
import { isOrderLate } from "@/app/lib/orders";
import { PRIORITIES, isIn } from "@/app/lib/constants";

type Ctx = { params: Promise<{ id: string }> };

const fullInclude = {
  client: true,
  attendedBy: { select: { id: true, name: true } },
  services: { include: { category: true, responsible: { select: { id: true, name: true } } } },
  statusHistory: { orderBy: { changedAt: "asc" as const }, include: { changedBy: { select: { id: true, name: true } } } },
  photos: { orderBy: { createdAt: "asc" as const }, include: { uploadedBy: { select: { id: true, name: true } } } },
  reworks: { orderBy: { occurredAt: "desc" as const }, include: { responsible: { select: { id: true, name: true } } } },
  interventions: { orderBy: { occurredAt: "desc" as const }, include: { resolvedBy: { select: { id: true, name: true } } } },
};

export async function GET(_request: Request, ctx: Ctx) {
  const { session, response } = await requireSession();
  if (!session) return response;

  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "OS inválida" }, { status: 400 });

  const order = await prisma.serviceOrder.findUnique({ where: { id }, include: fullInclude });
  if (!order) return NextResponse.json({ error: "OS não encontrada" }, { status: 404 });

  const { gross, final } = computeOrderValue(order);
  return NextResponse.json({ ...order, valueGross: gross, valueFinal: final, isLate: isOrderLate(order) });
}

export async function PUT(request: Request, ctx: Ctx) {
  const { session, response } = await requireSession();
  if (!session) return response;

  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "OS inválida" }, { status: 400 });

  const existing = await prisma.serviceOrder.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "OS não encontrada" }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });

  const data: Record<string, unknown> = {};
  const textFields = [
    "motorBrand",
    "motorModel",
    "motorYear",
    "motorDisplacement",
    "motorType",
    "motorSerial",
    "motorMileage",
    "notes",
  ] as const;
  for (const field of textFields) {
    if (typeof body[field] === "string" || body[field] === null) data[field] = body[field];
  }
  if (isIn(PRIORITIES, body.priority)) data.priority = body.priority;

  if ("expectedDeliveryDate" in body) {
    const newDeadline = body.expectedDeliveryDate ? new Date(body.expectedDeliveryDate) : null;
    data.expectedDeliveryDate = newDeadline;
    await logAudit({
      entity: "ServiceOrder",
      entityId: String(id),
      field: "expectedDeliveryDate",
      oldValue: existing.expectedDeliveryDate?.toISOString(),
      newValue: newDeadline?.toISOString(),
      action: "DEADLINE_CHANGE",
      actorId: session.userId,
    });
  }

  if ("discount" in body && typeof body.discount === "number") {
    data.discount = body.discount;
    await logAudit({
      entity: "ServiceOrder",
      entityId: String(id),
      field: "discount",
      oldValue: existing.discount,
      newValue: body.discount,
      action: "VALUE_CHANGE",
      actorId: session.userId,
    });
  }

  if ("attendedById" in body) {
    data.attendedById = body.attendedById || null;
    await logAudit({
      entity: "ServiceOrder",
      entityId: String(id),
      field: "attendedById",
      oldValue: existing.attendedById,
      newValue: body.attendedById,
      action: "RESPONSIBLE_CHANGE",
      actorId: session.userId,
    });
  }

  const order = await prisma.serviceOrder.update({ where: { id }, data, include: fullInclude });
  const { gross, final } = computeOrderValue(order);
  return NextResponse.json({ ...order, valueGross: gross, valueFinal: final, isLate: isOrderLate(order) });
}
