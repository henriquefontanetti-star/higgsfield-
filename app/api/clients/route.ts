import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireSession } from "@/app/lib/api-auth";
import { CLIENT_TYPES, ORIGINS, isIn } from "@/app/lib/constants";
import { computeOrderValue } from "@/app/lib/metrics";

const RECURRING_WINDOW_DAYS = 180;

export async function GET(request: Request) {
  const { session, response } = await requireSession();
  if (!session) return response;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  const clients = await prisma.client.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q } },
            { phone: { contains: q } },
            { document: { contains: q } },
          ],
        }
      : undefined,
    include: {
      orders: {
        select: {
          entryDate: true,
          discount: true,
          status: true,
          isCanceled: true,
          services: { select: { value: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const now = Date.now();

  const result = clients.map((client) => {
    const validOrders = client.orders.filter((o) => !o.isCanceled);
    const ordersCount = validOrders.length;
    const dates = validOrders.map((o) => o.entryDate.getTime()).sort((a, b) => a - b);
    const firstOrderDate = dates[0] ? new Date(dates[0]) : null;
    const lastOrderDate = dates.length ? new Date(dates[dates.length - 1]) : null;
    const revenue = validOrders
      .filter((o) => o.status === "ENTREGUE" || o.status === "FINALIZADO")
      .reduce((sum, o) => sum + computeOrderValue(o).final, 0);
    const billedCount = validOrders.filter(
      (o) => o.status === "ENTREGUE" || o.status === "FINALIZADO"
    ).length;
    const avgTicket = billedCount > 0 ? revenue / billedCount : null;

    let classification: "NOVO" | "RECORRENTE" | "INATIVO" | "OFICINA_PARCEIRO";
    if (client.type === "OFICINA" || client.type === "PARCEIRO") {
      classification = "OFICINA_PARCEIRO";
    } else if (ordersCount <= 1) {
      classification = "NOVO";
    } else {
      const daysSinceLast = lastOrderDate ? (now - lastOrderDate.getTime()) / 86_400_000 : Infinity;
      classification = daysSinceLast > RECURRING_WINDOW_DAYS ? "INATIVO" : "RECORRENTE";
    }

    return {
      id: client.id,
      name: client.name,
      phone: client.phone,
      whatsapp: client.whatsapp,
      document: client.document,
      city: client.city,
      type: client.type,
      origin: client.origin,
      createdAt: client.createdAt,
      ordersCount,
      firstOrderDate,
      lastOrderDate,
      revenue,
      avgTicket,
      classification,
    };
  });

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const { session, response } = await requireSession();
  if (!session) return response;

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";

  if (!name || !phone) {
    return NextResponse.json({ error: "Nome e telefone são obrigatórios" }, { status: 400 });
  }

  const type = isIn(CLIENT_TYPES, body?.type) ? body.type : "PESSOA_FISICA";
  const origin = isIn(ORIGINS, body?.origin) ? body.origin : null;

  const client = await prisma.client.create({
    data: {
      name,
      phone,
      whatsapp: body?.whatsapp || null,
      document: body?.document || null,
      city: body?.city || null,
      type,
      origin,
    },
  });

  return NextResponse.json(client, { status: 201 });
}
