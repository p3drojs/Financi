import { TransactionType } from '@prisma/client';
import { prisma } from '../src/config/prisma';
import { createDefaultCategories } from '../src/modules/categories/category.service';
import {
  createInstallmentTransaction,
  createRecurringTransaction,
  createTransaction,
} from '../src/modules/transactions/transaction.service';
import { hashPassword } from '../src/utils/password';

const SEED_USER = {
  email: 'pedro@financi.app',
  name: 'Pedro',
  password: '123456789',
};

const today = new Date();
const baseYear = today.getUTCFullYear();
const baseMonth = today.getUTCMonth();

function monthDay(monthOffset: number, day: number): Date {
  return new Date(Date.UTC(baseYear, baseMonth + monthOffset, day));
}

interface SingleSeed {
  category: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: Date;
  tagNames?: string[];
}

interface RecurringSeed {
  category: string;
  type: TransactionType;
  amount: number;
  description: string;
  startDate: Date;
  intervalMonths: number;
  tagNames?: string[];
}

interface InstallmentSeed {
  category: string;
  type: TransactionType;
  amount: number;
  description: string;
  startDate: Date;
  installmentTotal: number;
  tagNames?: string[];
}

const RECURRING: RecurringSeed[] = [
  {
    category: 'Salário',
    type: 'INCOME',
    amount: 6500,
    description: 'Salário mensal',
    startDate: monthDay(-6, 5),
    intervalMonths: 1,
    tagNames: ['trabalho'],
  },
  {
    category: 'Moradia',
    type: 'EXPENSE',
    amount: 1800,
    description: 'Aluguel',
    startDate: monthDay(-6, 10),
    intervalMonths: 1,
    tagNames: ['casa', 'fixo'],
  },
  {
    category: 'Contas e serviços',
    type: 'EXPENSE',
    amount: 119.9,
    description: 'Internet fibra',
    startDate: monthDay(-6, 15),
    intervalMonths: 1,
    tagNames: ['casa', 'fixo'],
  },
  {
    category: 'Saúde',
    type: 'EXPENSE',
    amount: 129.9,
    description: 'Academia',
    startDate: monthDay(-3, 8),
    intervalMonths: 1,
    tagNames: ['assinatura'],
  },
  {
    category: 'Transporte',
    type: 'EXPENSE',
    amount: 480,
    description: 'Seguro do carro',
    startDate: monthDay(-4, 20),
    intervalMonths: 3,
    tagNames: ['carro'],
  },
];

const INSTALLMENTS: InstallmentSeed[] = [
  {
    category: 'Compras',
    type: 'EXPENSE',
    amount: 4800,
    description: 'Notebook',
    startDate: monthDay(-3, 12),
    installmentTotal: 12,
    tagNames: ['trabalho'],
  },
  {
    category: 'Lazer',
    type: 'EXPENSE',
    amount: 2400,
    description: 'Passagens aéreas',
    startDate: monthDay(-1, 3),
    installmentTotal: 6,
    tagNames: ['viagem'],
  },
];

