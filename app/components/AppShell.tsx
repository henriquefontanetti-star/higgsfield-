"use client";

import { useEffect, useState } from "react";
import type { Session } from "@/app/lib/types";
import { ROLE_LABELS } from "@/app/lib/constants";
import DashboardTab from "./DashboardTab";
import KanbanTab from "./KanbanTab";
import ClientsTab from "./ClientsTab";
import EmployeesTab from "./EmployeesTab";
import SettingsTab from "./SettingsTab";
import NewOrderModal from "./NewOrderModal";
import OrderModal from "./OrderModal";

type TabKey = "dashboard" | "kanban" | "clients" | "employees" | "settings";

export default function AppShell() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("dashboard");
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [openOrderId, setOpenOrderId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then(setSession)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Carregando...</div>;
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Sessão expirada. <a href="/login" className="text-blue-600 ml-1">Entrar novamente</a>
      </div>
    );
  }

  const isStaff = session.role === "PROPRIETARIO" || session.role === "GESTOR";

  function refresh() {
    setRefreshKey((k) => k + 1);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  const tabs: { key: TabKey; label: string; visible: boolean }[] = [
    { key: "dashboard", label: "Dashboard", visible: true },
    { key: "kanban", label: "Quadro", visible: true },
    { key: "clients", label: "Clientes", visible: true },
    { key: "employees", label: "Equipe", visible: isStaff },
    { key: "settings", label: "Configurações", visible: isStaff },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏍️</span>
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-100 leading-tight">HG Motors</p>
              <p className="text-[11px] text-slate-400 leading-tight">Sistema Operacional</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {tabs
              .filter((t) => t.visible)
              .map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    tab === t.key
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {t.label}
                </button>
              ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNewOrder(true)}
              className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-3 py-1.5"
            >
              + Nova OS
            </button>
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-tight">{session.name}</p>
              <p className="text-[11px] text-slate-400 leading-tight">{ROLE_LABELS[session.role]}</p>
            </div>
            <button
              onClick={logout}
              className="text-xs text-slate-400 hover:text-red-500"
              title="Sair"
            >
              Sair
            </button>
          </div>
        </div>

        <nav className="md:hidden flex overflow-x-auto gap-1 px-4 pb-2">
          {tabs
            .filter((t) => t.visible)
            .map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium ${
                  tab === t.key ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                }`}
              >
                {t.label}
              </button>
            ))}
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {tab === "dashboard" && <DashboardTab session={session} key={`dash-${refreshKey}`} />}
        {tab === "kanban" && (
          <KanbanTab
            session={session}
            key={`kanban-${refreshKey}`}
            onOpenOrder={(id) => setOpenOrderId(id)}
          />
        )}
        {tab === "clients" && <ClientsTab key={`clients-${refreshKey}`} onOpenOrder={(id) => setOpenOrderId(id)} />}
        {tab === "employees" && <EmployeesTab session={session} key={`emp-${refreshKey}`} />}
        {tab === "settings" && <SettingsTab key={`settings-${refreshKey}`} />}
      </main>

      {showNewOrder && (
        <NewOrderModal
          onClose={() => setShowNewOrder(false)}
          onCreated={(id) => {
            setShowNewOrder(false);
            refresh();
            setOpenOrderId(id);
          }}
        />
      )}

      {openOrderId !== null && (
        <OrderModal
          orderId={openOrderId}
          session={session}
          onClose={() => setOpenOrderId(null)}
          onChanged={refresh}
        />
      )}
    </div>
  );
}
