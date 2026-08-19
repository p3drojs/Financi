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
