"use client";

import { useEffect, useState } from "react";
import type { Session } from "@/app/lib/types";
import { StatCard, SectionTitle } from "./ui";
import { formatCurrency, formatDays, formatHours, formatPercent } from "@/app/lib/format";
import { ORDER_STATUS_LABELS, type AnyOrderStatus } from "@/app/lib/constants";

interface DashboardData {
  financial: {
    revenueToday: number;
    revenueMonth: number;
    revenueYear: number;
    revenuePeriod: number;
    revenuePrevPeriod: number;
    avgTicket: number | null;
    amountReceivable: number;
  };
  commercial: {
    ordersCount: number;
    ordersCountPrev: number;
    newClients: number;
    recurringClients: number;
    conversionRate: number | null;
    budgetsSent: number;
    budgetsApproved: number;
    totalBudgeted: number;
    totalApproved: number;
  };
  operation: {
    ordersByStatus: Record<string, number>;
    lateCount: number;
    openCount: number;
    completedInPeriod: number;
    avgExecutionHours: number | null;
    medianExecutionHours: number | null;
    avgLeadTimeDays: number | null;
    medianLeadTimeDays: number | null;
    onTimeDeliveryRate: number | null;
    revenueByService: { category: string; revenue: number }[];
  };
  quality: { reworkCount: number; reworkRate: number | null; onTimeDeliveryRate: number | null };
  management: { pendingServicesCount: number; lateServicesCount: number; ownerInterventionsCount: number };
  productivityByEmployee: {
    employeeId: string;
    name: string;
    servicesAssigned: number;
    servicesCompleted: number;
    avgDurationHours: number | null;
    revenue: number;
  }[];
  goal: {
    revenueTarget: number | null;
    ordersTarget: number | null;
    avgTicketTarget: number | null;
    conversionTarget: number | null;
    maxReworkRate: number | null;
  } | null;
}

const PERIODS: { key: string; label: string }[] = [
  { key: "today", label: "Hoje" },
  { key: "week", label: "Semana" },
  { key: "month", label: "Mês" },
  { key: "quarter", label: "Trimestre" },
  { key: "year", label: "Ano" },
];

