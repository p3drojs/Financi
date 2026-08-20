export const RECURRENCE_BATCH_WINDOW_MONTHS = 12;

export function addMonths(date: Date, months: number): Date {
  const targetMonthIndex = date.getMonth() + months;
  const targetYear = date.getFullYear() + Math.floor(targetMonthIndex / 12);
  const normalizedMonth = ((targetMonthIndex % 12) + 12) % 12;
  const daysInTargetMonth = new Date(targetYear, normalizedMonth + 1, 0).getDate();

  const result = new Date(date);
  result.setFullYear(targetYear, normalizedMonth, Math.min(date.getDate(), daysInTargetMonth));
  return result;
}

export interface RecurrenceDatesParams {
  startDate: Date;
  intervalMonths: number;
  endDate?: Date | null;
  occurrences?: number | null;
  now?: Date;
  windowMonthsAhead?: number;
}

export function generateRecurrenceDates(params: RecurrenceDatesParams): Date[] {
  const {
    startDate,
    intervalMonths,
    endDate,
    occurrences,
    now = new Date(),
    windowMonthsAhead = RECURRENCE_BATCH_WINDOW_MONTHS,
  } = params;

  if (intervalMonths < 1) {
    throw new Error('intervalMonths deve ser >= 1');
  }

  const windowEnd = addMonths(now, windowMonthsAhead);
  const dates: Date[] = [];
  let cursor = startDate;

  for (;;) {
    if (endDate && cursor > endDate) break;
    if (occurrences != null && dates.length >= occurrences) break;
    if (cursor > windowEnd) break;

    dates.push(cursor);
    cursor = addMonths(cursor, intervalMonths);
  }

  return dates;
}

export interface PendingRecurrenceDatesParams extends RecurrenceDatesParams {
  generatedThrough?: Date | null;
}

export function pendingRecurrenceDates(params: PendingRecurrenceDatesParams): Date[] {
  const { generatedThrough, ...dateParams } = params;
  const cutoff = generatedThrough ?? dateParams.now ?? new Date();

  return generateRecurrenceDates(dateParams).filter((date) => date > cutoff);
}
