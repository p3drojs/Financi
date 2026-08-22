export interface InstallmentSplit {
  regularAmount: string;
  lastAmount: string;
  regularCount: number;
  remainderCents: number;
}

export function splitInstallments(total: number, count: number): InstallmentSplit {
  const totalCents = Math.round(total * 100);
  const baseCents = Math.floor(totalCents / count);
  const remainderCents = totalCents - baseCents * count;

  return {
    regularAmount: (baseCents / 100).toFixed(2),
    lastAmount: ((baseCents + remainderCents) / 100).toFixed(2),
    regularCount: count - 1,
    remainderCents,
  };
}

export function addMonths(iso: string, months: number): string {
  const date = new Date(iso);
  const day = date.getUTCDate();
  const targetMonth = date.getUTCMonth() + months;
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), targetMonth + 1, 0)).getUTCDate();
  return new Date(
    Date.UTC(date.getUTCFullYear(), targetMonth, Math.min(day, lastDay)),
  ).toISOString();
}
