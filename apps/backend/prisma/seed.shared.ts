import { prisma } from '../src/config/prisma';
import { createDefaultCategories } from '../src/modules/categories/category.service';
import { hashPassword } from '../src/utils/password';

export const SEED_USER = {
  email: 'pedro@financi.app',
  name: 'Pedro',
  password: '123456789',
};

export async function resetSeedUser() {
  const existing = await prisma.user.findUnique({ where: { email: SEED_USER.email } });
  const passwordHash = await hashPassword(SEED_USER.password);

  const user = existing
    ? await resetExistingUser(existing.id, passwordHash)
    : await prisma.user.create({
        data: { email: SEED_USER.email, name: SEED_USER.name, passwordHash },
      });

  await createDefaultCategories(user.id);

  return user;
}

async function resetExistingUser(userId: string, passwordHash: string) {
  await prisma.transaction.deleteMany({ where: { userId } });
  await prisma.recurrence.deleteMany({ where: { userId } });
  await prisma.tag.deleteMany({ where: { userId } });
  await prisma.category.deleteMany({ where: { userId } });

  return prisma.user.update({
    where: { id: userId },
    data: { name: SEED_USER.name, passwordHash },
  });
}

export function runSeed(task: () => Promise<void>): void {
  task()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
