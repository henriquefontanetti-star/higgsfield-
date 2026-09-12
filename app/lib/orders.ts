import { prisma } from "./prisma";
import { logAudit } from "./audit";
import type { AnyOrderStatus } from "./constants";

// Centraliza a transição de status da OS: atualiza a OS, grava a timeline
// (StatusHistory) e a auditoria automaticamente, e aplica os efeitos
// colaterais esperados (marcar início/fim de execução, entrega, etc.).
export async function changeOrderStatus(
  orderId: number,
  toStatus: AnyOrderStatus,
  actorId: string | null,
  note?: string | null
) {
  const order = await prisma.serviceOrder.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("OS não encontrada");

  const fromStatus = order.status;
  const now = new Date();
  const data: Record<string, unknown> = { status: toStatus };

  if (toStatus === "EM_EXECUCAO" && !order.executionStartedAt) {
    data.executionStartedAt = now;
  }
  if ((toStatus === "CONTROLE_QUALIDADE" || toStatus === "PRONTO") && !order.executionEndedAt) {
    data.executionEndedAt = now;
  }
  if (toStatus === "CONTROLE_QUALIDADE" && !order.qualityCheckedAt) {
    data.qualityCheckedAt = now;
  }
  if (toStatus === "ENTREGUE" && !order.deliveredAt) {
    data.deliveredAt = now;
  }
  if (toStatus === "CANCELADO") {
    data.isCanceled = true;
  }
  if (toStatus === "BLOQUEADO") {
    data.isBlocked = true;
  } else if (order.isBlocked) {
    data.isBlocked = false;
  }

  await prisma.$transaction([
    prisma.serviceOrder.update({ where: { id: orderId }, data }),
    prisma.statusHistory.create({
      data: { orderId, fromStatus, toStatus, changedById: actorId, note: note || null },
    }),
  ]);

  await logAudit({
    entity: "ServiceOrder",
    entityId: String(orderId),
    field: "status",
    oldValue: fromStatus,
    newValue: toStatus,
    action: toStatus === "CANCELADO" ? "CANCELLATION" : "STATUS_CHANGE",
    actorId,
  });

  return prisma.serviceOrder.findUnique({ where: { id: orderId } });
}

export function isOrderLate(order: { expectedDeliveryDate: Date | null; status: string }): boolean {
  if (!order.expectedDeliveryDate) return false;
  if (["ENTREGUE", "FINALIZADO", "CANCELADO"].includes(order.status)) return false;
  return order.expectedDeliveryDate.getTime() < Date.now();
}
