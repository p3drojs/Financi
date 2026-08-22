import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { addMonths } from '../transactions/recurrence.util';
import { extendActiveRecurrences } from '../transactions/transaction.service';
import { BalanceEvolutionQuery, ByCategoryQuery, SummaryQuery } from './dashboard.schema';

function dateRangeWhere(dateFrom?: Date, dateTo?: Date) {
  if (!dateFrom && !dateTo) return {};
  return {
    date: {
      ...(dateFrom ? { gte: dateFrom } : {}),
      ...(dateTo ? { lte: dateTo } : {}),
    },
  };
}

export async function getSummary(userId: string, query: SummaryQuery) {
  await extendActiveRecurrences(userId);

  const grouped = await prisma.transaction.groupBy({
    by: ['type'],
    where: { userId, ...dateRangeWhere(query.dateFrom, query.dateTo) },
    _sum: { amount: true },
  });

  const totalIncome =
    grouped.find((g) => g.type === 'INCOME')?._sum.amount ?? new Prisma.Decimal(0);
  const totalExpense =
    grouped.find((g) => g.type === 'EXPENSE')?._sum.amount ?? new Prisma.Decimal(0);

  return {
    totalIncome,
    totalExpense,
    balance: new Prisma.Decimal(totalIncome).minus(totalExpense),
  };
}

export async function getByCategory(userId: string, query: ByCategoryQuery) {
  await extendActiveRecurrences(userId);

  const grouped = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: {
      userId,
      ...(query.type ? { type: query.type } : {}),
      ...dateRangeWhere(query.dateFrom, query.dateTo),
    },
    _sum: { amount: true },
  });

  const categories = await prisma.category.findMany({
    where: { id: { in: grouped.map((g) => g.categoryId) } },
  });

  return grouped
    .map((g) => {
      const category = categories.find((c) => c.id === g.categoryId);
      return {
        categoryId: g.categoryId,
        categoryName: category?.name ?? 'Categoria removida',
        type: category?.type,
        total: g._sum.amount ?? new Prisma.Decimal(0),
      };
    })
    .sort((a, b) => Number(b.total) - Number(a.total));
}

export async function getBalanceEvolution(userId: string, query: BalanceEvolutionQuery) {
  await extendActiveRecurrences(userId);

  const now = new Date();
  const rangeStart = addMonths(new Date(now.getFullYear(), now.getMonth(), 1), -(query.months - 1));

  const transactions = await prisma.transaction.findMany({
    where: { userId, date: { gte: rangeStart } },
    select: { date: true, type: true, amount: true },
  });

  const months: { key: string; income: Prisma.Decimal; expense: Prisma.Decimal }[] = [];
  for (let i = 0; i < query.months; i++) {
    const monthDate = addMonths(rangeStart, i);
    months.push({
      key: `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`,
      income: new Prisma.Decimal(0),
      expense: new Prisma.Decimal(0),
    });
  }

  for (const t of transactions) {
    const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
    const bucket = months.find((m) => m.key === key);
    if (!bucket) continue;
    if (t.type === 'INCOME') {
      bucket.income = bucket.income.plus(t.amount);
    } else {
      bucket.expense = bucket.expense.plus(t.amount);
    }
  }

  return months.map((m) => ({
    month: m.key,
    income: m.income,
    expense: m.expense,
    balance: m.income.minus(m.expense),
  }));
}
