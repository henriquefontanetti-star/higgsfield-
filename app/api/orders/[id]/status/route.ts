import { NextResponse } from "next/server";
import { requireSession } from "@/app/lib/api-auth";
import { changeOrderStatus } from "@/app/lib/orders";
import { ALL_STATUSES, isIn } from "@/app/lib/constants";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const { session, response } = await requireSession();
  if (!session) return response;

  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "OS inválida" }, { status: 400 });

  const body = await request.json().catch(() => null);
  if (!isIn(ALL_STATUSES, body?.status)) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }

  try {
    const order = await changeOrderStatus(id, body.status, session.userId, body.note);
    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ error: "OS não encontrada" }, { status: 404 });
  }
}
