import { randomUUID } from 'node:crypto';
import { Prisma, Recurrence } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { getDefaultAccountId } from '../accounts/account.service';
import { findOrCreateTags } from '../tags/tag.service';
import { AppError, ConflictError, NotFoundError } from '../../utils/AppError';
import {
  generateInstallmentDates,
  splitInstallments,
  summarizeInstallments,
} from './installment.util';
import { generateRecurrenceDates, pendingRecurrenceDates } from './recurrence.util';
import { transactionInclude } from './transaction.include';
import { resolvePaid, startOfUtcDay } from './transaction.util';
import {
  CreateInstallmentTransactionInput,
  CreateRecurringTransactionInput,
  CreateTransactionInput,
  ListRecurrencesQuery,
  ListTransactionsQuery,
  UpdateRecurrenceInput,
  UpdateTransactionInput,
} from './transaction.schema';

export { transactionInclude };

const MILLIS_PER_DAY = 24 * 60 * 60 * 1000;

function sumAmounts(items: { amount: Prisma.Decimal }[]): Prisma.Decimal {
  return items.reduce((total, item) => total.plus(item.amount), new Prisma.Decimal(0));
}

async function assertCategoryMatches(userId: string, categoryId: string, type: string) {
  const category = await prisma.category.findFirst({ where: { id: categoryId, userId } });

  if (!category) {
    throw new NotFoundError('Categoria não encontrada');
  }

  if (category.type !== type) {
    throw new AppError('O tipo da categoria não corresponde ao tipo da transação', 400);
  }

  if (category.system) {
    throw new AppError(
      'Esta categoria é do sistema e só pode ser usada por transferências entre contas',
      400,
    );
  }

  return category;
}

function assertNotTransfer(transferGroupId: string | null) {
  if (transferGroupId) {
    throw new AppError(
      'Transferência não se edita pela metade. Apague a transferência inteira e refaça.',
      400,
    );
  }
}

async function extendRecurrenceBatch(recurrence: Recurrence, now: Date): Promise<number> {
  const lastOccurrence = await prisma.transaction.findFirst({
    where: { recurrenceId: recurrence.id },
    orderBy: { date: 'desc' },
    include: { tags: true },
  });

  const dates = pendingRecurrenceDates({
    startDate: recurrence.startDate,
    intervalMonths: recurrence.intervalMonths,
    endDate: recurrence.endDate,
    occurrences: recurrence.occurrences,
    now,
    generatedThrough: lastOccurrence?.date,
  });

  if (dates.length === 0) {
    return 0;
  }

  const tagIds = lastOccurrence?.tags.map((tag) => tag.tagId) ?? [];
  const accountId = lastOccurrence?.accountId ?? (await getDefaultAccountId(recurrence.userId));

  await prisma.$transaction(
    dates.map((date) =>
      prisma.transaction.create({
        data: {
          userId: recurrence.userId,
          accountId,
          categoryId: recurrence.categoryId,
          type: recurrence.type,
          amount: recurrence.amount,
          description: recurrence.description,
          date,
          ...resolvePaid(date),
          recurrenceId: recurrence.id,
          tags: { create: tagIds.map((tagId) => ({ tagId })) },
        },
      }),
    ),
  );

  return dates.length;
}

export async function extendActiveRecurrences(userId: string, now = new Date()): Promise<number> {
  const recurrences = await prisma.recurrence.findMany({ where: { userId, active: true } });

  const generated = await Promise.all(
    recurrences.map((recurrence) => extendRecurrenceBatch(recurrence, now)),
  );

  return generated.reduce((total, count) => total + count, 0);
}

export async function createTransaction(userId: string, input: CreateTransactionInput) {
  await assertCategoryMatches(userId, input.categoryId, input.type);
  const accountId = await getDefaultAccountId(userId);
  const tags = await findOrCreateTags(userId, input.tagNames ?? []);

  return prisma.transaction.create({
    data: {
      userId,
      accountId,
      categoryId: input.categoryId,
      type: input.type,
      amount: input.amount,
      description: input.description,
      date: input.date,
      ...resolvePaid(input.date, input.paid),
      tags: { create: tags.map((tag) => ({ tagId: tag.id })) },
    },
    include: transactionInclude,
  });
}

