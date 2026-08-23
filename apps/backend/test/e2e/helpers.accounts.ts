import request from 'supertest';
import { Express } from 'express';

export async function createTransfer(
  app: Express,
  token: string,
  input: { fromAccountId: string; toAccountId: string; amount: number; date?: string },
) {
  return request(app)
    .post('/accounts/transfers')
    .set('Authorization', `Bearer ${token}`)
    .send({
      fromAccountId: input.fromAccountId,
      toAccountId: input.toAccountId,
      amount: input.amount,
      date: input.date ?? new Date('2026-03-10').toISOString(),
    });
}

export async function listAccounts(app: Express, token: string) {
  const res = await request(app).get('/accounts').set('Authorization', `Bearer ${token}`);
  return res.body as { id: string; name: string; balance: string }[];
}

export function balanceOf(accounts: { id: string; balance: string }[], accountId: string): number {
  const account = accounts.find((item) => item.id === accountId);
  return Number(account?.balance ?? 0);
}
