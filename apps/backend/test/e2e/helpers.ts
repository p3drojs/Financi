import request from 'supertest';
import { Express } from 'express';
import { AccountKind } from '@prisma/client';
import { prisma } from '../../src/config/prisma';

let counter = 0;

export async function registerUser(app: Express) {
  counter += 1;
  const email = `user${counter}_${Date.now()}@financi.dev`;

  const res = await request(app).post('/auth/register').send({
    email,
    password: 'senha12345',
  });

  const userId = res.body.user.id as string;
  const account = await prisma.account.findFirstOrThrow({ where: { userId } });

  return {
    token: res.body.token as string,
    userId,
    email,
    accountId: account.id,
  };
}

export async function createCategory(
  app: Express,
  token: string,
  overrides: Partial<{ name: string; type: 'INCOME' | 'EXPENSE'; color: string }> = {},
) {
  counter += 1;
  const res = await request(app)
    .post('/categories')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: overrides.name ?? `Categoria ${counter}`,
      type: overrides.type ?? 'EXPENSE',
      color: overrides.color,
    });

  return res.body;
}

export async function createAccount(
  app: Express,
  token: string,
  overrides: Partial<{
    name: string;
    kind: AccountKind;
    color: string;
    initialBalance: number;
  }> = {},
) {
  counter += 1;
  const res = await request(app)
    .post('/accounts')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: overrides.name ?? `Conta ${counter}`,
      kind: overrides.kind ?? 'CHECKING',
      color: overrides.color,
      initialBalance: overrides.initialBalance,
    });

  return res.body;
}
