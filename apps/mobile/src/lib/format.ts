const MONTHS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export function money(value: string | number): string {
  const amount = typeof value === 'number' ? value : Number(value);
  return amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function signedMoney(value: string | number, type: 'INCOME' | 'EXPENSE'): string {
  return type === 'INCOME' ? `+${money(value)}` : `-${money(value)}`;
}

export function dayMonth(iso: string): string {
  const date = new Date(iso);
  return `${pad(date.getUTCDate())}/${pad(date.getUTCMonth() + 1)}`;
}

export function fullDate(iso: string): string {
  const date = new Date(iso);
  return `${pad(date.getUTCDate())}/${pad(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}`;
}

export function dayOfMonth(iso: string): string {
  const date = new Date(iso);
  return `${date.getUTCDate()} de ${MONTHS[date.getUTCMonth()]}`;
}

export function monthYear(iso: string): string {
  const date = new Date(iso);
  return `${MONTHS[date.getUTCMonth()]} de ${date.getUTCFullYear()}`;
}

export function monthName(iso: string): string {
  return MONTHS[new Date(iso).getUTCMonth()] as string;
}

export function year(iso: string): number {
  return new Date(iso).getUTCFullYear();
}

export function monthKeyShort(key: string): string {
  const month = Number(key.split('-')[1]);
  return MONTHS_SHORT[month - 1] as string;
}

export function ordinal(value: number): string {
  return String(value).padStart(2, '0');
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function repeatLabel(intervalMonths: number): string {
  return intervalMonths === 1 ? 'se repete todo mês' : `se repete a cada ${intervalMonths} meses`;
}

export function intervalLabel(intervalMonths: number): string {
  return intervalMonths === 1 ? 'todo mês' : `a cada ${intervalMonths} meses`;
}
