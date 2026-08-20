import {
  BalancePoint,
  Category,
  CategoryTotal,
  DashboardSummary,
  InstallmentGroup,
  RecurrenceListItem,
  Transaction,
  TransactionPage,
  TransactionType,
} from '@/api/types';

const USER_ID = '11111111-1111-1111-1111-111111111111';
const STAMP = '2026-08-01T00:00:00.000Z';

function category(id: string, name: string, type: TransactionType, color: string): Category {
  return { id, userId: USER_ID, name, type, color, createdAt: STAMP, updatedAt: STAMP };
}

export const categories: Category[] = [
  category('c1', 'Salário', 'INCOME', '#2E7D32'),
  category('c2', 'Freelance', 'INCOME', '#00897B'),
  category('c3', 'Investimentos', 'INCOME', '#1565C0'),
  category('c4', 'Outras receitas', 'INCOME', '#6D4C41'),
  category('c5', 'Alimentação', 'EXPENSE', '#E65100'),
  category('c6', 'Moradia', 'EXPENSE', '#4E342E'),
  category('c7', 'Transporte', 'EXPENSE', '#0277BD'),
  category('c8', 'Saúde', 'EXPENSE', '#C62828'),
  category('c9', 'Educação', 'EXPENSE', '#5E35B1'),
  category('c10', 'Lazer', 'EXPENSE', '#AD1457'),
  category('c11', 'Compras', 'EXPENSE', '#F9A825'),
  category('c12', 'Contas e serviços', 'EXPENSE', '#37474F'),
  category('c13', 'Outras despesas', 'EXPENSE', '#616161'),
];

export function categoryById(id: string): Category {
  return categories.find((item) => item.id === id) ?? (categories[12] as Category);
}

interface TransactionSeed {
  id: string;
  categoryId: string;
  amount: string;
  description: string;
  date: string;
  tags?: string[];
  recurrenceId?: string;
  installmentGroupId?: string;
  installmentNumber?: number;
  installmentTotal?: number;
}

function transaction(seed: TransactionSeed): Transaction {
  const cat = categoryById(seed.categoryId);
  return {
    id: seed.id,
    userId: USER_ID,
    categoryId: seed.categoryId,
    type: cat.type,
    amount: seed.amount,
    description: seed.description,
    date: seed.date,
    recurrenceId: seed.recurrenceId ?? null,
    installmentGroupId: seed.installmentGroupId ?? null,
    installmentNumber: seed.installmentNumber ?? null,
    installmentTotal: seed.installmentTotal ?? null,
    createdAt: STAMP,
    updatedAt: STAMP,
    category: cat,
    tags: (seed.tags ?? []).map((name) => ({
      transactionId: seed.id,
      tagId: `tag-${name}`,
      tag: { id: `tag-${name}`, userId: USER_ID, name, createdAt: STAMP },
    })),
  };
}

export const currentMonth = '2026-08-01T00:00:00.000Z';

export const summary: DashboardSummary = {
  totalIncome: '8420.00',
  totalExpense: '5572.70',
  balance: '2847.30',
};

export const byCategory: CategoryTotal[] = [
  { categoryId: 'c6', categoryName: 'Moradia', type: 'EXPENSE', total: '2100.00' },
  { categoryId: 'c5', categoryName: 'Alimentação', type: 'EXPENSE', total: '968.40' },
  { categoryId: 'c7', categoryName: 'Transporte', type: 'EXPENSE', total: '800.60' },
  { categoryId: 'c13', categoryName: 'Outras despesas', type: 'EXPENSE', total: '512.30' },
  { categoryId: 'c11', categoryName: 'Compras', type: 'EXPENSE', total: '297.41' },
  { categoryId: 'c12', categoryName: 'Contas e serviços', type: 'EXPENSE', total: '289.90' },
  { categoryId: 'c8', categoryName: 'Saúde', type: 'EXPENSE', total: '287.60' },
  { categoryId: 'c10', categoryName: 'Lazer', type: 'EXPENSE', total: '196.49' },
  { categoryId: 'c9', categoryName: 'Educação', type: 'EXPENSE', total: '120.00' },
];

