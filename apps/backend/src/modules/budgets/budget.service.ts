import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError, ConflictError, NotFoundError } from '../../utils/AppError';
import { ledgerWhere } from '../transactions/ledger';
import { extendActiveRecurrences } from '../transactions/transaction.service';
import { CopyBudgetInput, CreateBudgetInput, ListBudgetsQuery } from './budget.schema';
import { budgetPercent, budgetStatus, monthEnd, monthKey, monthStart } from './budget.util';

async function assertBudgetableCategory(userId: string, categoryId: string) {
  const category = await prisma.category.findFirst({ where: { id: categoryId, userId } });

  if (!category) {
    throw new NotFoundError('Categoria não encontrada');
  }

  if (category.type !== 'EXPENSE') {
    throw new AppError('Só categoria de saída aceita teto de orçamento', 400);
  }

  if (category.system) {
    throw new AppError('Categoria do sistema não aceita teto de orçamento', 400);
  }

  return category;
}

async function findBudgetOrFail(userId: string, id: string) {
  const budget = await prisma.budget.findFirst({ where: { id, userId } });

  if (!budget) {
    throw new NotFoundError('Orçamento não encontrado');
  }

  return budget;
}

export async function listBudgets(userId: string, query: ListBudgetsQuery) {
  await extendActiveRecurrences(userId);

  const key = query.month ?? monthKey(new Date());
  const from = monthStart(key);
  const to = monthEnd(key);

  const budgets = await prisma.budget.findMany({
    where: { userId, month: from },
    include: { category: true },
    orderBy: { category: { name: 'asc' } },
  });

  const grouped = await prisma.transaction.groupBy({
    by: ['categoryId', 'paid'],
    where: {
      userId,
      ...ledgerWhere,
      type: 'EXPENSE',
      date: { gte: from, lt: to },
      categoryId: { in: budgets.map((budget) => budget.categoryId) },
    },
    _sum: { amount: true },
  });

  const items = budgets.map((budget) => {
    const rows = grouped.filter((row) => row.categoryId === budget.categoryId);
    const committed = rows.reduce(
      (total, row) => total.plus(row._sum.amount ?? 0),
      new Prisma.Decimal(0),
    );
    const spent = rows
      .filter((row) => row.paid)
      .reduce((total, row) => total.plus(row._sum.amount ?? 0), new Prisma.Decimal(0));

    return {
      id: budget.id,
      categoryId: budget.categoryId,
      categoryName: budget.category.name,
      color: budget.category.color,
      amount: budget.amount,
      spent,
      committed,
      remaining: new Prisma.Decimal(budget.amount).minus(committed),
      percent: budgetPercent(budget.amount, committed),
      status: budgetStatus(budget.amount, committed),
    };
  });

  const sum = (pick: (item: (typeof items)[number]) => Prisma.Decimal) =>
    items.reduce((total, item) => total.plus(pick(item)), new Prisma.Decimal(0));

  return {
    month: key,
    totalBudgeted: sum((item) => new Prisma.Decimal(item.amount)),
    totalSpent: sum((item) => item.spent),
    totalCommitted: sum((item) => item.committed),
    items,
  };
}

export async function createBudget(userId: string, input: CreateBudgetInput) {
  await assertBudgetableCategory(userId, input.categoryId);

  const month = monthStart(input.month);
  const existing = await prisma.budget.findUnique({
    where: { userId_categoryId_month: { userId, categoryId: input.categoryId, month } },
  });

  if (existing) {
    throw new ConflictError('Esta categoria já tem teto neste mês');
  }

  return prisma.budget.create({
    data: { userId, categoryId: input.categoryId, month, amount: input.amount },
    include: { category: true },
  });
}

export async function updateBudget(userId: string, id: string, amount: number) {
  await findBudgetOrFail(userId, id);

  return prisma.budget.update({
    where: { id },
    data: { amount },
    include: { category: true },
  });
}

export async function deleteBudget(userId: string, id: string) {
  await findBudgetOrFail(userId, id);
  await prisma.budget.delete({ where: { id } });
}

export async function copyBudgets(userId: string, input: CopyBudgetInput) {
  const from = monthStart(input.fromMonth);
  const to = monthStart(input.toMonth);

  const [source, target] = await Promise.all([
    prisma.budget.findMany({ where: { userId, month: from } }),
    prisma.budget.findMany({ where: { userId, month: to } }),
  ]);

  const taken = new Set(target.map((budget) => budget.categoryId));
  const missing = source.filter((budget) => !taken.has(budget.categoryId));

  if (missing.length > 0) {
    await prisma.budget.createMany({
      data: missing.map((budget) => ({
        userId,
        categoryId: budget.categoryId,
        month: to,
        amount: budget.amount,
      })),
    });
  }

  return { created: missing.length, skipped: source.length - missing.length };
}
