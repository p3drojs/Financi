import { Prisma, TransactionType } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ConflictError, NotFoundError } from '../../utils/AppError';
import { CreateCategoryInput, UpdateCategoryInput } from './category.schema';
import { DEFAULT_CATEGORIES } from './category.defaults';

export async function createDefaultCategories(
  userId: string,
  client: Prisma.TransactionClient = prisma,
) {
  return client.category.createMany({
    data: DEFAULT_CATEGORIES.map((category) => ({ userId, ...category })),
    skipDuplicates: true,
  });
}

export async function createCategory(userId: string, input: CreateCategoryInput) {
  const existing = await prisma.category.findUnique({
    where: { userId_name_type: { userId, name: input.name, type: input.type } },
  });

  if (existing) {
    throw new ConflictError('Já existe uma categoria com esse nome para esse tipo');
  }

  return prisma.category.create({
    data: {
      userId,
      name: input.name,
      type: input.type,
      color: input.color,
    },
  });
}

export async function listCategories(userId: string, type?: TransactionType) {
  return prisma.category.findMany({
    where: { userId, ...(type ? { type } : {}) },
    orderBy: { name: 'asc' },
  });
}

export async function getCategoryById(userId: string, id: string) {
  const category = await prisma.category.findFirst({ where: { id, userId } });

  if (!category) {
    throw new NotFoundError('Categoria não encontrada');
  }

  return category;
}

export async function updateCategory(userId: string, id: string, input: UpdateCategoryInput) {
  await getCategoryById(userId, id);

  if (input.name) {
    const existing = await prisma.category.findFirst({
      where: { userId, name: input.name, id: { not: id } },
    });

    if (existing) {
      throw new ConflictError('Já existe uma categoria com esse nome para esse tipo');
    }
  }

  return prisma.category.update({
    where: { id },
    data: { name: input.name, color: input.color },
  });
}

export async function deleteCategory(userId: string, id: string) {
  await getCategoryById(userId, id);

  const inUse = await prisma.transaction.findFirst({ where: { categoryId: id } });
  if (inUse) {
    throw new ConflictError('Categoria em uso por transações existentes e não pode ser excluída');
  }

  const inUseByRecurrence = await prisma.recurrence.findFirst({ where: { categoryId: id } });
  if (inUseByRecurrence) {
    throw new ConflictError('Categoria em uso por uma recorrência ativa e não pode ser excluída');
  }

  await prisma.category.delete({ where: { id } });
}
