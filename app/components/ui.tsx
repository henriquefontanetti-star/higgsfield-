"use client";

import { ReactNode, useEffect } from "react";
import { ORDER_STATUS_LABELS, PRIORITY_LABELS, type AnyOrderStatus, type Priority } from "@/app/lib/constants";

export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-10">
      <div
        className={`w-full ${wide ? "max-w-3xl" : "max-w-lg"} rounded-2xl bg-white dark:bg-slate-900 shadow-2xl`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  ENTRADA: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  AGUARDANDO_AVALIACAO: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  ORCAMENTO: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  AGUARDANDO_APROVACAO: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  APROVADO: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  AGUARDANDO_EXECUCAO: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  EM_EXECUCAO: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  AGUARDANDO_CLIENTE: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  CONTROLE_QUALIDADE: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
  PRONTO: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
  ENTREGUE: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  FINALIZADO: "bg-green-200 text-green-900 dark:bg-green-900 dark:text-green-200",
  CANCELADO: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  RETRABALHO: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  BLOQUEADO: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
};

export function StatusBadge({ status }: { status: string }) {
  const label = ORDER_STATUS_LABELS[status as AnyOrderStatus] ?? status;
  const color = STATUS_COLORS[status] ?? "bg-slate-100 text-slate-700";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}

const PRIORITY_COLORS: Record<string, string> = {
  BAIXA: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  NORMAL: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  ALTA: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  URGENTE: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export function PriorityBadge({ priority }: { priority: string }) {
  const label = PRIORITY_LABELS[priority as Priority] ?? priority;
  const color = PRIORITY_COLORS[priority] ?? "bg-slate-100 text-slate-700";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${color}`}>
      {label}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "default" | "danger" | "success" | "warning";
}) {
  const toneClasses: Record<string, string> = {
    default: "text-slate-800 dark:text-slate-100",
    danger: "text-red-600 dark:text-red-400",
    success: "text-emerald-600 dark:text-emerald-400",
    warning: "text-amber-600 dark:text-amber-400",
  };
  return (
    <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${toneClasses[tone ?? "default"]}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">
      {children}
    </h3>
  );
}
