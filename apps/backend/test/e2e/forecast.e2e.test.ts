import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/config/prisma';
import { createAccount, createCategory, registerUser } from './helpers';

const app = createApp();

function utcDay(offsetDays: number): Date {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date;
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function post(token: string, path: string, body: object) {
  return request(app).post(path).set('Authorization', `Bearer ${token}`).send(body);
}

async function forecast(token: string, query = '') {
  return request(app).get(`/dashboard/forecast${query}`).set('Authorization', `Bearer ${token}`);
}

describe('Previsão (e2e)', () => {
  it('projeta o saldo somando só o que está pendente até a data pedida', async () => {
    const { token, accountId } = await registerUser(app);
    await request(app)
      .patch(`/accounts/${accountId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ initialBalance: 1000 });

    const expense = await createCategory(app, token, { type: 'EXPENSE' });
    const income = await createCategory(app, token, { type: 'INCOME' });

    await post(token, '/transactions', {
      categoryId: expense.id,
      type: 'EXPENSE',
      amount: 200,
      date: utcDay(-2).toISOString(),
    });
    await post(token, '/transactions', {
      categoryId: expense.id,
      type: 'EXPENSE',
      amount: 150,
      date: utcDay(3).toISOString(),
    });
    await post(token, '/transactions', {
      categoryId: income.id,
      type: 'INCOME',
      amount: 500,
      date: utcDay(5).toISOString(),
    });

    const res = await forecast(token, `?until=${isoDay(utcDay(10))}`);

    expect(res.status).toBe(200);
    expect(Number(res.body.currentBalance)).toBe(800);
    expect(Number(res.body.pendingExpense)).toBe(150);
    expect(Number(res.body.pendingIncome)).toBe(500);
    expect(Number(res.body.projectedBalance)).toBe(1150);
    expect(res.body.truncated).toBe(false);
  });

  it('acha o vale no meio do caminho, não o último dia', async () => {
    const { token, accountId } = await registerUser(app);
    await request(app)
      .patch(`/accounts/${accountId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ initialBalance: 1000 });

    const expense = await createCategory(app, token, { type: 'EXPENSE' });
    const income = await createCategory(app, token, { type: 'INCOME' });

    await post(token, '/transactions', {
      categoryId: expense.id,
      type: 'EXPENSE',
      amount: 900,
      date: utcDay(2).toISOString(),
    });
    await post(token, '/transactions', {
      categoryId: income.id,
      type: 'INCOME',
      amount: 700,
      date: utcDay(6).toISOString(),
    });

    const res = await forecast(token, `?until=${isoDay(utcDay(8))}`);

    expect(res.body.lowestPoint.date).toBe(isoDay(utcDay(2)));
    expect(Number(res.body.lowestPoint.balance)).toBe(100);
    expect(Number(res.body.projectedBalance)).toBe(800);
  });

  it('trunca a previsão na janela de recorrência já materializada', async () => {
    const { token } = await registerUser(app);

    const res = await forecast(token, `?until=${isoDay(utcDay(730))}`);

    expect(res.body.truncated).toBe(true);
    expect(new Date(res.body.until).getTime()).toBeLessThan(utcDay(730).getTime());
  });

  it('separa o vencido do projetado em vez de somar', async () => {
    const { token } = await registerUser(app);
    const expense = await createCategory(app, token, { type: 'EXPENSE' });

    await post(token, '/transactions', {
      categoryId: expense.id,
      type: 'EXPENSE',
      amount: 190,
      date: utcDay(-5).toISOString(),
      paid: false,
    });

    const res = await forecast(token);

    expect(res.body.overdue.count).toBe(1);
    expect(Number(res.body.overdue.total)).toBe(190);
    expect(Number(res.body.projectedBalance)).toBe(0);
  });

  it('não deixa transferência mexer na previsão', async () => {
    const { token, accountId } = await registerUser(app);
    const destination = await createAccount(app, token, { name: 'Reserva', kind: 'SAVINGS' });
    await request(app)
      .patch(`/accounts/${accountId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ initialBalance: 500 });

    const before = await forecast(token);

    await post(token, '/accounts/transfers', {
      fromAccountId: accountId,
      toAccountId: destination.id,
      amount: 200,
      date: utcDay(2).toISOString(),
    });

    const after = await forecast(token);

    expect(after.body.projectedBalance).toBe(before.body.projectedBalance);
    expect(Number(after.body.pendingExpense)).toBe(0);
    expect(Number(after.body.pendingIncome)).toBe(0);
  });

  it('filtra a previsão por conta', async () => {
    const { token, accountId } = await registerUser(app);
    const other = await createAccount(app, token, { name: 'Outra', kind: 'CHECKING' });

    await request(app)
      .patch(`/accounts/${accountId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ initialBalance: 300 });
    await request(app)
      .patch(`/accounts/${other.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ initialBalance: 700 });

    const all = await forecast(token);
    const only = await forecast(token, `?accountId=${other.id}`);

    expect(Number(all.body.currentBalance)).toBe(1000);
    expect(Number(only.body.currentBalance)).toBe(700);
  });

  it('mantém o contrato antigo do summary quando não se pede conta', async () => {
    const { token } = await registerUser(app);
    const res = await request(app)
      .get('/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual(['balance', 'totalExpense', 'totalIncome']);
  });

  it('deixa a última ponta do daily bater com o projectedBalance', async () => {
    const { token } = await registerUser(app);
    const expense = await createCategory(app, token, { type: 'EXPENSE' });

    await post(token, '/transactions', {
      categoryId: expense.id,
      type: 'EXPENSE',
      amount: 60,
      date: utcDay(4).toISOString(),
    });

    const res = await forecast(token, `?until=${isoDay(utcDay(9))}`);
    const last = res.body.daily[res.body.daily.length - 1];

    expect(Number(last.balance)).toBe(Number(res.body.projectedBalance));
    expect(res.body.daily).toHaveLength(10);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
