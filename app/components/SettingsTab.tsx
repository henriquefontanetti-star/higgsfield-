"use client";

import { useEffect, useState } from "react";
import type { Category } from "@/app/lib/types";
import { SectionTitle } from "./ui";

// A visibilidade desta aba já é controlada pelo AppShell (apenas
// proprietário/gestor), então nenhuma prop de sessão é necessária aqui.
export default function SettingsTab() {
  return (
    <div className="space-y-8 max-w-2xl">
      <CategoriesSection />
      <GoalsSection />
    </div>
  );
}

function CategoriesSection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");

  function load() {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories);
  }

  useEffect(load, []);

  async function add() {
    if (!name.trim()) return;
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setName("");
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <section>
      <SectionTitle>Categorias de serviço</SectionTitle>
      <div className="flex gap-2 mb-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Nova categoria..."
          className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-sm"
        />
        <button onClick={add} className="px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700">
          Adicionar
        </button>
      </div>
      <ul className="space-y-1">
        {categories.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm"
          >
            {c.name}
            <button onClick={() => remove(c.id)} className="text-xs text-slate-400 hover:text-red-500">
              Desativar
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function GoalsSection() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [form, setForm] = useState({
    revenueTarget: "",
    ordersTarget: "",
    avgTicketTarget: "",
    conversionTarget: "",
    maxReworkRate: "",
    maxAvgDeadlineDays: "",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/goals?month=${month}&year=${year}`)
      .then((r) => r.json())
      .then((goal) => {
        if (!goal) {
          setForm({ revenueTarget: "", ordersTarget: "", avgTicketTarget: "", conversionTarget: "", maxReworkRate: "", maxAvgDeadlineDays: "" });
          return;
        }
        setForm({
          revenueTarget: goal.revenueTarget?.toString() ?? "",
          ordersTarget: goal.ordersTarget?.toString() ?? "",
          avgTicketTarget: goal.avgTicketTarget?.toString() ?? "",
          conversionTarget: goal.conversionTarget?.toString() ?? "",
          maxReworkRate: goal.maxReworkRate?.toString() ?? "",
          maxAvgDeadlineDays: goal.maxAvgDeadlineDays?.toString() ?? "",
        });
      });
  }, [month, year]);

  async function save() {
    setSaved(false);
    await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        month,
        year,
        revenueTarget: form.revenueTarget ? Number(form.revenueTarget) : null,
        ordersTarget: form.ordersTarget ? Number(form.ordersTarget) : null,
        avgTicketTarget: form.avgTicketTarget ? Number(form.avgTicketTarget) : null,
        conversionTarget: form.conversionTarget ? Number(form.conversionTarget) : null,
        maxReworkRate: form.maxReworkRate ? Number(form.maxReworkRate) : null,
        maxAvgDeadlineDays: form.maxAvgDeadlineDays ? Number(form.maxAvgDeadlineDays) : null,
      }),
    });
    setSaved(true);
  }

  return (
    <section>
      <SectionTitle>Metas mensais</SectionTitle>
      <div className="flex gap-2 mb-3">
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-2 py-1.5 text-sm">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="w-24 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-2 py-1.5 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <LabeledInput label="Faturamento (R$)" value={form.revenueTarget} onChange={(v) => setForm((f) => ({ ...f, revenueTarget: v }))} />
        <LabeledInput label="Quantidade de OS" value={form.ordersTarget} onChange={(v) => setForm((f) => ({ ...f, ordersTarget: v }))} />
        <LabeledInput label="Ticket médio (R$)" value={form.avgTicketTarget} onChange={(v) => setForm((f) => ({ ...f, avgTicketTarget: v }))} />
        <LabeledInput label="Conversão (0 a 1)" value={form.conversionTarget} onChange={(v) => setForm((f) => ({ ...f, conversionTarget: v }))} />
        <LabeledInput label="Retrabalho máximo (0 a 1)" value={form.maxReworkRate} onChange={(v) => setForm((f) => ({ ...f, maxReworkRate: v }))} />
        <LabeledInput label="Prazo médio máximo (dias)" value={form.maxAvgDeadlineDays} onChange={(v) => setForm((f) => ({ ...f, maxAvgDeadlineDays: v }))} />
      </div>
      <button onClick={save} className="mt-3 px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700">
        Salvar metas
      </button>
      {saved && <span className="ml-3 text-sm text-emerald-600">Salvo!</span>}
    </section>
  );
}

function LabeledInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="block text-xs text-slate-400 mb-1">{label}</span>
      <input
        type="number"
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-3 py-1.5 text-sm"
      />
    </label>
  );
}
