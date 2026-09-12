import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireSession } from "@/app/lib/api-auth";

export async function GET() {
  const { session, response } = await requireSession();
  if (!session) return response;

  const categories = await prisma.serviceCategory.findMany({
    where: { active: true },
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const { session, response } = await requireSession(["PROPRIETARIO", "GESTOR"]);
  if (!session) return response;

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });

  const category = await prisma.serviceCategory.create({ data: { name } });
  return NextResponse.json(category, { status: 201 });
}
