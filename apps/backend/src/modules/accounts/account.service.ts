import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { NotFoundError } from '../../utils/AppError';
import { DEFAULT_ACCOUNT } from './account.defaults';

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
