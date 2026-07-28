import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { amount, title, date, userId, categoryId } = await request.json();

    const expense = await prisma.expense.create({
      data: {
        amount: parseFloat(amount),
        title,
        date: new Date(date),
        userId,
        categoryId,
      },
      include: {
        user: true,
        category: true,
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao criar despesa' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    let where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        user: true,
        category: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar despesas' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, amount, title, date, categoryId } = await request.json();

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        amount: parseFloat(amount),
        title,
        date: new Date(date),
        categoryId,
      },
      include: {
        user: true,
        category: true,
      },
    });

    return NextResponse.json(expense);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao atualizar despesa' },
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

    await prisma.expense.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao deletar despesa' },
      { status: 500 }
    );
  }
}
