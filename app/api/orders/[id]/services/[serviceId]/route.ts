import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireSession } from "@/app/lib/api-auth";
import { logAudit } from "@/app/lib/audit";
import { PRIORITIES, SERVICE_STATUSES, isIn } from "@/app/lib/constants";

type Ctx = { params: Promise<{ id: string; serviceId: string }> };

export async function PUT(request: Request, ctx: Ctx) {
  const { session, response } = await requireSession();
  if (!session) return response;

  const { serviceId } = await ctx.params;
  const existing = await prisma.serviceItem.findUnique({ where: { id: serviceId } });
  if (!existing) return NextResponse.json({ error: "Serviço não encontrado" }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });

  const data: Record<string, unknown> = {};

  if (typeof body.description === "string" || body.description === null) {
    data.description = body.description;
  }
  if (typeof body.categoryId === "string") data.categoryId = body.categoryId;
  if (isIn(PRIORITIES, body.priority)) data.priority = body.priority;
  if ("deadline" in body) data.deadline = body.deadline ? new Date(body.deadline) : null;

  if (typeof body.value === "number" && body.value !== existing.value) {
    data.value = body.value;
    await logAudit({
      entity: "ServiceItem",
      entityId: serviceId,
      field: "value",
      oldValue: existing.value,
      newValue: body.value,
      action: "VALUE_CHANGE",
      actorId: session.userId,
    });
  }

  if ("responsibleId" in body && body.responsibleId !== existing.responsibleId) {
    data.responsibleId = body.responsibleId || null;
    await logAudit({
      entity: "ServiceItem",
      entityId: serviceId,
      field: "responsibleId",
      oldValue: existing.responsibleId,
      newValue: body.responsibleId,
      action: "RESPONSIBLE_CHANGE",
      actorId: session.userId,
    });
  }

  if (isIn(SERVICE_STATUSES, body.status) && body.status !== existing.status) {
    data.status = body.status;
    if (body.status === "EM_ANDAMENTO" && !existing.startedAt) data.startedAt = new Date();
    if (body.status === "CONCLUIDO" && !existing.completedAt) data.completedAt = new Date();
    await logAudit({
      entity: "ServiceItem",
      entityId: serviceId,
      field: "status",
      oldValue: existing.status,
      newValue: body.status,
      action: "STATUS_CHANGE",
      actorId: session.userId,
    });
  }

  const service = await prisma.serviceItem.update({
    where: { id: serviceId },
    data,
    include: { category: true, responsible: { select: { id: true, name: true } } },
  });

  return NextResponse.json(service);
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { session, response } = await requireSession(["PROPRIETARIO", "GESTOR"]);
  if (!session) return response;

  const { serviceId } = await ctx.params;
  await prisma.serviceItem.delete({ where: { id: serviceId } });
  return NextResponse.json({ ok: true });
}
