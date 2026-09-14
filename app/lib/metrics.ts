// Funções de cálculo de indicadores. Regra de ouro do produto: nenhum
// indicador é digitado manualmente — tudo é derivado dos dados operacionais
// registrados nas Ordens de Serviço (ver seção 23 do escopo).

export interface OrderForValue {
  discount: number;
  services: { value: number }[];
}

// Valor bruto (soma dos serviços) e valor final (com desconto aplicado) de
// uma OS. Usado tanto no faturamento quanto no cadastro de clientes.
export function computeOrderValue(order: OrderForValue) {
  const gross = order.services.reduce((sum, s) => sum + s.value, 0);
  const final = Math.max(0, gross - (order.discount || 0));
  return { gross, final };
}

export type PeriodKey = "today" | "week" | "month" | "quarter" | "year" | "custom";

export function getPeriodRange(
  period: PeriodKey,
  customFrom?: string | null,
  customTo?: string | null
): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  if (period === "custom" && customFrom && customTo) {
    const start = new Date(customFrom);
    start.setHours(0, 0, 0, 0);
    const customEnd = new Date(customTo);
    customEnd.setHours(23, 59, 59, 999);
    return { start, end: customEnd };
  }

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  switch (period) {
    case "today":
      break;
    case "week":
      start.setDate(start.getDate() - start.getDay());
      break;
    case "quarter": {
      const quarterStartMonth = Math.floor(start.getMonth() / 3) * 3;
      start.setMonth(quarterStartMonth, 1);
      break;
    }
    case "year":
      start.setMonth(0, 1);
      break;
    case "month":
    default:
      start.setDate(1);
      break;
  }

  return { start, end };
}

export function previousPeriodRange(range: { start: Date; end: Date }) {
  const durationMs = range.end.getTime() - range.start.getTime();
  const end = new Date(range.start.getTime() - 1);
  const start = new Date(end.getTime() - durationMs);
  return { start, end };
}

export function avg(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function hoursBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / (1000 * 60 * 60);
}

export const FATURADA_STATUSES = ["ENTREGUE", "FINALIZADO"] as const;
export const OPEN_STATUSES_FOR_DELAY = [
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
  "BLOQUEADO",
  "RETRABALHO",
];
