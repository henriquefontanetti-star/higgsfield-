import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { name, amount, type, date, notes, userId } = await request.json();

    const investment = await prisma.investment.create({
      data: {
        name,
        amount: parseFloat(amount),
        type,
        date: new Date(date),
        notes: notes || null,
        userId,
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json(investment, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao criar investimento' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    let where: any = {};

    if (userId) {
      where.userId = userId;
    }

    const investments = await prisma.investment.findMany({
      where,
      include: {
        user: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(investments);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar investimentos' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, name, amount, type, date, notes } = await request.json();

    const investment = await prisma.investment.update({
      where: { id },
      data: {
        name,
        amount: parseFloat(amount),
        type,
        date: new Date(date),
        notes: notes || null,
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json(investment);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao atualizar investimento' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

    await prisma.investment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao deletar investimento' },
      { status: 500 }
    );
  }
}