export async function createRecurringTransaction(
  userId: string,
  input: CreateRecurringTransactionInput,
) {
  await assertCategoryMatches(userId, input.categoryId, input.type);
  const accountId = await getDefaultAccountId(userId);
  const tags = await findOrCreateTags(userId, input.tagNames ?? []);

  const dates = generateRecurrenceDates({
    startDate: input.startDate,
    intervalMonths: input.intervalMonths,
    endDate: input.endDate,
    occurrences: input.occurrences,
  });

  return prisma.$transaction(async (tx) => {
    const recurrence = await tx.recurrence.create({
      data: {
        userId,
        categoryId: input.categoryId,
        type: input.type,
        amount: input.amount,
        description: input.description,
        intervalMonths: input.intervalMonths,
        startDate: input.startDate,
        endDate: input.endDate,
        occurrences: input.occurrences,
      },
    });

    const transactions = await Promise.all(
      dates.map((date) =>
        tx.transaction.create({
          data: {
            userId,
            accountId,
            categoryId: input.categoryId,
            type: input.type,
            amount: input.amount,
            description: input.description,
            date,
            ...resolvePaid(date, input.paid),
            recurrenceId: recurrence.id,
            tags: { create: tags.map((tag) => ({ tagId: tag.id })) },
          },
          include: transactionInclude,
        }),
      ),
    );

    return { recurrence, transactions };
  });
}

export async function createInstallmentTransaction(
  userId: string,
  input: CreateInstallmentTransactionInput,
) {
  await assertCategoryMatches(userId, input.categoryId, input.type);
  const accountId = await getDefaultAccountId(userId);
  const tags = await findOrCreateTags(userId, input.tagNames ?? []);

  const dates = generateInstallmentDates(input.startDate, input.installmentTotal);
  const amounts = splitInstallments(input.amount, input.installmentTotal);
  const installmentGroupId = randomUUID();

  const transactions = await prisma.$transaction(
    dates.map((date, index) =>
      prisma.transaction.create({
        data: {
          userId,
          accountId,
          categoryId: input.categoryId,
          type: input.type,
          amount: amounts[index] as Prisma.Decimal,
          description: input.description,
          date,
          ...resolvePaid(date, input.paid),
          installmentGroupId,
          installmentNumber: index + 1,
          installmentTotal: input.installmentTotal,
          tags: { create: tags.map((tag) => ({ tagId: tag.id })) },
        },
        include: transactionInclude,
      }),
    ),
  );

  return transactions;
}

