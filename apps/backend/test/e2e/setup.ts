import { prisma } from '../../src/config/prisma';

afterEach(async () => {
  await prisma.transactionTag.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.recurrence.deleteMany();
  await prisma.category.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