export default function DashboardTab({ session }: { session: Session }) {
  const [period, setPeriod] = useState("month");
  const [data, setData] = useState<DashboardData | null>(null);
  const isStaff = session.role === "PROPRIETARIO" || session.role === "GESTOR";

  useEffect(() => {
    fetch(`/api/dashboard?period=${period}`)
      .then((r) => r.json())
      .then(setData);
  }, [period]);

  if (!data) return <p className="text-sm text-slate-400">Carregando indicadores...</p>;

  const revenueDelta =
    data.financial.revenuePrevPeriod > 0
      ? (data.financial.revenuePeriod - data.financial.revenuePrevPeriod) / data.financial.revenuePrevPeriod
      : null;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              period === p.key ? "bg-blue-600 text-white" : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <section>
        <SectionTitle>Financeiro</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Faturamento hoje" value={formatCurrency(data.financial.revenueToday)} />
          <StatCard label="Faturamento do mês" value={formatCurrency(data.financial.revenueMonth)} />
          <StatCard
            label="Faturamento no período"
            value={formatCurrency(data.financial.revenuePeriod)}
            hint={revenueDelta !== null ? `${revenueDelta >= 0 ? "▲" : "▼"} ${formatPercent(Math.abs(revenueDelta))} vs. período anterior` : undefined}
          />
          <StatCard label="Ticket médio" value={formatCurrency(data.financial.avgTicket)} />
          <StatCard label="Faturamento acumulado no ano" value={formatCurrency(data.financial.revenueYear)} />
          <StatCard label="A receber" value={formatCurrency(data.financial.amountReceivable)} tone="warning" />
        </div>
      </section>

      <section>
        <SectionTitle>Comercial</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="OS no período" value={data.commercial.ordersCount} />
          <StatCard label="Novos clientes" value={data.commercial.newClients} tone="success" />
          <StatCard label="Clientes recorrentes" value={data.commercial.recurringClients} />
          <StatCard label="Taxa de conversão" value={formatPercent(data.commercial.conversionRate)} />
          <StatCard label="Orçamentos enviados" value={data.commercial.budgetsSent} />
          <StatCard label="Valor orçado" value={formatCurrency(data.commercial.totalBudgeted)} />
          <StatCard label="Valor aprovado" value={formatCurrency(data.commercial.totalApproved)} />
        </div>
      </section>

      <section>
        <SectionTitle>Operação</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="OS abertas" value={data.operation.openCount} />
          <StatCard label="OS atrasadas" value={data.operation.lateCount} tone={data.operation.lateCount > 0 ? "danger" : "success"} />
          <StatCard label="Concluídas no período" value={data.operation.completedInPeriod} />
          <StatCard label="Tempo médio de execução" value={formatHours(data.operation.avgExecutionHours)} hint={`mediana: ${formatHours(data.operation.medianExecutionHours)}`} />
          <StatCard label="Prazo médio (entrada→entrega)" value={formatDays(data.operation.avgLeadTimeDays)} hint={`mediana: ${formatDays(data.operation.medianLeadTimeDays)}`} />
          <StatCard label="Entregas no prazo" value={formatPercent(data.operation.onTimeDeliveryRate)} />
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {Object.entries(data.operation.ordersByStatus).map(([status, count]) => (
            <div key={status} className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2">
              <p className="text-[11px] text-slate-400">{ORDER_STATUS_LABELS[status as AnyOrderStatus] ?? status}</p>
              <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">{count}</p>
            </div>
          ))}
        </div>

        {data.operation.revenueByService.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-slate-500 mb-2">Faturamento por serviço</p>
            <div className="space-y-1">
              {data.operation.revenueByService.slice(0, 8).map((r) => {
                const max = data.operation.revenueByService[0]?.revenue || 1;
                return (
                  <div key={r.category} className="flex items-center gap-2 text-sm">
                    <span className="w-32 truncate text-slate-500">{r.category}</span>
                    <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div className="bg-blue-500 h-2" style={{ width: `${(r.revenue / max) * 100}%` }} />
                    </div>
                    <span className="w-24 text-right text-slate-600 dark:text-slate-300">{formatCurrency(r.revenue)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <section>
        <SectionTitle>Qualidade</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard label="Retrabalhos no período" value={data.quality.reworkCount} tone={data.quality.reworkCount > 0 ? "warning" : "success"} />
          <StatCard label="Taxa de retrabalho" value={formatPercent(data.quality.reworkRate)} />
          <StatCard label="Entregas no prazo" value={formatPercent(data.quality.onTimeDeliveryRate)} />
        </div>
      </section>

      <section>
        <SectionTitle>Gestão</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard label="Serviços pendentes" value={data.management.pendingServicesCount} />
          <StatCard label="Serviços atrasados" value={data.management.lateServicesCount} tone={data.management.lateServicesCount > 0 ? "danger" : "success"} />
          <StatCard label="Intervenções do proprietário" value={data.management.ownerInterventionsCount} hint="Objetivo: reduzir ao longo dos meses" />
        </div>
        {isStaff && <InterventionsPanel period={period} />}
      </section>

      {data.productivityByEmployee.length > 0 && (
        <section>
          <SectionTitle>Produtividade por funcionário</SectionTitle>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-4 py-2">Funcionário</th>
                  <th className="px-4 py-2">Atribuídos</th>
                  <th className="px-4 py-2">Concluídos</th>
                  <th className="px-4 py-2">Tempo médio</th>
                  <th className="px-4 py-2">Faturamento</th>
                </tr>
              </thead>
              <tbody>
                {data.productivityByEmployee.map((e) => (
                  <tr key={e.employeeId} className="border-b last:border-0 border-slate-100 dark:border-slate-800">
                    <td className="px-4 py-2 font-medium text-slate-700 dark:text-slate-200">{e.name}</td>
                    <td className="px-4 py-2">{e.servicesAssigned}</td>
                    <td className="px-4 py-2">{e.servicesCompleted}</td>
                    <td className="px-4 py-2">{formatHours(e.avgDurationHours)}</td>
                    <td className="px-4 py-2">{formatCurrency(e.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {data.goal && (
        <section>
          <SectionTitle>Meta do mês</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {data.goal.revenueTarget != null && (
              <GoalCard label="Faturamento" realized={data.financial.revenueMonth} target={data.goal.revenueTarget} format={formatCurrency} />
            )}
            {data.goal.ordersTarget != null && (
              <GoalCard label="OS no mês" realized={data.commercial.ordersCount} target={data.goal.ordersTarget} format={(v) => String(v)} />
            )}
            {data.goal.avgTicketTarget != null && (
              <GoalCard label="Ticket médio" realized={data.financial.avgTicket ?? 0} target={data.goal.avgTicketTarget} format={formatCurrency} />
            )}
            {data.goal.conversionTarget != null && (
              <GoalCard label="Conversão" realized={data.commercial.conversionRate ?? 0} target={data.goal.conversionTarget} format={formatPercent} />
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function GoalCard({
  label,
  realized,
  target,
  format,
}: {
  label: string;
  realized: number;
  target: number;
  format: (v: number) => string;
}) {
  const pct = target > 0 ? realized / target : 0;
  return (
    <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-800 dark:text-slate-100">
        {format(realized)} <span className="text-xs font-normal text-slate-400">/ {format(target)}</span>
      </p>
      <div className="mt-2 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 ${pct >= 1 ? "bg-emerald-500" : "bg-blue-500"}`}
          style={{ width: `${Math.min(100, pct * 100)}%` }}
        />
      </div>
      <p className="text-[11px] text-slate-400 mt-1">{formatPercent(pct)} da meta</p>
    </div>
  );
}

interface InterventionEntry {
  id: string;
  category: string;
  description: string;
  solution: string | null;
  occurredAt: string;
  order?: { id: number } | null;
}

function InterventionsPanel({ period }: { period: string }) {
  const [items, setItems] = useState<InterventionEntry[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ category: "", description: "", solution: "", orderId: "" });

  function load() {
    fetch(`/api/interventions?period=${period}`)
      .then((r) => r.json())
      .then(setItems);
  }

  useEffect(load, [period]);

  async function submit() {
    if (!form.category.trim() || !form.description.trim()) return;
    await fetch("/api/interventions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, orderId: form.orderId || undefined }),
    });
    setForm({ category: "", description: "", solution: "", orderId: "" });
    setAdding(false);
    load();
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-slate-500">Intervenções do proprietário no período</p>
        <button onClick={() => setAdding((v) => !v)} className="text-xs text-blue-600 hover:underline">
          + Registrar intervenção
        </button>
      </div>

      {adding && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 mb-3 space-y-2 bg-white dark:bg-slate-900">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              placeholder="Categoria"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-2 py-1.5 text-sm"
            />
            <input
              placeholder="Nº da OS (opcional)"
              value={form.orderId}
              onChange={(e) => setForm((f) => ({ ...f, orderId: e.target.value }))}
              className="rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-2 py-1.5 text-sm"
            />
          </div>
          <textarea
            placeholder="Descrição do problema"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-2 py-1.5 text-sm"
            rows={2}
          />
          <textarea
            placeholder="Solução aplicada"
            value={form.solution}
            onChange={(e) => setForm((f) => ({ ...f, solution: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-2 py-1.5 text-sm"
            rows={2}
          />
          <button onClick={submit} className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700">
            Salvar
          </button>
        </div>
      )}

      <ul className="space-y-2">
        {items.map((i) => (
          <li key={i.id} className="text-sm rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2">
            <p className="text-slate-700 dark:text-slate-200">
              <strong>{i.category}</strong> {i.order ? `— OS-${String(i.order.id).padStart(6, "0")}` : ""}
            </p>
            <p className="text-slate-500">{i.description}</p>
            {i.solution && <p className="text-emerald-600 text-xs mt-1">Solução: {i.solution}</p>}
          </li>
        ))}
        {items.length === 0 && <li className="text-sm text-slate-400">Nenhuma intervenção registrada no período.</li>}
      </ul>
    </div>
  );
}
