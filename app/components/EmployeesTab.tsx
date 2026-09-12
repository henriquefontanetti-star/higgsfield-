"use client";

import { useEffect, useState } from "react";
import type { Employee, Session } from "@/app/lib/types";
import { ROLES, ROLE_LABELS } from "@/app/lib/constants";
import { formatCurrency, formatHours } from "@/app/lib/format";
import { Modal } from "./ui";

export default function EmployeesTab({ session }: { session: Session }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  function load() {
    fetch("/api/employees")
      .then((r) => r.json())
      .then(setEmployees);
  }

  useEffect(load, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Equipe</h2>
        <button onClick={() => setShowNew(true)} className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700">
          + Novo funcionário
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <th className="px-4 py-2">Nome</th>
              <th className="px-4 py-2">Papel</th>
              <th className="px-4 py-2">Função</th>
              <th className="px-4 py-2">Serviços lançados</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr
                key={e.id}
                onClick={() => setSelected(e.id)}
                className="border-b last:border-0 border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <td className="px-4 py-2 font-medium text-slate-700 dark:text-slate-200">{e.name}</td>
                <td className="px-4 py-2 text-slate-500">{ROLE_LABELS[e.role]}</td>
                <td className="px-4 py-2 text-slate-500">{e.position || "—"}</td>
                <td className="px-4 py-2 text-slate-500">{e._count?.serviceItems ?? 0}</td>
                <td className="px-4 py-2">
                  <span className={e.active ? "text-emerald-600" : "text-slate-400"}>{e.active ? "Ativo" : "Inativo"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showNew && (
        <NewEmployeeModal
          session={session}
          onClose={() => setShowNew(false)}
          onCreated={() => {
            setShowNew(false);
            load();
          }}
        />
      )}
      {selected && <EmployeeDetailModal employeeId={selected} onClose={() => setSelected(null)} onChanged={load} />}
    </div>
  );
}

function NewEmployeeModal({
  session,
  onClose,
  onCreated,
}: {
  session: Session;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "FUNCIONARIO", position: "", skills: "" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao criar funcionário");
        return;
      }
      onCreated();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Novo funcionário" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <input
          placeholder="Nome"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-sm"
        />
        <input
          type="email"
          placeholder="E-mail"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-sm"
        />
        <input
          type="password"
          placeholder="Senha inicial"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-sm"
        />
        <select
          value={form.role}
          onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-sm"
        >
          {ROLES.filter((r) => r !== "PROPRIETARIO" || session.role === "PROPRIETARIO").map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
        <input
          placeholder="Função (ex: Retificador)"
          value={form.position}
          onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-sm"
        />
        <input
          placeholder="Competências (ex: Cabeçote, Usinagem)"
          value={form.skills}
          onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 px-3 py-2 text-sm"
        />
        {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950 rounded-lg px-3 py-2">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
            {saving ? "Criando..." : "Criar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

interface Productivity {
  employee: Employee;
  productivity: {
    servicesAssigned: number;
    servicesCompleted: number;
    servicesLate: number;
    avgDurationHours: number | null;
    revenue: number;
    reworks: number;
  };
}

function EmployeeDetailModal({
  employeeId,
  onClose,
  onChanged,
}: {
  employeeId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [data, setData] = useState<Productivity | null>(null);

  function load() {
    fetch(`/api/employees/${employeeId}`)
      .then((r) => r.json())
      .then(setData);
  }

  useEffect(load, [employeeId]);

  if (!data) {
    return (
      <Modal title="Funcionário" onClose={onClose}>
        <p className="text-sm text-slate-400">Carregando...</p>
      </Modal>
    );
  }

  async function toggleActive() {
    await fetch(`/api/employees/${employeeId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !data!.employee.active }),
    });
    load();
    onChanged();
  }

  const p = data.productivity;

  return (
    <Modal title={data.employee.name} onClose={onClose}>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Stat label="Serviços atribuídos" value={p.servicesAssigned} />
        <Stat label="Concluídos" value={p.servicesCompleted} />
        <Stat label="Atrasados" value={p.servicesLate} />
        <Stat label="Tempo médio" value={formatHours(p.avgDurationHours)} />
        <Stat label="Faturamento gerado" value={formatCurrency(p.revenue)} />
        <Stat label="Retrabalhos" value={p.reworks} />
      </div>
      <button
        onClick={toggleActive}
        className={`px-3 py-1.5 text-sm rounded-lg ${data.employee.active ? "bg-red-50 text-red-600 dark:bg-red-950" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950"}`}
      >
        {data.employee.active ? "Desativar" : "Reativar"}
      </button>
    </Modal>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">{value}</p>
    </div>
  );
}