export async function listTransactions(userId: string, query: ListTransactionsQuery) {
  await extendActiveRecurrences(userId);

  const where = {
    userId,
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.accountId ? { accountId: query.accountId } : {}),
    ...(query.type ? { type: query.type } : {}),
    ...(query.dateFrom || query.dateTo
      ? {
          date: {
            ...(query.dateFrom ? { gte: query.dateFrom } : {}),
            ...(query.dateTo ? { lte: query.dateTo } : {}),
          },
        }
      : {}),
    ...(query.tag ? { tags: { some: { tag: { name: query.tag } } } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: transactionInclude,
      orderBy: { date: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.transaction.count({ where }),
  ]);

  return { items, total, page: query.page, pageSize: query.pageSize };
}

export async function getInstallmentGroup(userId: string, groupId: string) {
  const transactions = await prisma.transaction.findMany({
    where: { userId, installmentGroupId: groupId },
    include: transactionInclude,
    orderBy: { installmentNumber: 'asc' },
  });

  const first = transactions[0];

  if (!first) {
    throw new NotFoundError('Parcelamento não encontrado');
  }

  return {
    installmentGroupId: groupId,
    categoryId: first.categoryId,
    category: first.category,
    type: first.type,
    description: first.description,
    installmentTotal: first.installmentTotal ?? transactions.length,
    ...summarizeInstallments(transactions),
    transactions,
  };
}

export async function getTransactionById(userId: string, id: string) {
  const transaction = await prisma.transaction.findFirst({
    where: { id, userId },
    include: transactionInclude,
  });

  if (!transaction) {
    throw new NotFoundError('Transação não encontrada');
  }

  return transaction;
}

export async function updateTransaction(userId: string, id: string, input: UpdateTransactionInput) {
  const transaction = await getTransactionById(userId, id);
  assertNotTransfer(transaction.transferGroupId);

  if (input.categoryId) {
    await assertCategoryMatches(userId, input.categoryId, transaction.type);
  }

  if (input.tagNames) {
    const tags = await findOrCreateTags(userId, input.tagNames);
    await prisma.transactionTag.deleteMany({ where: { transactionId: id } });
    await prisma.transactionTag.createMany({
      data: tags.map((tag) => ({ transactionId: id, tagId: tag.id })),
    });
  }

  return prisma.transaction.update({
    where: { id },
    data: {
      categoryId: input.categoryId,
      amount: input.amount,
      description: input.description,
      date: input.date,
      ...(input.paid === undefined
        ? {}
        : { paid: input.paid, paidAt: input.paid ? new Date() : null }),
    },
    include: transactionInclude,
  });
}

export async function payTransactions(userId: string, ids: string[]) {
  const result = await prisma.transaction.updateMany({
    where: { userId, id: { in: ids }, paid: false },
    data: { paid: true, paidAt: new Date() },
  });

  return { updated: result.count };
}

export async function getUpcoming(userId: string, days: number) {
  await extendActiveRecurrences(userId);

  const now = new Date();
  const today = startOfUtcDay(now);
  const horizon = new Date(today.getTime() + days * MILLIS_PER_DAY);

  const pending = await prisma.transaction.findMany({
    where: { userId, paid: false, date: { lte: horizon } },
    include: transactionInclude,
    orderBy: { date: 'asc' },
  });

  const overdue = pending.filter((transaction) => transaction.date < today);
  const upcoming = pending.filter((transaction) => transaction.date >= today);

  return {
    overdue: { total: sumAmounts(overdue), items: overdue },
    upcoming: { total: sumAmounts(upcoming), items: upcoming },
  };
}

export async function deleteTransaction(userId: string, id: string) {
  const transaction = await getTransactionById(userId, id);
  assertNotTransfer(transaction.transferGroupId);
  await prisma.transaction.delete({ where: { id } });
}

export async function listRecurrences(userId: string, query: ListRecurrencesQuery) {
  await extendActiveRecurrences(userId);

  const recurrences = await prisma.recurrence.findMany({
    where: { userId, ...(query.active === undefined ? {} : { active: query.active }) },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });

  if (recurrences.length === 0) {
    return [];
  }

  const recurrenceIds = recurrences.map((recurrence) => recurrence.id);
  const now = new Date();

  const [generated, upcoming] = await Promise.all([
    prisma.transaction.groupBy({
      by: ['recurrenceId'],
      where: { userId, recurrenceId: { in: recurrenceIds } },
      _count: { _all: true },
      _max: { date: true },
    }),
    prisma.transaction.groupBy({
      by: ['recurrenceId'],
      where: { userId, recurrenceId: { in: recurrenceIds }, date: { gt: now } },
      _count: { _all: true },
      _min: { date: true },
    }),
  ]);

  const generatedByRecurrence = new Map(generated.map((group) => [group.recurrenceId, group]));
  const upcomingByRecurrence = new Map(upcoming.map((group) => [group.recurrenceId, group]));

  return recurrences.map((recurrence) => ({
    ...recurrence,
    generatedCount: generatedByRecurrence.get(recurrence.id)?._count._all ?? 0,
    lastOccurrenceDate: generatedByRecurrence.get(recurrence.id)?._max.date ?? null,
    upcomingCount: upcomingByRecurrence.get(recurrence.id)?._count._all ?? 0,
    nextOccurrenceDate: upcomingByRecurrence.get(recurrence.id)?._min.date ?? null,
  }));
}

async function findRecurrenceOrFail(userId: string, recurrenceId: string) {
  const recurrence = await prisma.recurrence.findFirst({ where: { id: recurrenceId, userId } });

  if (!recurrence) {
    throw new NotFoundError('Recorrência não encontrada');
  }

  return recurrence;
}

async function rescheduleFutureOccurrences(recurrence: Recurrence, now: Date) {
  const reference = await prisma.transaction.findFirst({
    where: { recurrenceId: recurrence.id },
    orderBy: { date: 'asc' },
    include: { tags: true },
  });

  const tagIds = reference?.tags.map((tag) => tag.tagId) ?? [];
  const accountId = reference?.accountId ?? (await getDefaultAccountId(recurrence.userId));

  const dates = generateRecurrenceDates({
    startDate: recurrence.startDate,
    intervalMonths: recurrence.intervalMonths,
    endDate: recurrence.endDate,
    occurrences: recurrence.occurrences,
    now,
  }).filter((date) => date > now);

  await prisma.$transaction([
    prisma.transaction.deleteMany({ where: { recurrenceId: recurrence.id, date: { gt: now } } }),
    ...dates.map((date) =>
      prisma.transaction.create({
        data: {
          userId: recurrence.userId,
          accountId,
          categoryId: recurrence.categoryId,
          type: recurrence.type,
          amount: recurrence.amount,
          description: recurrence.description,
          date,
          ...resolvePaid(date),
          recurrenceId: recurrence.id,
          tags: { create: tagIds.map((tagId) => ({ tagId })) },
        },
      }),
    ),
  ]);
}

export async function updateRecurrence(
  userId: string,
  recurrenceId: string,
  input: UpdateRecurrenceInput,
) {
  const recurrence = await findRecurrenceOrFail(userId, recurrenceId);

  if (!recurrence.active) {
    throw new ConflictError('Recorrência cancelada não pode ser editada');
  }

  if (input.categoryId) {
    await assertCategoryMatches(userId, input.categoryId, recurrence.type);
  }

  const updated = await prisma.recurrence.update({
    where: { id: recurrenceId },
    data: {
      categoryId: input.categoryId,
      amount: input.amount,
      description: input.description,
      intervalMonths: input.intervalMonths,
      endDate: input.endDate,
      occurrences: input.occurrences,
    },
  });

  const now = new Date();
  const scheduleChanged =
    input.intervalMonths !== undefined ||
    input.endDate !== undefined ||
    input.occurrences !== undefined;
  const valuesChanged =
    input.categoryId !== undefined || input.amount !== undefined || input.description !== undefined;

  if (scheduleChanged) {
    await rescheduleFutureOccurrences(updated, now);
  } else if (valuesChanged) {
    await prisma.transaction.updateMany({
      where: { recurrenceId, date: { gt: now } },
      data: {
        categoryId: input.categoryId,
        amount: input.amount,
        description: input.description,
      },
    });
  }

  const transactions = await prisma.transaction.findMany({
    where: { recurrenceId, date: { gt: now } },
    include: transactionInclude,
    orderBy: { date: 'asc' },
  });

  return { recurrence: updated, transactions };
}

export async function cancelRecurrence(userId: string, recurrenceId: string) {
  await findRecurrenceOrFail(userId, recurrenceId);

  await prisma.$transaction([
    prisma.transaction.deleteMany({
      where: { recurrenceId, date: { gt: new Date() } },
    }),
    prisma.recurrence.update({
      where: { id: recurrenceId },
      data: { active: false },
    }),
  ]);
}
