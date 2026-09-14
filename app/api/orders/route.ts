import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireSession } from "@/app/lib/api-auth";
import { logAudit } from "@/app/lib/audit";
import { computeOrderValue } from "@/app/lib/metrics";
import { isOrderLate } from "@/app/lib/orders";
import { CLIENT_TYPES, ORIGINS, PRIORITIES, isIn } from "@/app/lib/constants";

const orderInclude = {
  client: true,
  attendedBy: { select: { id: true, name: true } },
  services: { include: { category: true, responsible: { select: { id: true, name: true } } } },
} as const;

function serializeOrder(order: {
  discount: number;
  status: string;
  expectedDeliveryDate: Date | null;
  services: { value: number }[];
}) {
  const { gross, final } = computeOrderValue(order);
  return {
    ...order,
    valueGross: gross,
    valueFinal: final,
    isLate: isOrderLate(order),
  };
}

export async function GET(request: Request) {
  const { session, response } = await requireSession();
  if (!session) return response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const clientId = searchParams.get("clientId");
  const employeeId = searchParams.get("employeeId"); // responsável por algum serviço da OS
  const q = searchParams.get("q")?.trim();
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const onlyLate = searchParams.get("late") === "1";

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (clientId) where.clientId = clientId;
  if (employeeId) where.services = { some: { responsibleId: employeeId } };
  if (from || to) {
    where.entryDate = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }
  if (q) {
    const asNumber = Number(q);
    where.OR = [
      ...(Number.isInteger(asNumber) ? [{ id: asNumber }] : []),
      { client: { name: { contains: q } } },
      { motorBrand: { contains: q } },
      { motorModel: { contains: q } },
    ];
  }

  const orders = await prisma.serviceOrder.findMany({
    where,
    include: orderInclude,
    orderBy: { entryDate: "desc" },
  });

  let result = orders.map(serializeOrder);
  if (onlyLate) result = result.filter((o) => o.isLate);

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const { session, response } = await requireSession();
  if (!session) return response;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });

  let clientId: string | undefined = body.clientId;

  if (!clientId) {
    const newClient = body.newClient;
    if (!newClient?.name || !newClient?.phone) {
      return NextResponse.json(
        { error: "Selecione um cliente existente ou informe nome e telefone para um novo" },
        { status: 400 }
      );
    }
    const client = await prisma.client.create({
      data: {
        name: String(newClient.name).trim(),
        phone: String(newClient.phone).trim(),
        whatsapp: newClient.whatsapp || null,
        document: newClient.document || null,
        city: newClient.city || null,
        type: isIn(CLIENT_TYPES, newClient.type) ? newClient.type : "PESSOA_FISICA",
        origin: isIn(ORIGINS, body.origin) ? body.origin : null,
      },
    });
    clientId = client.id;
  }

  const order = await prisma.serviceOrder.create({
    data: {
      clientId,
      motorBrand: body.motorBrand || null,
      motorModel: body.motorModel || null,
      motorYear: body.motorYear || null,
      motorDisplacement: body.motorDisplacement || null,
      motorType: body.motorType || null,
      motorSerial: body.motorSerial || null,
      motorMileage: body.motorMileage || null,
      expectedDeliveryDate: body.expectedDeliveryDate ? new Date(body.expectedDeliveryDate) : null,
      origin: isIn(ORIGINS, body.origin) ? body.origin : null,
      attendedById: body.attendedById || session.userId,
      notes: body.notes || null,
      priority: isIn(PRIORITIES, body.priority) ? body.priority : "NORMAL",
      services: Array.isArray(body.services)
        ? {
            create: body.services
              .filter((s: { categoryId?: string }) => s?.categoryId)
              .map((s: { categoryId: string; description?: string; value?: number; responsibleId?: string; priority?: string; deadline?: string }) => ({
                categoryId: s.categoryId,
                description: s.description || null,
                value: Number(s.value) || 0,
                responsibleId: s.responsibleId || null,
                priority: isIn(PRIORITIES, s.priority) ? s.priority : "NORMAL",
                deadline: s.deadline ? new Date(s.deadline) : null,
              })),
          }
        : undefined,
    },
    include: orderInclude,
  });

  await prisma.statusHistory.create({
    data: { orderId: order.id, fromStatus: null, toStatus: "ENTRADA", changedById: session.userId },
  });
  await logAudit({
    entity: "ServiceOrder",
    entityId: String(order.id),
    field: "criacao",
    oldValue: null,
    newValue: "OS criada",
    action: "OTHER",
    actorId: session.userId,
  });

  return NextResponse.json(serializeOrder(order), { status: 201 });
}
