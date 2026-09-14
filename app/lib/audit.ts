import { prisma } from "./prisma";

// Toda alteração sensível (valor, prazo, status, responsável, cancelamento,
// aprovação, pagamento) deve passar por aqui para alimentar o histórico de
// auditoria (seção 22 do escopo do produto).

export type AuditAction =
  | "STATUS_CHANGE"
  | "VALUE_CHANGE"
  | "DEADLINE_CHANGE"
  | "RESPONSIBLE_CHANGE"
  | "CANCELLATION"
  | "APPROVAL"
  | "PAYMENT"
  | "REWORK"
  | "OTHER";

export async function logAudit(params: {
  entity: string;
  entityId: string;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  action: AuditAction;
  actorId?: string | null;
}) {
  const { entity, entityId, field, oldValue, newValue, action, actorId } = params;
  if (oldValue === newValue) return;
  await prisma.auditLog.create({
    data: {
      entity,
      entityId,
      field,
      oldValue: oldValue === undefined || oldValue === null ? null : String(oldValue),
      newValue: newValue === undefined || newValue === null ? null : String(newValue),
      action,
      actorId: actorId ?? null,
    },
  });
}
