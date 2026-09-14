// Valores estruturados usados em toda a aplicação. SQLite não suporta enums
// nativos no Prisma, então validamos esses valores em runtime a partir destas
// listas — nenhum campo de status/categoria deve aceitar texto livre.

export const ROLES = ["PROPRIETARIO", "GESTOR", "FUNCIONARIO"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  PROPRIETARIO: "Proprietário",
  GESTOR: "Gestor",
  FUNCIONARIO: "Funcionário",
};

export const CLIENT_TYPES = [
  "PESSOA_FISICA",
  "OFICINA",
  "LOJA",
  "PARCEIRO",
  "OUTRO",
] as const;
export type ClientType = (typeof CLIENT_TYPES)[number];

export const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  PESSOA_FISICA: "Pessoa física",
  OFICINA: "Oficina",
  LOJA: "Loja",
  PARCEIRO: "Parceiro",
  OUTRO: "Outro",
};

export const ORIGINS = [
  "INDICACAO",
  "GOOGLE",
  "INSTAGRAM",
  "WHATSAPP",
  "OFICINA_PARCEIRA",
  "CLIENTE_ANTIGO",
  "OUTRO",
] as const;
export type Origin = (typeof ORIGINS)[number];

export const ORIGIN_LABELS: Record<Origin, string> = {
  INDICACAO: "Indicação",
  GOOGLE: "Google",
  INSTAGRAM: "Instagram",
  WHATSAPP: "WhatsApp",
  OFICINA_PARCEIRA: "Oficina parceira",
  CLIENTE_ANTIGO: "Cliente antigo",
  OUTRO: "Outro",
};

// Fluxo principal de status da OS (ordem representa a sequência esperada).
export const ORDER_STATUSES = [
  "ENTRADA",
  "AGUARDANDO_AVALIACAO",
  "ORCAMENTO",
  "AGUARDANDO_APROVACAO",
  "APROVADO",
  "AGUARDANDO_EXECUCAO",
  "EM_EXECUCAO",
  "AGUARDANDO_CLIENTE",
  "CONTROLE_QUALIDADE",
  "PRONTO",
  "ENTREGUE",
  "FINALIZADO",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

// Status especiais - não fazem parte da sequência linear.
export const SPECIAL_STATUSES = ["CANCELADO", "RETRABALHO", "BLOQUEADO"] as const;
export type SpecialStatus = (typeof SPECIAL_STATUSES)[number];

export const ALL_STATUSES = [...ORDER_STATUSES, ...SPECIAL_STATUSES] as const;
export type AnyOrderStatus = (typeof ALL_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<AnyOrderStatus, string> = {
  ENTRADA: "Entrada",
  AGUARDANDO_AVALIACAO: "Aguardando avaliação",
  ORCAMENTO: "Orçamento",
  AGUARDANDO_APROVACAO: "Aguardando aprovação",
  APROVADO: "Aprovado",
  AGUARDANDO_EXECUCAO: "Aguardando execução",
  EM_EXECUCAO: "Em execução",
  AGUARDANDO_CLIENTE: "Aguardando cliente",
  CONTROLE_QUALIDADE: "Controle de qualidade",
  PRONTO: "Pronto",
  ENTREGUE: "Entregue",
  FINALIZADO: "Finalizado",
  CANCELADO: "Cancelado",
  RETRABALHO: "Retrabalho",
  BLOQUEADO: "Bloqueado",
};

// Colunas exibidas no quadro Kanban (estados que não aparecem no fluxo linear
// final, como FINALIZADO/CANCELADO, ficam fora do quadro operacional).
export const KANBAN_COLUMNS: OrderStatus[] = [
  "ENTRADA",
  "AGUARDANDO_AVALIACAO",
  "ORCAMENTO",
  "AGUARDANDO_APROVACAO",
  "APROVADO",
  "AGUARDANDO_EXECUCAO",
  "EM_EXECUCAO",
  "CONTROLE_QUALIDADE",
  "PRONTO",
  "ENTREGUE",
];

export const PRIORITIES = ["BAIXA", "NORMAL", "ALTA", "URGENTE"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PRIORITY_LABELS: Record<Priority, string> = {
  BAIXA: "Baixa",
  NORMAL: "Normal",
  ALTA: "Alta",
  URGENTE: "Urgente",
};

export const SERVICE_STATUSES = ["PENDENTE", "EM_ANDAMENTO", "CONCLUIDO"] as const;
export type ServiceStatus = (typeof SERVICE_STATUSES)[number];

export const SERVICE_STATUS_LABELS: Record<ServiceStatus, string> = {
  PENDENTE: "Pendente",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDO: "Concluído",
};

export const DEFAULT_SERVICE_CATEGORIES = [
  "Cabeçote",
  "Cilindro",
  "Virabrequim",
  "Carcaça",
  "Usinagem",
  "Medição",
  "Montagem/Desmontagem",
  "Outro",
];

export const BUDGET_STATUSES = [
  "RASCUNHO",
  "ENVIADO",
  "APROVADO",
  "RECUSADO",
  "EXPIRADO",
] as const;
export type BudgetStatus = (typeof BUDGET_STATUSES)[number];

export const BUDGET_STATUS_LABELS: Record<BudgetStatus, string> = {
  RASCUNHO: "Rascunho",
  ENVIADO: "Enviado",
  APROVADO: "Aprovado",
  RECUSADO: "Recusado",
  EXPIRADO: "Expirado",
};

export const PAYMENT_METHODS = [
  "PIX",
  "DINHEIRO",
  "CARTAO_CREDITO",
  "CARTAO_DEBITO",
  "TRANSFERENCIA",
  "FATURADO_OFICINA",
  "OUTRO",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  PIX: "PIX",
  DINHEIRO: "Dinheiro",
  CARTAO_CREDITO: "Cartão de crédito",
  CARTAO_DEBITO: "Cartão de débito",
  TRANSFERENCIA: "Transferência",
  FATURADO_OFICINA: "Faturado para oficina",
  OUTRO: "Outro",
};

export const PAYMENT_STATUSES = ["PENDENTE", "PARCIAL", "PAGO"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDENTE: "Pendente",
  PARCIAL: "Parcialmente pago",
  PAGO: "Pago",
};

export const PHOTO_CATEGORIES = [
  "ENTRADA",
  "PECA",
  "MEDICAO",
  "EXECUCAO",
  "PROBLEMA",
  "CONCLUSAO",
  "ENTREGA",
] as const;
export type PhotoCategory = (typeof PHOTO_CATEGORIES)[number];

export const PHOTO_CATEGORY_LABELS: Record<PhotoCategory, string> = {
  ENTRADA: "Entrada",
  PECA: "Peça",
  MEDICAO: "Medição",
  EXECUCAO: "Execução",
  PROBLEMA: "Problema",
  CONCLUSAO: "Conclusão",
  ENTREGA: "Entrega",
};

export function isIn<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === "string" && (values as readonly string[]).includes(value);
}
