import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireSession } from "@/app/lib/api-auth";
import { logAudit } from "@/app/lib/audit";
import { changeOrderStatus } from "@/app/lib/orders";
import { BUDGET_STATUSES, isIn } from "@/app/lib/constants";

type Ctx = { params: Promise<{ id: string }> };

// Atualiza o status do orçamento (rascunho -> enviado -> aprovado/recusado/
// expirado), registrando as datas automaticamente e refletindo no fluxo da
// OS quando fizer sentido (aprovado -> avança a OS).
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
  const now = new Date();

  if (typeof body.discount === "number" && body.discount !== existing.discount) {
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

  if (typeof body.budgetNotes === "string" || body.budgetNotes === null) {
    data.budgetNotes = body.budgetNotes;
  }

  if (isIn(BUDGET_STATUSES, body.budgetStatus) && body.budgetStatus !== existing.budgetStatus) {
    data.budgetStatus = body.budgetStatus;
    if (body.budgetStatus === "ENVIADO" && !existing.budgetSentAt) data.budgetSentAt = now;
    if (body.budgetStatus === "APROVADO") {
      data.budgetApprovedAt = now;
      await logAudit({
        entity: "ServiceOrder",
        entityId: String(id),
        field: "budgetStatus",
        oldValue: existing.budgetStatus,
        newValue: "APROVADO",
        action: "APPROVAL",
        actorId: session.userId,
      });
    } else {
      await logAudit({
        entity: "ServiceOrder",
        entityId: String(id),
        field: "budgetStatus",
        oldValue: existing.budgetStatus,
        newValue: body.budgetStatus,
        action: "OTHER",
        actorId: session.userId,
      });
    }
  }

  await prisma.serviceOrder.update({ where: { id }, data });

  // Se o orçamento acabou de ser aprovado e a OS ainda está numa etapa
  // anterior à aprovação, avança automaticamente o status para não exigir
  // dois cliques.
  const PRE_APPROVAL_STATUSES = ["ENTRADA", "AGUARDANDO_AVALIACAO", "ORCAMENTO", "AGUARDANDO_APROVACAO"];
  if (data.budgetStatus === "APROVADO" && PRE_APPROVAL_STATUSES.includes(existing.status)) {
    await changeOrderStatus(id, "APROVADO", session.userId, "Orçamento aprovado");
  }

  const order = await prisma.serviceOrder.findUnique({
    where: { id },
    include: { services: { include: { category: true } } },
  });
  return NextResponse.json(order);
}
