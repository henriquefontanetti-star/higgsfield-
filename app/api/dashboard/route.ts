import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireSession } from "@/app/lib/api-auth";
import {
  FATURADA_STATUSES,
  avg,
  computeOrderValue,
  getPeriodRange,
  hoursBetween,
  median,
  previousPeriodRange,
  type PeriodKey,
} from "@/app/lib/metrics";
import { isOrderLate } from "@/app/lib/orders";

// Todo o conteúdo deste endpoint é calculado a partir dos dados operacionais
// (OS, serviços, orçamentos, retrabalhos, intervenções) — nenhum indicador é
// digitado manualmente (seção 23 do escopo do produto).
export async function GET(request: Request) {
  const { session, response } = await requireSession();
  if (!session) return response;

  const { searchParams } = new URL(request.url);
  const period = (searchParams.get("period") as PeriodKey) || "month";
  const range = getPeriodRange(period, searchParams.get("from"), searchParams.get("to"));
  const prevRange = previousPeriodRange(range);

  const [allOrders, ordersInPeriod, ordersInPrevPeriod, allClients, reworksInPeriod, interventionsInPeriod] =
    await Promise.all([
      prisma.serviceOrder.findMany({
        include: { services: { include: { category: true } } },
      }),
      prisma.serviceOrder.findMany({
        where: { entryDate: { gte: range.start, lte: range.end } },
        include: { services: { include: { category: true } }, client: true },
      }),
      prisma.serviceOrder.findMany({
        where: { entryDate: { gte: prevRange.start, lte: prevRange.end } },
        include: { services: true },
      }),
      prisma.client.findMany({ include: { orders: { select: { entryDate: true, isCanceled: true } } } }),
      prisma.rework.findMany({ where: { occurredAt: { gte: range.start, lte: range.end } } }),
      prisma.ownerIntervention.findMany({ where: { occurredAt: { gte: range.start, lte: range.end } } }),
    ]);

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  // ---- Financeiro -------------------------------------------------------
  const billedOf = (orders: typeof allOrders) =>
    orders.filter((o) => !o.isCanceled && FATURADA_STATUSES.includes(o.status as (typeof FATURADA_STATUSES)[number]));

  const revenueOf = (orders: typeof allOrders, from?: Date, to?: Date) =>
    billedOf(orders)
      .filter((o) => {
        const billingDate = o.deliveredAt || o.updatedAt;
        if (from && billingDate < from) return false;
        if (to && billingDate > to) return false;
        return true;
      })
      .reduce((sum, o) => sum + computeOrderValue(o).final, 0);

  const revenueToday = revenueOf(allOrders, todayStart, now);
  const monthRange = getPeriodRange("month");
  const revenueMonth = revenueOf(allOrders, monthRange.start, monthRange.end);
  const yearRange = getPeriodRange("year");
  const revenueYear = revenueOf(allOrders, yearRange.start, yearRange.end);
  const revenuePeriod = revenueOf(allOrders, range.start, range.end);
  const revenuePrevPeriod = revenueOf(allOrders, prevRange.start, prevRange.end);

  const billedInPeriod = billedOf(allOrders).filter((o) => {
    const billingDate = o.deliveredAt || o.updatedAt;
    return billingDate >= range.start && billingDate <= range.end;
  });
  const avgTicket = billedInPeriod.length > 0 ? revenuePeriod / billedInPeriod.length : null;

  const amountReceivable = allOrders
    .filter((o) => !o.isCanceled && o.paymentStatus !== "PAGO")
    .filter((o) => FATURADA_STATUSES.includes(o.status as (typeof FATURADA_STATUSES)[number]) || o.budgetStatus === "APROVADO")
    .reduce((sum, o) => sum + computeOrderValue(o).final, 0);

  // ---- Comercial ----------------------------------------------------------
  const ordersCount = ordersInPeriod.length;
  const ordersCountPrev = ordersInPrevPeriod.length;

  const sentBudgets = ordersInPeriod.filter((o) => o.budgetSentAt);
  const approvedBudgets = ordersInPeriod.filter((o) => o.budgetApprovedAt);
  const conversionRate = sentBudgets.length > 0 ? approvedBudgets.length / sentBudgets.length : null;
  const totalBudgeted = ordersInPeriod.reduce((sum, o) => sum + computeOrderValue(o).gross, 0);
  const totalApproved = ordersInPeriod
    .filter((o) => o.budgetStatus === "APROVADO")
    .reduce((sum, o) => sum + computeOrderValue(o).final, 0);

  let newClients = 0;
  let recurringClients = 0;
  for (const client of allClients) {
    const validDates = client.orders
      .filter((o) => !o.isCanceled)
      .map((o) => o.entryDate)
      .sort((a, b) => a.getTime() - b.getTime());
    const inPeriod = validDates.filter((d) => d >= range.start && d <= range.end);
    if (inPeriod.length === 0) continue;
    const firstEver = validDates[0];
    if (firstEver >= range.start && firstEver <= range.end) {
      newClients += 1;
    } else {
      recurringClients += 1;
    }
  }

  // ---- Operação (estado atual, independente do período) ------------------
  const ordersByStatus: Record<string, number> = {};
  for (const o of allOrders) {
    if (o.isCanceled) continue;
    ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
  }
  const lateOrders = allOrders.filter((o) => isOrderLate(o));
  const openOrders = allOrders.filter(
    (o) => !o.isCanceled && !["ENTREGUE", "FINALIZADO"].includes(o.status)
  );

  const completedInPeriod = ordersInPeriod.filter(
    (o) => !o.isCanceled && (o.status === "ENTREGUE" || o.status === "FINALIZADO")
  );
  const executionDurationsHours = completedInPeriod
    .filter((o) => o.executionStartedAt && o.executionEndedAt)
    .map((o) => hoursBetween(o.executionStartedAt!, o.executionEndedAt!));
  const leadTimeDays = completedInPeriod
    .filter((o) => o.deliveredAt)
    .map((o) => hoursBetween(o.entryDate, o.deliveredAt!) / 24);

  const deliveredWithDeadline = completedInPeriod.filter((o) => o.deliveredAt && o.expectedDeliveryDate);
  const onTimeCount = deliveredWithDeadline.filter((o) => o.deliveredAt! <= o.expectedDeliveryDate!).length;
  const onTimeDeliveryRate = deliveredWithDeadline.length > 0 ? onTimeCount / deliveredWithDeadline.length : null;

  // ---- Qualidade -----------------------------------------------------------
  const reworkCount = reworksInPeriod.length;
  const reworkRate = completedInPeriod.length > 0 ? reworkCount / completedInPeriod.length : null;

  // ---- Faturamento / serviços mais vendidos --------------------------------
  const revenueByCategory = new Map<string, number>();
  for (const o of billedInPeriod) {
    for (const s of o.services) {
      const key = s.category.name;
      revenueByCategory.set(key, (revenueByCategory.get(key) || 0) + s.value);
    }
  }
  const revenueByService = Array.from(revenueByCategory.entries())
    .map(([category, revenue]) => ({ category, revenue }))
    .sort((a, b) => b.revenue - a.revenue);

  // ---- Produtividade por funcionário ----------------------------------------
  const employees = await prisma.user.findMany({
    where: { active: true },
    select: { id: true, name: true, role: true },
  });
  const serviceItemsInPeriod = await prisma.serviceItem.findMany({
    where: { order: { entryDate: { gte: range.start, lte: range.end } } },
    include: { order: { select: { status: true, isCanceled: true } } },
  });
  const productivityByEmployee = employees
    .filter((e) => e.role !== "PROPRIETARIO")
    .map((employee) => {
      const items = serviceItemsInPeriod.filter((s) => s.responsibleId === employee.id);
      const completed = items.filter((s) => s.status === "CONCLUIDO");
      const durations = completed
        .filter((s) => s.startedAt && s.completedAt)
        .map((s) => hoursBetween(s.startedAt!, s.completedAt!));
      const revenue = items
        .filter((s) => !s.order.isCanceled && FATURADA_STATUSES.includes(s.order.status as (typeof FATURADA_STATUSES)[number]))
        .reduce((sum, s) => sum + s.value, 0);
      return {
        employeeId: employee.id,
        name: employee.name,
        servicesAssigned: items.length,
        servicesCompleted: completed.length,
        avgDurationHours: avg(durations),
        revenue,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  // ---- Gestão / dependência do proprietário ---------------------------------
  const pendingServicesCount = await prisma.serviceItem.count({ where: { status: { not: "CONCLUIDO" } } });
  const lateServicesCount = await prisma.serviceItem.count({
    where: { status: { not: "CONCLUIDO" }, deadline: { lt: now } },
  });

  // ---- Meta do mês corrente -------------------------------------------------
  const goal = await prisma.goal.findUnique({
    where: { month_year: { month: now.getMonth() + 1, year: now.getFullYear() } },
  });

  return NextResponse.json({
    period: { key: period, start: range.start, end: range.end },
    financial: {
      revenueToday,
      revenueMonth,
      revenueYear,
      revenuePeriod,
      revenuePrevPeriod,
      avgTicket,
      amountReceivable,
    },
    commercial: {
      ordersCount,
      ordersCountPrev,
      newClients,
      recurringClients,
      conversionRate,
      budgetsSent: sentBudgets.length,
      budgetsApproved: approvedBudgets.length,
      totalBudgeted,
      totalApproved,
    },
    operation: {
      ordersByStatus,
      lateCount: lateOrders.length,
      openCount: openOrders.length,
      completedInPeriod: completedInPeriod.length,
      avgExecutionHours: avg(executionDurationsHours),
      medianExecutionHours: median(executionDurationsHours),
      avgLeadTimeDays: avg(leadTimeDays),
      medianLeadTimeDays: median(leadTimeDays),
      onTimeDeliveryRate,
      revenueByService,
    },
    quality: {
      reworkCount,
      reworkRate,
      onTimeDeliveryRate,
    },
    management: {
      pendingServicesCount,
      lateServicesCount,
      ownerInterventionsCount: interventionsInPeriod.length,
    },
    productivityByEmployee,
    goal,
  });
}
