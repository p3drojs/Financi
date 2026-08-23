import { Prisma } from '@prisma/client';

const MILLIS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_PER_MONTH = 30.436875;

export interface ContributionEntry {
  amount: Prisma.Decimal.Value;
  date: Date;
}

export interface GoalInput {
  targetAmount: Prisma.Decimal.Value;
  targetDate: Date | null;
  contributions: ContributionEntry[];
  now?: Date;
}

export interface GoalDerived {
  saved: Prisma.Decimal;
  progress: number | null;
  remaining: Prisma.Decimal;
  requiredMonthly: Prisma.Decimal | null;
  pace: Prisma.Decimal | null;
  projectedDate: Date | null;
  onTrack: boolean | null;
}

export function monthsBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / (DAYS_PER_MONTH * MILLIS_PER_DAY);
}

export function addFractionalMonths(date: Date, months: number): Date {
  return new Date(date.getTime() + months * DAYS_PER_MONTH * MILLIS_PER_DAY);
}

export function deriveGoal(input: GoalInput): GoalDerived {
  const now = input.now ?? new Date();
  const target = new Prisma.Decimal(input.targetAmount);

  const saved = input.contributions.reduce(
    (total, contribution) => total.plus(contribution.amount),
    new Prisma.Decimal(0),
  );

  const remaining = Prisma.Decimal.max(target.minus(saved), 0);
  const progress = target.greaterThan(0) ? Number(saved.dividedBy(target)) : null;

  const monthsToTarget = input.targetDate ? monthsBetween(now, input.targetDate) : null;
  const requiredMonthly =
    monthsToTarget !== null && monthsToTarget > 0
      ? remaining.dividedBy(monthsToTarget).toDecimalPlaces(2)
      : null;

  const firstContribution = input.contributions.reduce<Date | null>(
    (earliest, contribution) =>
      !earliest || contribution.date < earliest ? contribution.date : earliest,
    null,
  );
  const monthsSaving = firstContribution ? monthsBetween(firstContribution, now) : null;
  const pace =
    monthsSaving !== null && monthsSaving >= 1
      ? saved.dividedBy(monthsSaving).toDecimalPlaces(2)
      : null;

  const achieved = remaining.equals(0);
  const projectedDate =
    !achieved && pace && pace.greaterThan(0)
      ? addFractionalMonths(now, Number(remaining.dividedBy(pace)))
      : null;

  let onTrack: boolean | null = null;
  if (input.targetDate) {
    if (achieved) {
      onTrack = true;
    } else if (projectedDate) {
      onTrack = projectedDate <= input.targetDate;
    }
  }

  return { saved, progress, remaining, requiredMonthly, pace, projectedDate, onTrack };
}
