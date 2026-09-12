import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { prisma } from "@/app/lib/prisma";
import { requireSession } from "@/app/lib/api-auth";
import { PHOTO_CATEGORIES, isIn } from "@/app/lib/constants";

type Ctx = { params: Promise<{ id: string }> };

const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8MB

export async function POST(request: Request, ctx: Ctx) {
  const { session, response } = await requireSession();
  if (!session) return response;

  const orderId = Number((await ctx.params).id);
  if (!Number.isInteger(orderId)) return NextResponse.json({ error: "OS inválida" }, { status: 400 });

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  const category = formData?.get("category");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
  }
  if (!isIn(PHOTO_CATEGORIES, category)) {
    return NextResponse.json({ error: "Categoria da foto inválida" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Somente imagens são aceitas" }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Imagem muito grande (máx. 8MB)" }, { status: 400 });
  }

  const order = await prisma.serviceOrder.findUnique({ where: { id: orderId }, select: { id: true } });
  if (!order) return NextResponse.json({ error: "OS não encontrada" }, { status: 404 });

  const extension = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const filename = `${randomUUID()}.${extension}`;
  const dir = path.join(process.cwd(), "public", "uploads", "orders", String(orderId));
  await mkdir(dir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  const url = `/uploads/orders/${orderId}/${filename}`;
  const photo = await prisma.photo.create({
    data: { orderId, url, category, uploadedById: session.userId },
    include: { uploadedBy: { select: { id: true, name: true } } },
  });

  return NextResponse.json(photo, { status: 201 });
}
