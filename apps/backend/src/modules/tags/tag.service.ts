import { prisma } from '../../config/prisma';
import { ConflictError, NotFoundError } from '../../utils/AppError';

export async function findOrCreateTags(userId: string, names: string[]) {
  const uniqueNames = [...new Set(names.map((n) => n.trim()).filter(Boolean))];

  if (uniqueNames.length === 0) {
    return [];
  }

  return Promise.all(
    uniqueNames.map((name) =>
      prisma.tag.upsert({
        where: { userId_name: { userId, name } },
        update: {},
        create: { userId, name },
      }),
    ),
  );
}

export async function listTags(userId: string) {
  return prisma.tag.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
  });
}

export async function deleteTag(userId: string, id: string) {
  const tag = await prisma.tag.findFirst({ where: { id, userId } });

  if (!tag) {
    throw new NotFoundError('Tag não encontrada');
  }

  const inUse = await prisma.transactionTag.findFirst({ where: { tagId: id } });
  if (inUse) {
    throw new ConflictError('Tag em uso por transações existentes e não pode ser excluída');
  }

  await prisma.tag.delete({ where: { id } });
}
