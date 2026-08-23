import { randomUUID } from 'node:crypto';
import { Prisma, TransactionType } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError, ConflictError, NotFoundError } from '../../utils/AppError';
import {
  SYSTEM_TRANSFER_CATEGORY_COLOR,
  SYSTEM_TRANSFER_CATEGORY_NAME,
} from '../categories/category.defaults';
import { transactionInclude } from '../transactions/transaction.include';
import { resolvePaid } from '../transactions/transaction.util';
import { DEFAULT_ACCOUNT } from './account.defaults';
import {
  CreateAccountInput,
  CreateTransferInput,
  ListAccountsQuery,
  UpdateAccountInput,
} from './account.schema';
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

async function findOrCreateTransferCategory(
  userId: string,
  type: TransactionType,
  client: Prisma.TransactionClient,
) {
  const existing = await client.category.findUnique({
    where: {
      userId_name_type: { userId, name: SYSTEM_TRANSFER_CATEGORY_NAME, type },
    },
  });

  if (existing) {
    return existing;
  }

  return client.category.create({
    data: {
      userId,
      name: SYSTEM_TRANSFER_CATEGORY_NAME,
      type,
      color: SYSTEM_TRANSFER_CATEGORY_COLOR,
      system: true,
    },
  });
}

export async function createTransfer(userId: string, input: CreateTransferInput) {
  if (input.fromAccountId === input.toAccountId) {
    throw new AppError('A conta de origem e a de destino precisam ser diferentes', 400);
  }

  const [from, to] = await Promise.all([
    findAccountOrFail(userId, input.fromAccountId),
    findAccountOrFail(userId, input.toAccountId),
  ]);

  if (from.archived || to.archived) {
    throw new AppError('Conta arquivada não recebe nem envia transferência', 400);
  }

  const transferGroupId = randomUUID();
  const paidState = resolvePaid(input.date);

  return prisma.$transaction(async (tx) => {
    const [outgoingCategory, incomingCategory] = await Promise.all([
      findOrCreateTransferCategory(userId, 'EXPENSE', tx),
      findOrCreateTransferCategory(userId, 'INCOME', tx),
    ]);

    const shared = {
      userId,
      amount: new Prisma.Decimal(input.amount),
      description: input.description,
      date: input.date,
      transferGroupId,
      ...paidState,
    };

    const outgoing = await tx.transaction.create({
      data: {
        ...shared,
        accountId: input.fromAccountId,
        categoryId: outgoingCategory.id,
        type: 'EXPENSE',
      },
      include: transactionInclude,
    });

    const incoming = await tx.transaction.create({
      data: {
        ...shared,
        accountId: input.toAccountId,
        categoryId: incomingCategory.id,
        type: 'INCOME',
      },
      include: transactionInclude,
    });

    return { transferGroupId, from: outgoing, to: incoming };
  });
}

export async function deleteTransfer(userId: string, transferGroupId: string) {
  const legs = await prisma.transaction.count({ where: { userId, transferGroupId } });

  if (legs === 0) {
    throw new NotFoundError('Transferência não encontrada');
  }

  await prisma.transaction.deleteMany({ where: { userId, transferGroupId } });
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
