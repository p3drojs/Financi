import { Prisma } from '@prisma/client';
import { addMonths } from './recurrence.util';

export function splitInstallments(
  totalAmount: Prisma.Decimal.Value,
  count: number,
): Prisma.Decimal[] {
  if (count < 1) {
    throw new Error('installmentTotal deve ser >= 1');
  }

  const total = new Prisma.Decimal(totalAmount);
  const base = total.dividedBy(count).toDecimalPlaces(2, Prisma.Decimal.ROUND_DOWN);
  const amounts = new Array<Prisma.Decimal>(count).fill(base);

  const remainder = total.minus(base.times(count));
  amounts[count - 1] = (amounts[count - 1] as Prisma.Decimal).plus(remainder);

  return amounts;
}

export function generateInstallmentDates(startDate: Date, count: number): Date[] {
  if (count < 1) {
    throw new Error('installmentTotal deve ser >= 1');
  }

  const dates: Date[] = [];
  for (let i = 0; i < count; i++) {
    dates.push(addMonths(startDate, i));
  }
  return dates;
}

export interface InstallmentEntry {
  amount: Prisma.Decimal.Value;
  date: Date;
}

export interface InstallmentGroupSummary {
  installmentsGenerated: number;
  paidCount: number;
  remainingCount: number;
  totalAmount: Prisma.Decimal;
  paidAmount: Prisma.Decimal;
  remainingAmount: Prisma.Decimal;
}

export function summarizeInstallments(
  entries: InstallmentEntry[],
  now = new Date(),
): InstallmentGroupSummary {
  const sum = (items: InstallmentEntry[]) =>
    items.reduce((total, item) => total.plus(item.amount), new Prisma.Decimal(0));

  const paid = entries.filter((entry) => entry.date <= now);
  const totalAmount = sum(entries);
  const paidAmount = sum(paid);

  return {
    installmentsGenerated: entries.length,
    paidCount: paid.length,
    remainingCount: entries.length - paid.length,
    totalAmount,
    paidAmount,
    remainingAmount: totalAmount.minus(paidAmount),
  };
}
