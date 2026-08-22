import { prisma } from '../../src/config/prisma';

afterEach(async () => {
  await prisma.transactionTag.deleteMany();
  await prisma.goalContribution.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.recurrence.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.category.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
