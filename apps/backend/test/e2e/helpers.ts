import request from 'supertest';
import { Express } from 'express';

let counter = 0;

export async function registerUser(app: Express) {
  counter += 1;
  const email = `user${counter}_${Date.now()}@financi.dev`;

  const res = await request(app).post('/auth/register').send({
    email,
    password: 'senha12345',
  });

  return { token: res.body.token as string, userId: res.body.user.id as string, email };
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
