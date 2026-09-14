"use client";

import { useEffect, useState } from "react";
import { Modal } from "./ui";
import type { Client } from "@/app/lib/types";
import { CLIENT_TYPE_LABELS, CLIENT_TYPES, ORIGIN_LABELS, ORIGINS } from "@/app/lib/constants";

export default function NewOrderModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (orderId: number) => void;
}) {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState<string>("");
  const [isNewClient, setIsNewClient] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    newClientName: "",
    newClientPhone: "",
    newClientType: "PESSOA_FISICA",
    motorBrand: "",
    motorModel: "",
    motorYear: "",
    motorDisplacement: "",
    expectedDeliveryDate: "",
    origin: "",
    notes: "",
  });

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then(setClients)
      .catch(() => {});
  }, []);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isNewClient && !clientId) {
      setError("Selecione um cliente ou cadastre um novo");
      return;
    }
    if (isNewClient && (!form.newClientName.trim() || !form.newClientPhone.trim())) {
      setError("Informe nome e telefone do novo cliente");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: isNewClient ? undefined : clientId,
          newClient: isNewClient
            ? { name: form.newClientName, phone: form.newClientPhone, type: form.newClientType }
            : undefined,
          motorBrand: form.motorBrand || null,
          motorModel: form.motorModel || null,
          motorYear: form.motorYear || null,
          motorDisplacement: form.motorDisplacement || null,
          expectedDeliveryDate: form.expectedDeliveryDate || null,
          origin: form.origin || null,
          notes: form.notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao criar OS");
        return;
      }
      onCreated(data.id);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Nova Ordem de Serviço" onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Cliente</p>
            <button
              type="button"
              onClick={() => setIsNewClient((v) => !v)}
              className="text-xs text-blue-600 hover:underline"
            >
              {isNewClient ? "Selecionar cliente existente" : "+ Novo cliente"}
            </button>
          </div>

          {!isNewClient ? (
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-sm"
            >
              <option value="">Selecione...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.phone}
                </option>
              ))}
            </select>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                placeholder="Nome"
                value={form.newClientName}
                onChange={(e) => set("newClientName", e.target.value)}
                className="rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-sm"
              />
              <input
                placeholder="Telefone"
                value={form.newClientPhone}
                onChange={(e) => set("newClientPhone", e.target.value)}
                className="rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-sm"
              />
              <select
                value={form.newClientType}
                onChange={(e) => set("newClientType", e.target.value)}
                className="rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-sm"
              >
                {CLIENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {CLIENT_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Motor</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <input
              placeholder="Marca"
              value={form.motorBrand}
              onChange={(e) => set("motorBrand", e.target.value)}
              className="rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-sm"
            />
            <input
              placeholder="Modelo"
              value={form.motorModel}
              onChange={(e) => set("motorModel", e.target.value)}
              className="rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-sm"
            />
            <input
              placeholder="Ano"
              value={form.motorYear}
              onChange={(e) => set("motorYear", e.target.value)}
              className="rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-sm"
            />
            <input
              placeholder="Cilindrada"
              value={form.motorDisplacement}
              onChange={(e) => set("motorDisplacement", e.target.value)}
              className="rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Ordem de serviço</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Previsão de entrega</label>
              <input
                type="date"
                value={form.expectedDeliveryDate}
                onChange={(e) => set("expectedDeliveryDate", e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Origem do cliente</label>
              <select
                value={form.origin}
                onChange={(e) => set("origin", e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-sm"
              >
                <option value="">—</option>
                {ORIGINS.map((o) => (
                  <option key={o} value={o}>
                    {ORIGIN_LABELS[o]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <textarea
            placeholder="Observações"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            className="mt-3 w-full rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-sm"
            rows={2}
          />
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-medium"
          >
            {saving ? "Criando..." : "Criar OS"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
