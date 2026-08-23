import { AccountKind } from '@/api/types';

const KIND_LABELS: Record<AccountKind, string> = {
  CASH: 'dinheiro vivo',
  CHECKING: 'conta corrente',
  SAVINGS: 'poupança',
  CREDIT_CARD: 'cartão de crédito',
  INVESTMENT: 'investimento',
};

export function kindLabel(kind: AccountKind): string {
  return KIND_LABELS[kind];
}

export const ACCOUNT_KINDS: AccountKind[] = [
  'CASH',
  'CHECKING',
  'SAVINGS',
  'CREDIT_CARD',
  'INVESTMENT',
];

export function accountTone(color: string | null): string {
  return color ?? '#9AACB6';
}
