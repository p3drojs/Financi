export interface MockAccount {
  id: string;
  name: string;
  kind: string;
  color: string;
  balance: number;
}

export interface MockDue {
  id: string;
  date: string;
  name: string;
  category: string;
  color: string;
  amount: number;
  note: string;
  installment?: string;
}

export interface MockCeiling {
  id: string;
  name: string;
  color: string;
  spent: number;
  committed: number;
  amount: number;
  note: string;
}

export interface MockGoal {
  id: string;
  name: string;
  saved: number;
  target: number;
  targetLabel: string | null;
  requiredMonthly: number | null;
  pace: string;
  accountName: string | null;
}

export interface MockContribution {
  id: string;
  date: string;
  origin: string;
  detail: string;
  amount: number;
}

export const ACCOUNTS: MockAccount[] = [
  { id: 'carteira', name: 'Carteira', kind: 'dinheiro vivo', color: '#6FBF74', balance: 840.1 },
  { id: 'nubank', name: 'Nubank', kind: 'conta corrente', color: '#57ACE8', balance: 2140 },
  { id: 'reserva', name: 'Reserva', kind: 'poupança · guarda a meta do notebook', color: '#4FC7B6', balance: 1150 },
  { id: 'inter', name: 'Cartão Inter', kind: 'cartão de crédito', color: '#F9C063', balance: -811.5 },
];

export const OVERDUE: MockDue[] = [
  {
    id: 'internet',
    date: '18/08',
    name: 'Internet fibra',
    category: 'Contas e serviços',
    color: '#9AACB6',
    amount: 120,
    note: 'venceu há 5 dias',
  },
  {
    id: 'academia',
    date: '20/08',
    name: 'Academia',
    category: 'Saúde',
    color: '#F27C7C',
    amount: 70,
    note: 'venceu há 3 dias',
  },
];

export const UPCOMING: MockDue[] = [
  {
    id: 'aluguel',
    date: '25/08',
    name: 'Aluguel',
    category: 'Moradia',
    color: '#BB9086',
    amount: 560,
    note: 'se repete todo mês',
  },
  {
    id: 'notebook',
    date: '26/08',
    name: 'Notebook',
    category: 'Compras',
    color: '#F9C063',
    amount: 220.5,
    note: 'ainda não venceu',
    installment: '4/12',
  },
];

export const CEILINGS: MockCeiling[] = [
  {
    id: 'alimentacao',
    name: 'Alimentação',
    color: '#FF9A4D',
    spent: 756,
    committed: 968.4,
    amount: 1200,
    note: '231,60 ainda cabem',
  },
  {
    id: 'transporte',
    name: 'Transporte',
    color: '#57ACE8',
    spent: 312,
    committed: 440.6,
    amount: 600,
    note: '159,40 ainda cabem',
  },
  {
    id: 'compras',
    name: 'Compras',
    color: '#CE867E',
    spent: 296,
    committed: 518,
    amount: 400,
    note: 'passou 118,00 — e 220,50 são a parcela do notebook, que ainda nem venceu',
  },
  {
    id: 'moradia',
    name: 'Moradia',
    color: '#BB9086',
    spent: 0,
    committed: 560,
    amount: 1200,
    note: 'nada saiu ainda — o aluguel vence dia 25',
  },
];

export const WITHOUT_CEILING = ['Saúde', 'Contas e serviços', 'Lazer'];

export const GOALS: MockGoal[] = [
  {
    id: 'notebook',
    name: 'Notebook novo',
    saved: 1150,
    target: 4200,
    targetLabel: 'março de 2027',
    requiredMonthly: 435.71,
    pace: 'no ritmo dos últimos meses — 230 por mês — você chega em julho, quatro meses depois do que combinou consigo mesmo.',
    accountName: 'Reserva',
  },
  {
    id: 'viagem',
    name: 'Viagem',
    saved: 300,
    target: 3000,
    targetLabel: null,
    requiredMonthly: null,
    pace: 'sem data marcada, então não dá para dizer se está no ritmo.',
    accountName: null,
  },
];

export const CONTRIBUTIONS: MockContribution[] = [
  {
    id: 'ago',
    date: '05/08',
    origin: 'veio do Nubank',
    detail: 'saiu de uma conta e entrou na Reserva',
    amount: 300,
  },
  {
    id: 'jul',
    date: '05/07',
    origin: 'veio do Nubank',
    detail: 'saiu de uma conta e entrou na Reserva',
    amount: 250,
  },
  {
    id: 'jun',
    date: '02/06',
    origin: 'só anotado',
    detail: 'nenhuma conta se mexeu',
    amount: 600,
  },
];

export function totalBalance(): number {
  return ACCOUNTS.reduce((sum, account) => sum + account.balance, 0);
}

export function ceilingTotal(): number {
  return CEILINGS.reduce((sum, item) => sum + item.amount, 0);
}

export function ceilingRemaining(): number {
  return CEILINGS.reduce((sum, item) => sum + (item.amount - item.committed), 0);
}

export function dueTotal(items: MockDue[]): number {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

export function goalById(id: string): MockGoal {
  return GOALS.find((goal) => goal.id === id) ?? (GOALS[0] as MockGoal);
}

export function accountById(id: string): MockAccount {
  return ACCOUNTS.find((account) => account.id === id) ?? (ACCOUNTS[0] as MockAccount);
}

export interface MockMovement {
  id: string;
  date: string;
  name: string;
  category: string | null;
  color: string | null;
  amount: number;
  transfer?: boolean;
  installment?: string;
  note?: string;
}

export const MOVEMENTS: MockMovement[] = [
  {
    id: 'mercado',
    date: '21/08',
    name: 'Mercado Zona Sul',
    category: 'Alimentação',
    color: '#FF9A4D',
    amount: -312.84,
  },
  {
    id: 'notebook',
    date: '05/08',
    name: 'Notebook',
    category: 'Compras',
    color: '#F9C063',
    amount: -220.5,
    installment: '3/12',
  },
  {
    id: 'transferencia',
    date: '02/08',
    name: 'veio do Nubank',
    category: null,
    color: null,
    amount: 900,
    transfer: true,
    note: 'não conta como entrada',
  },
  {
    id: 'posto',
    date: '28/07',
    name: 'Posto Shell',
    category: 'Transporte',
    color: '#57ACE8',
    amount: -178.16,
  },
];
