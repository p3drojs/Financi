import { TransactionType } from '@prisma/client';

interface DefaultCategory {
  name: string;
  type: TransactionType;
  color: string;
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { name: 'Salário', type: 'INCOME', color: '#2E7D32' },
  { name: 'Freelance', type: 'INCOME', color: '#00897B' },
  { name: 'Investimentos', type: 'INCOME', color: '#1565C0' },
  { name: 'Outras receitas', type: 'INCOME', color: '#6D4C41' },
  { name: 'Alimentação', type: 'EXPENSE', color: '#E65100' },
  { name: 'Moradia', type: 'EXPENSE', color: '#4E342E' },
  { name: 'Transporte', type: 'EXPENSE', color: '#0277BD' },
  { name: 'Saúde', type: 'EXPENSE', color: '#C62828' },
  { name: 'Educação', type: 'EXPENSE', color: '#5E35B1' },
  { name: 'Lazer', type: 'EXPENSE', color: '#AD1457' },
  { name: 'Compras', type: 'EXPENSE', color: '#F9A825' },
  { name: 'Contas e serviços', type: 'EXPENSE', color: '#37474F' },
  { name: 'Outras despesas', type: 'EXPENSE', color: '#616161' },
];
