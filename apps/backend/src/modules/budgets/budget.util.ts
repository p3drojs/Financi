import { Prisma } from '@prisma/client';

export type BudgetStatus = 'OK' | 'WARNING' | 'OVER';

export const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export function monthStart(key: string): Date {
  const [year, month] = key.split('-').map(Number) as [number, number];
  return new Date(Date.UTC(year, month - 1, 1));
}

export function monthEnd(key: string): Date {
  const [year, month] = key.split('-').map(Number) as [number, number];
  return new Date(Date.UTC(year, month, 1));
}

export function monthKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function budgetPercent(
  amount: Prisma.Decimal.Value,
  committed: Prisma.Decimal.Value,
): number {
  const ceiling = new Prisma.Decimal(amount);

  if (ceiling.lessThanOrEqualTo(0)) {
    return 0;
  }

  return Number(new Prisma.Decimal(committed).dividedBy(ceiling).times(100).toDecimalPlaces(1));
}

export function budgetStatus(
  amount: Prisma.Decimal.Value,
  committed: Prisma.Decimal.Value,
): BudgetStatus {
  const ceiling = new Prisma.Decimal(amount);

  if (ceiling.lessThanOrEqualTo(0)) {
    return 'OVER';
  }

  const ratio = new Prisma.Decimal(committed).dividedBy(ceiling);

  if (ratio.greaterThanOrEqualTo(1)) {
    return 'OVER';
  }

  if (ratio.greaterThanOrEqualTo(0.8)) {
    return 'WARNING';
  }

  return 'OK';
}
