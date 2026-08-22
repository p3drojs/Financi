export function parseAmount(input: string): number | null {
  const normalized = input.trim().replace(/\s/g, '').replace(/\./g, '').replace(',', '.');

  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;

  const value = Number(normalized);
  return Number.isFinite(value) && value > 0 ? Math.round(value * 100) / 100 : null;
}

export function amountToInput(value: string | number): string {
  const amount = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(amount) ? amount.toFixed(2).replace('.', ',') : '';
}
