"use client";

import { useEffect, useState, useCallback } from "react";
import { Modal, StatusBadge, PriorityBadge } from "./ui";
import type { Category, Employee, Order, Session } from "@/app/lib/types";
import {
  ALL_STATUSES,
  BUDGET_STATUSES,
  BUDGET_STATUS_LABELS,
  ORDER_STATUS_LABELS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
  PHOTO_CATEGORIES,
  PHOTO_CATEGORY_LABELS,
  PRIORITIES,
  PRIORITY_LABELS,
  SERVICE_STATUSES,
  SERVICE_STATUS_LABELS,
  type AnyOrderStatus,
} from "@/app/lib/constants";
import { formatCurrency, formatDate, formatDateTime, osCode } from "@/app/lib/format";

type TabKey = "overview" | "services" | "budget" | "photos" | "timeline";

export default function OrderModal({
  orderId,
  session,
  onClose,
  onChanged,
}: {
  orderId: number;
  session: Session;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [order, setOrder] = useState<Order | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tab, setTab] = useState<TabKey>("overview");
  const [error, setError] = useState<string | null>(null);

  const isStaff = session.role === "PROPRIETARIO" || session.role === "GESTOR";

  const load = useCallback(() => {
    return fetch(`/api/orders/${orderId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setOrder(data);
      });
  }, [orderId]);

  useEffect(() => {
    load();
    fetch("/api/employees").then((r) => (r.ok ? r.json() : [])).then(setEmployees);
    fetch("/api/categories").then((r) => (r.ok ? r.json() : [])).then(setCategories);
  }, [load]);

  async function callApi(url: string, body: unknown, method = "PUT") {
    setError(null);
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Erro ao salvar");
      return null;
    }
    await load();
    onChanged();
    return data;
  }

  if (!order) {
    return (
      <Modal title={`OS`} onClose={onClose} wide>
        <p className="text-sm text-slate-400">Carregando...</p>
      </Modal>
    );
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: "overview", label: "Visão geral" },
    { key: "services", label: `Serviços (${order.services.length})` },
    { key: "budget", label: "Orçamento e pagamento" },
    { key: "photos", label: `Fotos (${order.photos?.length ?? 0})` },
    { key: "timeline", label: "Timeline" },
  ];

  return (
    <Modal title={`${osCode(order.id)} — ${order.client.name}`} onClose={onClose} wide>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <StatusBadge status={order.status} />
        <PriorityBadge priority={order.priority} />
        {order.isLate && (
          <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 px-2.5 py-0.5 text-xs font-medium">
            ⏰ Atrasada
          </span>
        )}
        <span className="text-sm text-slate-400 ml-auto">
          Valor final: <strong className="text-slate-700 dark:text-slate-200">{formatCurrency(order.valueFinal)}</strong>
        </span>
      </div>

      {isStaff && (
        <div className="flex items-center gap-2 mb-4">
          <label className="text-xs text-slate-500">Alterar status:</label>
          <select
            value={order.status}
            onChange={(e) => callApi(`/api/orders/${order.id}/status`, { status: e.target.value }, "POST")}
            className="rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-2 py-1 text-sm"
          >
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950 rounded-lg px-3 py-2 mb-3">{error}</p>}

      <div className="flex overflow-x-auto gap-1 border-b border-slate-200 dark:border-slate-800 mb-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab order={order} isStaff={isStaff} callApi={callApi} />}
      {tab === "services" && (
        <ServicesTab
          order={order}
          employees={employees}
          categories={categories}
          session={session}
          callApi={callApi}
          onReload={load}
        />
      )}
      {tab === "budget" && <BudgetTab order={order} isStaff={isStaff} callApi={callApi} />}
      {tab === "photos" && <PhotosTab order={order} onUploaded={load} />}
      {tab === "timeline" && <TimelineTab order={order} />}
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <div className="text-sm text-slate-700 dark:text-slate-200">{children}</div>
    </div>
  );
}

function OverviewTab({
  order,
  isStaff,
  callApi,
}: {
  order: Order;
  isStaff: boolean;
  callApi: (url: string, body: unknown, method?: string) => Promise<unknown>;
}) {
  const [deadline, setDeadline] = useState(order.expectedDeliveryDate?.slice(0, 10) ?? "");
  const [notes, setNotes] = useState(order.notes ?? "");
  const [reworkReason, setReworkReason] = useState("");
  const [showRework, setShowRework] = useState(false);

  const motor = [order.motorBrand, order.motorModel, order.motorYear, order.motorDisplacement]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Field label="Cliente">{order.client.name}</Field>
        <Field label="Telefone">{order.client.phone}</Field>
        <Field label="Motor">{motor || "—"}</Field>
        <Field label="Nº/Série do motor">{order.motorSerial || "—"}</Field>
        <Field label="Entrada">{formatDateTime(order.entryDate)}</Field>
        <Field label="Atendido por">{order.attendedBy?.name || "—"}</Field>
        <Field label="Origem">{order.origin || "—"}</Field>
        <Field label="Km">{order.motorMileage || "—"}</Field>
      </div>

      {isStaff && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Previsão de entrega</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-3 py-1.5 text-sm"
              />
              <button
                onClick={() => callApi(`/api/orders/${order.id}`, { expectedDeliveryDate: deadline || null })}
                className="px-3 py-1.5 text-sm rounded-lg bg-slate-800 text-white hover:bg-slate-700"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs text-slate-400 mb-1">Observações</label>
        <div className="flex gap-2">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-3 py-1.5 text-sm"
          />
          <button
            onClick={() => callApi(`/api/orders/${order.id}`, { notes })}
            className="px-3 py-1.5 text-sm rounded-lg bg-slate-800 text-white hover:bg-slate-700 h-fit"
          >
            Salvar
          </button>
        </div>
      </div>

      {isStaff && (
        <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
          {!showRework ? (
            <button onClick={() => setShowRework(true)} className="text-sm text-orange-600 hover:underline">
              ⚠ Marcar como retrabalho
            </button>
          ) : (
            <div className="space-y-2">
              <textarea
                placeholder="Motivo do retrabalho"
                value={reworkReason}
                onChange={(e) => setReworkReason(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-sm"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (!reworkReason.trim()) return;
                    await callApi(`/api/orders/${order.id}/rework`, { reason: reworkReason }, "POST");
                    setShowRework(false);
                    setReworkReason("");
                  }}
                  className="px-3 py-1.5 text-sm rounded-lg bg-orange-600 text-white hover:bg-orange-700"
                >
                  Confirmar retrabalho
                </button>
                <button onClick={() => setShowRework(false)} className="px-3 py-1.5 text-sm text-slate-500">
                  Cancelar
                </button>
              </div>
            </div>
          )}
          {order.reworks && order.reworks.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs text-slate-500">
              {order.reworks.map((r) => (
                <li key={r.id}>
                  {formatDate(r.occurredAt)} — {r.reason} {r.responsible ? `(${r.responsible.name})` : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function ServicesTab({
  order,
  employees,
  categories,
  session,
  callApi,
  onReload,
}: {
  order: Order;
  employees: Employee[];
  categories: Category[];
  session: Session;
  callApi: (url: string, body: unknown, method?: string) => Promise<unknown>;
  onReload: () => Promise<void>;
}) {
  const isStaff = session.role === "PROPRIETARIO" || session.role === "GESTOR";
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ categoryId: "", description: "", value: "", responsibleId: "", priority: "NORMAL" });

  async function addService() {
    if (!form.categoryId) return;
    await callApi(
      `/api/orders/${order.id}/services`,
      {
        categoryId: form.categoryId,
        description: form.description || null,
        value: Number(form.value) || 0,
        responsibleId: form.responsibleId || null,
        priority: form.priority,
      },
      "POST"
    );
    setForm({ categoryId: "", description: "", value: "", responsibleId: "", priority: "NORMAL" });
    setAdding(false);
  }

  return (
    <div className="space-y-3">
      {order.services.map((s) => {
        const canEdit = isStaff || s.responsibleId === session.userId;
        return (
          <div
            key={s.id}
            className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 flex flex-wrap items-center gap-3"
          >
            <div className="flex-1 min-w-[160px]">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{s.category.name}</p>
              {s.description && <p className="text-xs text-slate-400">{s.description}</p>}
            </div>
            <PriorityBadge priority={s.priority} />
            <span className="text-sm text-slate-600 dark:text-slate-300">{formatCurrency(s.value)}</span>
            <span className="text-xs text-slate-400">{s.responsible?.name || "Sem responsável"}</span>
            <select
              value={s.status}
              disabled={!canEdit}
              onChange={(e) =>
                callApi(`/api/orders/${order.id}/services/${s.id}`, { status: e.target.value })
              }
              className="rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-2 py-1 text-xs disabled:opacity-50"
            >
              {SERVICE_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {SERVICE_STATUS_LABELS[st]}
                </option>
              ))}
            </select>
            {isStaff && (
              <select
                value={s.responsibleId || ""}
                onChange={(e) =>
                  callApi(`/api/orders/${order.id}/services/${s.id}`, { responsibleId: e.target.value || null })
                }
                className="rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-2 py-1 text-xs"
              >
                <option value="">Sem responsável</option>
                {employees
                  .filter((e) => e.active)
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
              </select>
            )}
            {isStaff && (
              <button
                onClick={() =>
                  fetch(`/api/orders/${order.id}/services/${s.id}`, { method: "DELETE" }).then(onReload)
                }
                className="text-xs text-slate-400 hover:text-red-500"
              >
                Remover
              </button>
            )}
          </div>
        );
      })}

      {order.services.length === 0 && <p className="text-sm text-slate-400">Nenhum serviço lançado ainda.</p>}

      {isStaff && (
        <div className="pt-2">
          {!adding ? (
            <button onClick={() => setAdding(true)} className="text-sm text-blue-600 hover:underline">
              + Adicionar serviço
            </button>
          ) : (
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-2 py-1.5 text-sm"
                >
                  <option value="">Categoria...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <input
                  placeholder="Descrição"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-2 py-1.5 text-sm"
                />
                <input
                  placeholder="Valor"
                  type="number"
                  value={form.value}
                  onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-2 py-1.5 text-sm"
                />
                <select
                  value={form.responsibleId}
                  onChange={(e) => setForm((f) => ({ ...f, responsibleId: e.target.value }))}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-2 py-1.5 text-sm"
                >
                  <option value="">Responsável...</option>
                  {employees
                    .filter((e) => e.active)
                    .map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                </select>
                <select
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-2 py-1.5 text-sm"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={addService} className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                  Adicionar
                </button>
                <button onClick={() => setAdding(false)} className="px-3 py-1.5 text-sm text-slate-500">
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BudgetTab({
  order,
  isStaff,
  callApi,
}: {
  order: Order;
  isStaff: boolean;
  callApi: (url: string, body: unknown, method?: string) => Promise<unknown>;
}) {
  const [discount, setDiscount] = useState(String(order.discount));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Orçamento</p>
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
          {order.services.map((s) => (
            <div key={s.id} className="flex justify-between px-3 py-2 text-sm">
              <span>{s.category.name}</span>
              <span>{formatCurrency(s.value)}</span>
            </div>
          ))}
          <div className="flex justify-between px-3 py-2 text-sm text-slate-500">
            <span>Bruto</span>
            <span>{formatCurrency(order.valueGross)}</span>
          </div>
          <div className="flex justify-between px-3 py-2 text-sm text-slate-500">
            <span>Desconto</span>
            <span className="flex items-center gap-2">
              {isStaff ? (
                <>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-24 rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-2 py-0.5 text-right"
                  />
                  <button
                    onClick={() => callApi(`/api/orders/${order.id}/budget`, { discount: Number(discount) || 0 })}
                    className="text-blue-600 text-xs"
                  >
                    Salvar
                  </button>
                </>
              ) : (
                formatCurrency(order.discount)
              )}
            </span>
          </div>
          <div className="flex justify-between px-3 py-2 text-sm font-semibold">
            <span>Valor final</span>
            <span>{formatCurrency(order.valueFinal)}</span>
          </div>
        </div>

        {isStaff && (
          <div className="flex items-center gap-2 mt-3">
            <label className="text-xs text-slate-500">Status do orçamento:</label>
            <select
              value={order.budgetStatus}
              onChange={(e) => callApi(`/api/orders/${order.id}/budget`, { budgetStatus: e.target.value })}
              className="rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-2 py-1 text-sm"
            >
              {BUDGET_STATUSES.map((b) => (
                <option key={b} value={b}>
                  {BUDGET_STATUS_LABELS[b]}
                </option>
              ))}
            </select>
          </div>
        )}
        <p className="text-xs text-slate-400 mt-1">
          Enviado em {formatDateTime(order.budgetSentAt)} · Aprovado em {formatDateTime(order.budgetApprovedAt)}
        </p>
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Pagamento</p>
        <div className="flex flex-wrap gap-3">
          <select
            value={order.paymentMethod || ""}
            disabled={!isStaff}
            onChange={(e) => callApi(`/api/orders/${order.id}/payment`, { paymentMethod: e.target.value || null })}
            className="rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-2 py-1.5 text-sm disabled:opacity-60"
          >
            <option value="">Forma de pagamento...</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {PAYMENT_METHOD_LABELS[m]}
              </option>
            ))}
          </select>
          <select
            value={order.paymentStatus}
            disabled={!isStaff}
            onChange={(e) => callApi(`/api/orders/${order.id}/payment`, { paymentStatus: e.target.value })}
            className="rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-2 py-1.5 text-sm disabled:opacity-60"
          >
            {PAYMENT_STATUSES.map((p) => (
              <option key={p} value={p}>
                {PAYMENT_STATUS_LABELS[p]}
              </option>
            ))}
          </select>
        </div>
        {order.paymentDate && <p className="text-xs text-slate-400 mt-1">Pago em {formatDate(order.paymentDate)}</p>}
      </div>
    </div>
  );
}

function PhotosTab({ order, onUploaded }: { order: Order; onUploaded: () => void }) {
  const [category, setCategory] = useState<string>("EXECUCAO");
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);
    try {
      await fetch(`/api/orders/${order.id}/photos`, { method: "POST", body: formData });
      onUploaded();
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-2 py-1.5 text-sm"
        >
          {PHOTO_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {PHOTO_CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
        <label className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 cursor-pointer">
          {uploading ? "Enviando..." : "+ Adicionar foto"}
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
        </label>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(order.photos ?? []).map((p) => (
          <a key={p.id} href={p.url} target="_blank" rel="noreferrer" className="block group">
            {/* Fotos enviadas pela equipe (tamanho variável) — thumbnail simples, sem next/image. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt={p.category} className="w-full h-28 object-cover rounded-lg border border-slate-200 dark:border-slate-800" />
            <p className="text-[11px] text-slate-400 mt-1">{PHOTO_CATEGORY_LABELS[p.category as keyof typeof PHOTO_CATEGORY_LABELS] ?? p.category}</p>
          </a>
        ))}
        {(order.photos ?? []).length === 0 && <p className="text-sm text-slate-400 col-span-full">Nenhuma foto anexada.</p>}
      </div>
    </div>
  );
}

function TimelineTab({ order }: { order: Order }) {
  return (
    <ul className="space-y-3">
      {(order.statusHistory ?? []).map((h) => (
        <li key={h.id} className="flex gap-3 text-sm">
          <span className="text-slate-400 whitespace-nowrap">{formatDateTime(h.changedAt)}</span>
          <span className="text-slate-700 dark:text-slate-200">
            {h.fromStatus ? `${ORDER_STATUS_LABELS[h.fromStatus as AnyOrderStatus] ?? h.fromStatus} → ` : ""}
            <strong>{ORDER_STATUS_LABELS[h.toStatus as AnyOrderStatus] ?? h.toStatus}</strong>
            {h.changedBy ? ` — ${h.changedBy.name}` : ""}
            {h.note ? ` (${h.note})` : ""}
          </span>
        </li>
      ))}
      {(order.statusHistory ?? []).length === 0 && <p className="text-sm text-slate-400">Sem histórico ainda.</p>}
    </ul>
  );
}
