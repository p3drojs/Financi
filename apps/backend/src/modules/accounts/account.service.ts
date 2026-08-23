import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ConflictError, NotFoundError } from '../../utils/AppError';
import { transactionInclude } from '../transactions/transaction.include';
import { DEFAULT_ACCOUNT } from './account.defaults';
import { CreateAccountInput, ListAccountsQuery, UpdateAccountInput } from './account.schema';
import { AccountMovement, computeBalance } from './account.util';

const RECENT_TRANSACTIONS = 20;

export async function createDefaultAccount(
  userId: string,
  client: Prisma.TransactionClient = prisma,
) {
  return client.account.create({ data: { userId, ...DEFAULT_ACCOUNT } });
}

export async function getDefaultAccountId(userId: string): Promise<string> {
  const account = await prisma.account.findFirst({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  });

  if (!account) {
    throw new NotFoundError('Conta não encontrada');
  }

  return account.id;
}

export async function findAccountOrFail(userId: string, id: string) {
  const account = await prisma.account.findFirst({ where: { id, userId } });

  if (!account) {
    throw new NotFoundError('Conta não encontrada');
  }

  return account;
}

async function movementsByAccount(userId: string, accountId?: string) {
  const grouped = await prisma.transaction.groupBy({
    by: ['accountId', 'type'],
    where: {
      userId,
      paid: true,
      date: { lte: new Date() },
      ...(accountId ? { accountId } : {}),
    },
    _sum: { amount: true },
  });

  const byAccount = new Map<string, AccountMovement[]>();

  for (const group of grouped) {
    const movements = byAccount.get(group.accountId) ?? [];
    movements.push({ type: group.type, total: group._sum.amount ?? new Prisma.Decimal(0) });
    byAccount.set(group.accountId, movements);
  }

  return byAccount;
}

export async function listAccounts(userId: string, query: ListAccountsQuery) {
  const accounts = await prisma.account.findMany({
    where: { userId, ...(query.includeArchived ? {} : { archived: false }) },
    orderBy: { createdAt: 'asc' },
  });

  const byAccount = await movementsByAccount(userId);

  return accounts.map((account) => ({
    ...account,
    balance: computeBalance(account.initialBalance, byAccount.get(account.id) ?? []),
  }));
}

export async function getAccountById(userId: string, id: string) {
  const account = await findAccountOrFail(userId, id);
  const byAccount = await movementsByAccount(userId, id);

  const transactions = await prisma.transaction.findMany({
    where: { userId, accountId: id },
    include: transactionInclude,
    orderBy: { date: 'desc' },
    take: RECENT_TRANSACTIONS,
  });

  return {
    ...account,
    balance: computeBalance(account.initialBalance, byAccount.get(id) ?? []),
    transactions,
  };
}

export async function createAccount(userId: string, input: CreateAccountInput) {
  const existing = await prisma.account.findUnique({
    where: { userId_name: { userId, name: input.name } },
  });

  if (existing) {
    throw new ConflictError('Já existe uma conta com esse nome');
  }

  const account = await prisma.account.create({
    data: {
      userId,
      name: input.name,
      kind: input.kind,
      color: input.color,
      initialBalance: input.initialBalance ?? 0,
    },
  });

  return { ...account, balance: new Prisma.Decimal(account.initialBalance) };
}

export async function updateAccount(userId: string, id: string, input: UpdateAccountInput) {
  await findAccountOrFail(userId, id);

  if (input.name) {
    const existing = await prisma.account.findUnique({
      where: { userId_name: { userId, name: input.name } },
    });

    if (existing && existing.id !== id) {
      throw new ConflictError('Já existe uma conta com esse nome');
    }
  }

  const account = await prisma.account.update({
    where: { id },
    data: {
      name: input.name,
      color: input.color,
      initialBalance: input.initialBalance,
      archived: input.archived,
    },
  });

  const byAccount = await movementsByAccount(userId, id);

  return {
    ...account,
    balance: computeBalance(account.initialBalance, byAccount.get(id) ?? []),
  };
}

export async function deleteAccount(userId: string, id: string) {
  await findAccountOrFail(userId, id);

  const used = await prisma.transaction.count({ where: { userId, accountId: id } });

  if (used > 0) {
    throw new ConflictError(
      'Esta conta tem lançamentos e não pode ser apagada. Arquive-a para tirá-la da lista.',
    );
  }

  await prisma.account.delete({ where: { id } });
}
