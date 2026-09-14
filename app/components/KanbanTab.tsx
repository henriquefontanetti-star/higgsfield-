"use client";

import { useEffect, useState } from "react";
import type { Order, Session } from "@/app/lib/types";
import { KANBAN_COLUMNS, ORDER_STATUS_LABELS, type OrderStatus } from "@/app/lib/constants";
import { PriorityBadge } from "./ui";
import { formatCurrency, formatDate, osCode } from "@/app/lib/format";

export default function KanbanTab({
  session,
  onOpenOrder,
}: {
  session: Session;
  onOpenOrder: (id: number) => void;
}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const isStaff = session.role === "PROPRIETARIO" || session.role === "GESTOR";

  function load() {
    fetch("/api/orders")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setOrders(data);
        setLoading(false);
      });
  }

  useEffect(() => {
    load();
  }, []);

  async function moveTo(orderId: number, status: OrderStatus) {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    await fetch(`/api/orders/${orderId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  if (loading) return <p className="text-sm text-slate-400">Carregando quadro...</p>;

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {KANBAN_COLUMNS.map((col) => {
        const columnOrders = orders.filter((o) => o.status === col);
        return (
          <div
            key={col}
            onDragOver={(e) => {
              if (isStaff) {
                e.preventDefault();
                setDragOverColumn(col);
              }
            }}
            onDragLeave={() => setDragOverColumn(null)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverColumn(null);
              const id = Number(e.dataTransfer.getData("text/order-id"));
              if (id && isStaff) moveTo(id, col);
            }}
            className={`shrink-0 w-72 rounded-xl border ${
              dragOverColumn === col ? "border-blue-400 bg-blue-50 dark:bg-blue-950/30" : "border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/60"
            } p-2`}
          >
            <div className="flex items-center justify-between px-2 py-1 mb-2">
              <h4 className="text-xs font-semibold uppercase text-slate-500">{ORDER_STATUS_LABELS[col]}</h4>
              <span className="text-xs text-slate-400">{columnOrders.length}</span>
            </div>
            <div className="space-y-2 min-h-[40px]">
              {columnOrders.map((order) => (
                <div
                  key={order.id}
                  draggable={isStaff}
                  onDragStart={(e) => e.dataTransfer.setData("text/order-id", String(order.id))}
                  onClick={() => onOpenOrder(order.id)}
                  className="cursor-pointer rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-500">{osCode(order.id)}</span>
                    {order.isLate && <span className="text-[10px] font-medium text-red-600">⏰ Atrasada</span>}
                  </div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{order.client.name}</p>
                  <p className="text-xs text-slate-400 truncate">
                    {[order.motorBrand, order.motorModel].filter(Boolean).join(" ") || "Motor não informado"}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <PriorityBadge priority={order.priority} />
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      {formatCurrency(order.valueFinal)}
                    </span>
                  </div>
                  {order.expectedDeliveryDate && (
                    <p className="text-[11px] text-slate-400 mt-1">Prazo: {formatDate(order.expectedDeliveryDate)}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