export const balanceEvolution: BalancePoint[] = [
  { month: '2026-03', income: '7180.00', expense: '6230.00', balance: '950.00' },
  { month: '2026-04', income: '6940.00', expense: '6228.00', balance: '712.00' },
  { month: '2026-05', income: '9310.00', expense: '6580.00', balance: '2730.00' },
  { month: '2026-06', income: '6800.00', expense: '7215.00', balance: '-415.00' },
  { month: '2026-07', income: '8120.00', expense: '6340.00', balance: '1780.00' },
  { month: '2026-08', income: '8420.00', expense: '5572.70', balance: '2847.30' },
];

export const RECURRENCE_ALUGUEL = 'r2';
export const INSTALLMENT_NOTEBOOK = 'g1';

export const transactions: Transaction[] = [
  transaction({
    id: 't1',
    categoryId: 'c5',
    amount: '312.84',
    description: 'Mercado Zona Sul',
    date: '2026-08-16T00:00:00.000Z',
    tags: ['casa'],
  }),
  transaction({
    id: 't2',
    categoryId: 'c7',
    amount: '68.40',
    description: 'Uber — corridas da semana',
    date: '2026-08-15T00:00:00.000Z',
  }),
  transaction({
    id: 't3',
    categoryId: 'c2',
    amount: '1620.00',
    description: 'Landing page Studio Vero',
    date: '2026-08-12T00:00:00.000Z',
    tags: ['cliente'],
  }),
  transaction({
    id: 't4',
    categoryId: 'c6',
    amount: '2100.00',
    description: 'Aluguel',
    date: '2026-08-10T00:00:00.000Z',
    recurrenceId: RECURRENCE_ALUGUEL,
  }),
  transaction({
    id: 't5',
    categoryId: 'c8',
    amount: '87.60',
    description: 'Farmácia Droga Raia',
    date: '2026-08-08T00:00:00.000Z',
  }),
  transaction({
    id: 't6',
    categoryId: 'c1',
    amount: '6800.00',
    description: 'Salário',
    date: '2026-08-05T00:00:00.000Z',
    recurrenceId: 'r1',
  }),
  transaction({
    id: 't7',
    categoryId: 'c11',
    amount: '297.41',
    description: 'Notebook Dell Inspiron 14',
    date: '2026-08-05T00:00:00.000Z',
    tags: ['trabalho'],
    installmentGroupId: INSTALLMENT_NOTEBOOK,
    installmentNumber: 3,
    installmentTotal: 12,
  }),
  transaction({
    id: 't8',
    categoryId: 'c12',
    amount: '129.90',
    description: 'Internet Vivo Fibra',
    date: '2026-08-03T00:00:00.000Z',
    recurrenceId: 'r3',
  }),
  transaction({
    id: 't9',
    categoryId: 'c5',
    amount: '289.50',
    description: 'Mercado Zona Sul',
    date: '2026-08-02T00:00:00.000Z',
    tags: ['casa'],
  }),
];

export const transactionPage: TransactionPage = {
  items: transactions,
  total: 17,
  page: 1,
  pageSize: 9,
};

export function transactionById(id: string): Transaction {
  return transactions.find((item) => item.id === id) ?? (transactions[3] as Transaction);
}

