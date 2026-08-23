import { Goal, GoalContribution, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError, ConflictError, NotFoundError } from '../../utils/AppError';
import {
  CreateContributionInput,
  CreateGoalInput,
  ListGoalsQuery,
  UpdateGoalInput,
} from './goal.schema';
import { deriveGoal } from './goal.util';

type GoalWithContributions = Goal & { contributions: GoalContribution[] };

function present(goal: GoalWithContributions) {
  const derived = deriveGoal({
    targetAmount: goal.targetAmount,
    targetDate: goal.targetDate,
    contributions: goal.contributions,
  });

  return { ...goal, ...derived };
}

async function findGoalOrFail(userId: string, id: string) {
  const goal = await prisma.goal.findFirst({
    where: { id, userId },
    include: { contributions: { orderBy: { date: 'desc' } } },
  });

  if (!goal) {
    throw new NotFoundError('Meta não encontrada');
  }

  return goal;
}

async function assertAccountBelongsToUser(userId: string, accountId: string) {
  const account = await prisma.account.findFirst({ where: { id: accountId, userId } });

  if (!account) {
    throw new NotFoundError('Conta não encontrada');
  }
}

async function syncAchievedAt(goal: GoalWithContributions) {
  const { remaining } = deriveGoal({
    targetAmount: goal.targetAmount,
    targetDate: goal.targetDate,
    contributions: goal.contributions,
  });

  const achieved = remaining.equals(0);

  if (achieved && !goal.achievedAt) {
    return prisma.goal.update({ where: { id: goal.id }, data: { achievedAt: new Date() } });
  }

  if (!achieved && goal.achievedAt) {
    return prisma.goal.update({ where: { id: goal.id }, data: { achievedAt: null } });
  }

  return goal;
}

export async function listGoals(userId: string, query: ListGoalsQuery) {
  const goals = await prisma.goal.findMany({
    where: { userId, ...(query.includeArchived ? {} : { archived: false }) },
    include: { contributions: true },
    orderBy: { createdAt: 'asc' },
  });

  return goals.map(present);
}

export async function getGoalById(userId: string, id: string) {
  return present(await findGoalOrFail(userId, id));
}

export async function createGoal(userId: string, input: CreateGoalInput) {
  const existing = await prisma.goal.findUnique({
    where: { userId_name: { userId, name: input.name } },
  });

  if (existing) {
    throw new ConflictError('Já existe uma meta com esse nome');
  }

  if (input.targetDate && input.targetDate <= new Date()) {
    throw new AppError('A data-alvo precisa estar no futuro', 400);
  }

  if (input.accountId) {
    await assertAccountBelongsToUser(userId, input.accountId);
  }

  const goal = await prisma.goal.create({
    data: {
      userId,
      name: input.name,
      targetAmount: input.targetAmount,
      targetDate: input.targetDate,
      accountId: input.accountId,
      color: input.color,
    },
    include: { contributions: true },
  });

  return present(goal);
}

export async function updateGoal(userId: string, id: string, input: UpdateGoalInput) {
  await findGoalOrFail(userId, id);

  if (input.name) {
    const existing = await prisma.goal.findUnique({
      where: { userId_name: { userId, name: input.name } },
    });

    if (existing && existing.id !== id) {
      throw new ConflictError('Já existe uma meta com esse nome');
    }
  }

  if (input.accountId) {
    await assertAccountBelongsToUser(userId, input.accountId);
  }

  await prisma.goal.update({
    where: { id },
    data: {
      name: input.name,
      targetAmount: input.targetAmount,
      targetDate: input.targetDate,
      accountId: input.accountId,
      color: input.color,
      archived: input.archived,
    },
  });

  const updated = await findGoalOrFail(userId, id);
  await syncAchievedAt(updated);

  return present(await findGoalOrFail(userId, id));
}

export async function deleteGoal(userId: string, id: string) {
  await findGoalOrFail(userId, id);
  await prisma.goal.delete({ where: { id } });
}

export async function addContribution(
  userId: string,
  goalId: string,
  input: CreateContributionInput,
) {
  await findGoalOrFail(userId, goalId);

  if (input.transactionId) {
    const transaction = await prisma.transaction.findFirst({
      where: { id: input.transactionId, userId },
    });

    if (!transaction) {
      throw new NotFoundError('Lançamento não encontrado');
    }

    const taken = await prisma.goalContribution.findUnique({
      where: { transactionId: input.transactionId },
    });

    if (taken) {
      throw new ConflictError('Este lançamento já está ligado a um aporte');
    }
  }

  await prisma.goalContribution.create({
    data: {
      goalId,
      amount: new Prisma.Decimal(input.amount),
      date: input.date,
      transactionId: input.transactionId,
    },
  });

  const goal = await findGoalOrFail(userId, goalId);
  await syncAchievedAt(goal);

  return present(await findGoalOrFail(userId, goalId));
}

export async function removeContribution(userId: string, goalId: string, contributionId: string) {
  await findGoalOrFail(userId, goalId);

  const contribution = await prisma.goalContribution.findFirst({
    where: { id: contributionId, goalId },
  });

  if (!contribution) {
    throw new NotFoundError('Aporte não encontrado');
  }

  await prisma.goalContribution.delete({ where: { id: contributionId } });

  const goal = await findGoalOrFail(userId, goalId);
  await syncAchievedAt(goal);

  return present(await findGoalOrFail(userId, goalId));
}