const SINGLES: SingleSeed[] = [
  {
    category: 'Freelance',
    type: 'INCOME',
    amount: 1200,
    description: 'Landing page para cliente',
    date: monthDay(-2, 18),
    tagNames: ['trabalho'],
  },
  {
    category: 'Investimentos',
    type: 'INCOME',
    amount: 85.3,
    description: 'Dividendos',
    date: monthDay(-1, 14),
  },
  {
    category: 'Outras receitas',
    type: 'INCOME',
    amount: 350,
    description: 'Venda de monitor antigo',
    date: monthDay(0, 6),
  },
  {
    category: 'Alimentação',
    type: 'EXPENSE',
    amount: 412.75,
    description: 'Mercado do mês',
    date: monthDay(-2, 3),
    tagNames: ['mercado'],
  },
  {
    category: 'Alimentação',
    type: 'EXPENSE',
    amount: 68.4,
    description: 'Delivery',
    date: monthDay(-2, 21),
    tagNames: ['delivery'],
  },
  {
    category: 'Alimentação',
    type: 'EXPENSE',
    amount: 389.2,
    description: 'Mercado do mês',
    date: monthDay(-1, 2),
    tagNames: ['mercado'],
  },
  {
    category: 'Alimentação',
    type: 'EXPENSE',
    amount: 94.9,
    description: 'Almoço com a equipe',
    date: monthDay(-1, 17),
    tagNames: ['trabalho'],
  },
  {
    category: 'Alimentação',
    type: 'EXPENSE',
    amount: 427.6,
    description: 'Mercado do mês',
    date: monthDay(0, 4),
    tagNames: ['mercado'],
  },
  {
    category: 'Alimentação',
    type: 'EXPENSE',
    amount: 52.3,
    description: 'Delivery',
    date: monthDay(0, 11),
    tagNames: ['delivery'],
  },
  {
    category: 'Transporte',
    type: 'EXPENSE',
    amount: 210,
    description: 'Gasolina',
    date: monthDay(-2, 9),
    tagNames: ['carro'],
  },
  {
    category: 'Transporte',
    type: 'EXPENSE',
    amount: 198.5,
    description: 'Gasolina',
    date: monthDay(-1, 8),
    tagNames: ['carro'],
  },
  {
    category: 'Transporte',
    type: 'EXPENSE',
    amount: 47.9,
    description: 'Corridas de app',
    date: monthDay(0, 9),
  },
  {
    category: 'Contas e serviços',
    type: 'EXPENSE',
    amount: 187.44,
    description: 'Energia elétrica',
    date: monthDay(-2, 12),
    tagNames: ['casa'],
  },
  {
    category: 'Contas e serviços',
    type: 'EXPENSE',
    amount: 203.18,
    description: 'Energia elétrica',
    date: monthDay(-1, 12),
    tagNames: ['casa'],
  },
  {
    category: 'Contas e serviços',
    type: 'EXPENSE',
    amount: 39.9,
    description: 'Streaming',
    date: monthDay(0, 7),
    tagNames: ['assinatura'],
  },
  {
    category: 'Lazer',
    type: 'EXPENSE',
    amount: 76,
    description: 'Cinema',
    date: monthDay(-1, 23),
  },
  {
    category: 'Educação',
    type: 'EXPENSE',
    amount: 297,
    description: 'Curso de React Native',
    date: monthDay(-2, 26),
    tagNames: ['trabalho', 'estudo'],
  },
  {
    category: 'Saúde',
    type: 'EXPENSE',
    amount: 180,
    description: 'Consulta odontológica',
    date: monthDay(-1, 27),
  },
  {
    category: 'Compras',
    type: 'EXPENSE',
    amount: 129.99,
    description: 'Tênis de corrida',
    date: monthDay(0, 13),
  },
  {
    category: 'Outras despesas',
    type: 'EXPENSE',
    amount: 60,
    description: 'Presente de aniversário',
    date: monthDay(0, 15),
  },
];

async function resetSeedUser() {
  const existing = await prisma.user.findUnique({ where: { email: SEED_USER.email } });
  const passwordHash = await hashPassword(SEED_USER.password);

  if (!existing) {
    return prisma.user.create({
      data: { email: SEED_USER.email, name: SEED_USER.name, passwordHash },
    });
  }

  await prisma.transaction.deleteMany({ where: { userId: existing.id } });
  await prisma.recurrence.deleteMany({ where: { userId: existing.id } });
  await prisma.tag.deleteMany({ where: { userId: existing.id } });
  await prisma.category.deleteMany({ where: { userId: existing.id } });

  return prisma.user.update({
    where: { id: existing.id },
    data: { name: SEED_USER.name, passwordHash },
  });
}

async function loadCategories(userId: string) {
  const categories = await prisma.category.findMany({ where: { userId } });
  return new Map(categories.map((category) => [`${category.type}:${category.name}`, category.id]));
}

function resolveCategoryId(categories: Map<string, string>, type: TransactionType, name: string) {
  const id = categories.get(`${type}:${name}`);

  if (!id) {
    throw new Error(`Categoria "${name}" (${type}) não encontrada para o usuário da seed`);
  }

  return id;
}

async function main() {
  const user = await resetSeedUser();
  await createDefaultCategories(user.id);

  const categories = await loadCategories(user.id);

  for (const item of RECURRING) {
    await createRecurringTransaction(user.id, {
      categoryId: resolveCategoryId(categories, item.type, item.category),
      type: item.type,
      amount: item.amount,
      description: item.description,
      startDate: item.startDate,
      intervalMonths: item.intervalMonths,
      tagNames: item.tagNames,
    });
  }

  for (const item of INSTALLMENTS) {
    await createInstallmentTransaction(user.id, {
      categoryId: resolveCategoryId(categories, item.type, item.category),
      type: item.type,
      amount: item.amount,
      description: item.description,
      startDate: item.startDate,
      installmentTotal: item.installmentTotal,
      tagNames: item.tagNames,
    });
  }

  for (const item of SINGLES) {
    await createTransaction(user.id, {
      categoryId: resolveCategoryId(categories, item.type, item.category),
      type: item.type,
      amount: item.amount,
      description: item.description,
      date: item.date,
      tagNames: item.tagNames,
    });
  }

  const [transactions, recurrences, tags] = await Promise.all([
    prisma.transaction.count({ where: { userId: user.id } }),
    prisma.recurrence.count({ where: { userId: user.id } }),
    prisma.tag.count({ where: { userId: user.id } }),
  ]);

  console.log(`Seed concluida para ${SEED_USER.email} (senha: ${SEED_USER.password})`);
  console.log(`${transactions} transacoes, ${recurrences} recorrencias, ${tags} tags`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
