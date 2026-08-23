export interface PaidState {
  paid: boolean;
  paidAt: Date | null;
}

export function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function isDue(date: Date, now = new Date()): boolean {
  return startOfUtcDay(date).getTime() <= startOfUtcDay(now).getTime();
}

export function resolvePaid(date: Date, explicit?: boolean, now = new Date()): PaidState {
  const paid = explicit ?? isDue(date, now);
  return { paid, paidAt: paid ? now : null };
}
