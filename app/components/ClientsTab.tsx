"use client";

import { useEffect, useState } from "react";
import type { Client, Order } from "@/app/lib/types";
import { CLIENT_TYPE_LABELS } from "@/app/lib/constants";
import { formatCurrency, formatDate, osCode } from "@/app/lib/format";
import { Modal, StatusBadge } from "./ui";

const CLASSIFICATION_LABELS: Record<string, string> = {
  NOVO: "Novo",
  RECORRENTE: "Recorrente",
  INATIVO: "Inativo",
  OFICINA_PARCEIRO: "Oficina/Parceiro",
};

const CLASSIFICATION_COLORS: Record<string, string> = {
  NOVO: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  RECORRENTE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  INATIVO: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  OFICINA_PARCEIRO: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
};

export default function ClientsTab({ onOpenOrder }: { onOpenOrder: (id: number) => void }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  function load(query?: string) {
    fetch(`/api/clients${query ? `?q=${encodeURIComponent(query)}` : ""}`)
      .then((r) => r.json())
      .then(setClients);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <input
          placeholder="Buscar por nome, telefone ou documento..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load(q)}
          className="flex-1 max-w-md rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-sm"
        />
        <button onClick={() => load(q)} className="px-3 py-2 text-sm rounded-lg bg-slate-800 text-white">
          Buscar
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <th className="px-4 py-2">Nome</th>
              <th className="px-4 py-2">Telefone</th>
              <th className="px-4 py-2">Tipo</th>
              <th className="px-4 py-2">Classificação</th>
              <th className="px-4 py-2">OS</th>
              <th className="px-4 py-2">Faturamento</th>
              <th className="px-4 py-2">Ticket médio</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr
                key={c.id}
                onClick={() => setSelected(c.id)}
                className="border-b last:border-0 border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <td className="px-4 py-2 font-medium text-slate-700 dark:text-slate-200">{c.name}</td>
                <td className="px-4 py-2 text-slate-500">{c.phone}</td>
                <td className="px-4 py-2 text-slate-500">{CLIENT_TYPE_LABELS[c.type as keyof typeof CLIENT_TYPE_LABELS] ?? c.type}</td>
                <td className="px-4 py-2">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${CLASSIFICATION_COLORS[c.classification ?? "NOVO"]}`}>
                    {CLASSIFICATION_LABELS[c.classification ?? "NOVO"]}
                  </span>
                </td>
                <td className="px-4 py-2 text-slate-500">{c.ordersCount ?? 0}</td>
                <td className="px-4 py-2 text-slate-500">{formatCurrency(c.revenue)}</td>
                <td className="px-4 py-2 text-slate-500">{formatCurrency(c.avgTicket)}</td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  Nenhum cliente encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <ClientDetailModal clientId={selected} onClose={() => setSelected(null)} onOpenOrder={onOpenOrder} />
      )}
    </div>
  );
}

interface ClientDetail extends Client {
  orders: (Order & { valueGross: number; valueFinal: number })[];
}

function ClientDetailModal({
  clientId,
  onClose,
  onOpenOrder,
}: {
  clientId: string;
  onClose: () => void;
  onOpenOrder: (id: number) => void;
}) {
  const [client, setClient] = useState<ClientDetail | null>(null);

  useEffect(() => {
    fetch(`/api/clients/${clientId}`)
      .then((r) => r.json())
      .then(setClient);
  }, [clientId]);

  if (!client) {
    return (
      <Modal title="Cliente" onClose={onClose}>
        <p className="text-sm text-slate-400">Carregando...</p>
      </Modal>
    );
  }

  return (
    <Modal title={client.name} onClose={onClose} wide>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        <div>
          <p className="text-xs text-slate-400">Telefone</p>
          <p className="text-sm text-slate-700 dark:text-slate-200">{client.phone}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Cidade</p>
          <p className="text-sm text-slate-700 dark:text-slate-200">{client.city || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Primeira OS</p>
          <p className="text-sm text-slate-700 dark:text-slate-200">{formatDate(client.firstOrderDate)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Última OS</p>
          <p className="text-sm text-slate-700 dark:text-slate-200">{formatDate(client.lastOrderDate)}</p>
        </div>
      </div>

      <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Histórico de OS</p>
      <ul className="space-y-2">
        {client.orders.map((o) => (
          <li
            key={o.id}
            onClick={() => onOpenOrder(o.id)}
            className="cursor-pointer rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{osCode(o.id)}</span>
            <span className="text-xs text-slate-400">{formatDate(o.entryDate)}</span>
            <StatusBadge status={o.status} />
            <span className="text-sm text-slate-600 dark:text-slate-300">{formatCurrency(o.valueFinal)}</span>
          </li>
        ))}
        {client.orders.length === 0 && <p className="text-sm text-slate-400">Nenhuma OS registrada.</p>}
      </ul>
    </Modal>
  );
}
