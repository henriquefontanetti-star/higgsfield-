import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireSession } from "@/app/lib/api-auth";
import { CLIENT_TYPES, ORIGINS, isIn } from "@/app/lib/constants";
import { computeOrderValue } from "@/app/lib/metrics";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const { session, response } = await requireSession();
  if (!session) return response;

  const { id } = await ctx.params;
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { entryDate: "desc" },
        include: { services: { include: { category: true } } },
      },
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  const orders = client.orders.map((order) => ({
    ...order,
    ...computeOrderValue(order),
  }));

  return NextResponse.json({ ...client, orders });
}

export async function PUT(request: Request, ctx: Ctx) {
  const { session, response } = await requireSession();
  if (!session) return response;

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (typeof body.phone === "string" && body.phone.trim()) data.phone = body.phone.trim();
  if (typeof body.whatsapp === "string" || body.whatsapp === null) data.whatsapp = body.whatsapp;
  if (typeof body.document === "string" || body.document === null) data.document = body.document;
  if (typeof body.city === "string" || body.city === null) data.city = body.city;
  if (isIn(CLIENT_TYPES, body.type)) data.type = body.type;
  if (isIn(ORIGINS, body.origin) || body.origin === null) data.origin = body.origin;

  const client = await prisma.client.update({ where: { id }, data });
  return NextResponse.json(client);
}