export const recurrences: RecurrenceListItem[] = [
  {
    id: 'r1',
    userId: USER_ID,
    categoryId: 'c1',
    type: 'INCOME',
    amount: '6800.00',
    description: 'Salário',
    intervalMonths: 1,
    startDate: '2025-01-05T00:00:00.000Z',
    endDate: null,
    occurrences: null,
    active: true,
    createdAt: STAMP,
    updatedAt: STAMP,
    category: categoryById('c1'),
    generatedCount: 32,
    lastOccurrenceDate: '2027-08-05T00:00:00.000Z',
    upcomingCount: 12,
    nextOccurrenceDate: '2026-09-05T00:00:00.000Z',
  },
  {
    id: RECURRENCE_ALUGUEL,
    userId: USER_ID,
    categoryId: 'c6',
    type: 'EXPENSE',
    amount: '2100.00',
    description: 'Aluguel',
    intervalMonths: 1,
    startDate: '2024-03-10T00:00:00.000Z',
    endDate: null,
    occurrences: null,
    active: true,
    createdAt: STAMP,
    updatedAt: STAMP,
    category: categoryById('c6'),
    generatedCount: 42,
    lastOccurrenceDate: '2027-08-10T00:00:00.000Z',
    upcomingCount: 12,
    nextOccurrenceDate: '2026-09-10T00:00:00.000Z',
  },
  {
    id: 'r3',
    userId: USER_ID,
    categoryId: 'c12',
    type: 'EXPENSE',
    amount: '129.90',
    description: 'Internet Vivo Fibra',
    intervalMonths: 1,
    startDate: '2025-09-03T00:00:00.000Z',
    endDate: '2027-09-03T00:00:00.000Z',
    occurrences: null,
    active: true,
    createdAt: STAMP,
    updatedAt: STAMP,
    category: categoryById('c12'),
    generatedCount: 24,
    lastOccurrenceDate: '2027-08-03T00:00:00.000Z',
    upcomingCount: 12,
    nextOccurrenceDate: '2026-09-03T00:00:00.000Z',
  },
  {
    id: 'r4',
    userId: USER_ID,
    categoryId: 'c7',
    type: 'EXPENSE',
    amount: '1284.00',
    description: 'IPVA',
    intervalMonths: 12,
    startDate: '2026-01-15T00:00:00.000Z',
    endDate: null,
    occurrences: 5,
    active: true,
    createdAt: STAMP,
    updatedAt: STAMP,
    category: categoryById('c7'),
    generatedCount: 2,
    lastOccurrenceDate: '2027-01-15T00:00:00.000Z',
    upcomingCount: 1,
    nextOccurrenceDate: '2027-01-15T00:00:00.000Z',
  },
];

const installmentDates = [
  '2026-06-05',
  '2026-07-05',
  '2026-08-05',
  '2026-09-05',
  '2026-10-05',
  '2026-11-05',
  '2026-12-05',
  '2027-01-05',
  '2027-02-05',
  '2027-03-05',
  '2027-04-05',
  '2027-05-05',
];

export const installmentGroup: InstallmentGroup = {
  installmentGroupId: INSTALLMENT_NOTEBOOK,
  categoryId: 'c11',
  category: categoryById('c11'),
  type: 'EXPENSE',
  description: 'Notebook Dell Inspiron 14',
  installmentTotal: 12,
  installmentsGenerated: 12,
  paidCount: 3,
  remainingCount: 9,
  totalAmount: '3569.00',
  paidAmount: '892.23',
  remainingAmount: '2676.77',
  transactions: installmentDates.map((date, index) =>
    transaction({
      id: `i${index + 1}`,
      categoryId: 'c11',
      amount: index === installmentDates.length - 1 ? '297.49' : '297.41',
      description: 'Notebook Dell Inspiron 14',
      date: `${date}T00:00:00.000Z`,
      tags: ['trabalho'],
      installmentGroupId: INSTALLMENT_NOTEBOOK,
      installmentNumber: index + 1,
      installmentTotal: 12,
    }),
  ),
};

export const installmentDraft = {
  description: 'Bicicleta Caloi Elite Carbon',
  amount: 2849,
  categoryId: 'c7',
  startDate: '2026-09-05T00:00:00.000Z',
  installmentTotal: 6,
  tagNames: ['bike'],
};

export function recurrenceById(id: string): RecurrenceListItem | undefined {
  return recurrences.find((item) => item.id === id);
}
