import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ledgerWhere } from '../transactions/ledger';
import { RECURRENCE_BATCH_WINDOW_MONTHS, addMonths } from '../transactions/recurrence.util';
import { extendActiveRecurrences } from '../transactions/transaction.service';
import { startOfUtcDay } from '../transactions/transaction.util';
import { ForecastQuery } from './dashboard.schema';

const MILLIS_PER_DAY = 24 * 60 * 60 * 1000;

function nextUtcDay(date: Date): Date {
  return new Date(date.getTime() + MILLIS_PER_DAY);
}

function endOfUtcMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

interface PendingRow {
  date: Date;
  type: 'INCOME' | 'EXPENSE';
  amount: Prisma.Decimal;
}

export function buildDailySeries(
  from: Date,
  to: Date,
  openingBalance: Prisma.Decimal,
  rows: PendingRow[],
): { date: string; balance: Prisma.Decimal }[] {
  const movementByDay = new Map<string, Prisma.Decimal>();

  for (const row of rows) {
    const key = isoDay(startOfUtcDay(row.date));
    const current = movementByDay.get(key) ?? new Prisma.Decimal(0);
    movementByDay.set(
      key,
      row.type === 'INCOME' ? current.plus(row.amount) : current.minus(row.amount),
    );
  }

  const series: { date: string; balance: Prisma.Decimal }[] = [];
  let balance = openingBalance;

  for (let cursor = from; cursor <= to; cursor = nextUtcDay(cursor)) {
    const key = isoDay(cursor);
    balance = balance.plus(movementByDay.get(key) ?? 0);
    series.push({ date: key, balance });
  }

  return series;
}

export function lowestPointOf(series: { date: string; balance: Prisma.Decimal }[]) {
  return series.reduce<{ date: string; balance: Prisma.Decimal } | null>((lowest, point) => {
    if (!lowest || point.balance.lessThan(lowest.balance)) {
      return point;
    }
    return lowest;
  }, null);
}

export async function getForecast(userId: string, query: ForecastQuery) {
  await extendActiveRecurrences(userId);

  const today = startOfUtcDay(new Date());
  const limit = startOfUtcDay(addMonths(today, RECURRENCE_BATCH_WINDOW_MONTHS));
  const requested = query.until ? startOfUtcDay(query.until) : endOfUtcMonth(today);
  const truncated = requested > limit;
  const until = truncated ? limit : requested;

  const accountWhere = query.accountId ? { accountId: query.accountId } : {};

  const [accounts, settled, pending, overdue] = await Promise.all([
    prisma.account.findMany({
      where: { userId, ...(query.accountId ? { id: query.accountId } : {}) },
      select: { initialBalance: true },
    }),
    prisma.transaction.groupBy({
      by: ['type'],
      where: { userId, ...accountWhere, paid: true, date: { lt: nextUtcDay(today) } },
      _sum: { amount: true },
    }),
    prisma.transaction.findMany({
      where: {
        userId,
        ...accountWhere,
        ...ledgerWhere,
        paid: false,
        date: { gte: today, lt: nextUtcDay(until) },
      },
      select: { date: true, type: true, amount: true },
      orderBy: { date: 'asc' },
    }),
    prisma.transaction.aggregate({
      where: { userId, ...accountWhere, ...ledgerWhere, paid: false, date: { lt: today } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
  ]);

  const initialBalance = accounts.reduce(
    (total, account) => total.plus(account.initialBalance),
    new Prisma.Decimal(0),
  );
  const settledIncome = settled.find((row) => row.type === 'INCOME')?._sum.amount ?? 0;
  const settledExpense = settled.find((row) => row.type === 'EXPENSE')?._sum.amount ?? 0;
  const currentBalance = initialBalance.plus(settledIncome).minus(settledExpense);

  const pendingIncome = pending
    .filter((row) => row.type === 'INCOME')
    .reduce((total, row) => total.plus(row.amount), new Prisma.Decimal(0));
  const pendingExpense = pending
    .filter((row) => row.type === 'EXPENSE')
    .reduce((total, row) => total.plus(row.amount), new Prisma.Decimal(0));

  const daily = buildDailySeries(today, until, currentBalance, pending);

  return {
    asOf: isoDay(today),
    until: isoDay(until),
    currentBalance,
    pendingIncome,
    pendingExpense,
    overdue: {
      count: overdue._count._all,
      total: overdue._sum.amount ?? new Prisma.Decimal(0),
    },
    projectedBalance: currentBalance.plus(pendingIncome).minus(pendingExpense),
    lowestPoint: lowestPointOf(daily),
    daily,
    truncated,
  };
}
