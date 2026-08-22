import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/config/prisma';
import { createCategory, registerUser } from './helpers';

const app = createApp();

async function createTransaction(
  token: string,
  categoryId: string,
  type: 'INCOME' | 'EXPENSE',
  amount: number,
  date: Date,
) {
  return request(app)
    .post('/transactions')
    .set('Authorization', `Bearer ${token}`)
    .send({ categoryId, type, amount, date: date.toISOString() });
}

describe('Dashboard (e2e)', () => {
  it('calcula receita, despesa e saldo no resumo', async () => {
    const { token } = await registerUser(app);
    const income = await createCategory(app, token, { type: 'INCOME' });
    const expense = await createCategory(app, token, { type: 'EXPENSE' });

    await createTransaction(token, income.id, 'INCOME', 1000, new Date());
    await createTransaction(token, expense.id, 'EXPENSE', 300, new Date());

    const res = await request(app)
      .get('/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.totalIncome).toBe('1000');
    expect(res.body.totalExpense).toBe('300');
    expect(res.body.balance).toBe('700');
  });

  it('agrupa gastos por categoria', async () => {
    const { token } = await registerUser(app);
    const category = await createCategory(app, token, { type: 'EXPENSE', name: 'Mercado' });

    await createTransaction(token, category.id, 'EXPENSE', 50, new Date());
    await createTransaction(token, category.id, 'EXPENSE', 25, new Date());

    const res = await request(app)
      .get('/dashboard/by-category')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body[0].categoryName).toBe('Mercado');
    expect(res.body[0].total).toBe('75');
  });

  it('retorna evolução de saldo mês a mês', async () => {
    const { token } = await registerUser(app);
    const category = await createCategory(app, token, { type: 'INCOME' });

    await createTransaction(token, category.id, 'INCOME', 500, new Date());

    const res = await request(app)
      .get('/dashboard/balance-evolution?months=3')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    expect(res.body[2].income).toBe('500');
  });

  it('reabastece o lote de uma recorrência ativa antes de somar o resumo', async () => {
    const { token } = await registerUser(app);
    const category = await createCategory(app, token, { type: 'EXPENSE' });

    const created = await request(app)
      .post('/transactions/recurring')
      .set('Authorization', `Bearer ${token}`)
      .send({
        categoryId: category.id,
        type: 'EXPENSE',
        amount: 30,
        description: 'Assinatura',
        startDate: new Date().toISOString(),
        intervalMonths: 1,
      });

    const recurrenceId = created.body.recurrence.id;
    const esperado = created.body.transactions.length * 30;

    await prisma.transaction.deleteMany({
      where: { recurrenceId, date: { gt: new Date() } },
    });

    const res = await request(app)
      .get('/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Number(res.body.totalExpense)).toBe(esperado);
  });

  it('reabastece o lote antes de agrupar por categoria', async () => {
    const { token } = await registerUser(app);
    const category = await createCategory(app, token, { type: 'EXPENSE', name: 'Streaming' });

    const created = await request(app)
      .post('/transactions/recurring')
      .set('Authorization', `Bearer ${token}`)
      .send({
        categoryId: category.id,
        type: 'EXPENSE',
        amount: 30,
        startDate: new Date().toISOString(),
        intervalMonths: 1,
      });

    const recurrenceId = created.body.recurrence.id;
    const esperado = created.body.transactions.length * 30;

    await prisma.transaction.deleteMany({
      where: { recurrenceId, date: { gt: new Date() } },
    });

    const res = await request(app)
      .get('/dashboard/by-category')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body[0].categoryName).toBe('Streaming');
    expect(Number(res.body[0].total)).toBe(esperado);
  });

  it('reabastece o lote antes de montar a evolução de saldo', async () => {
    const { token } = await registerUser(app);
    const category = await createCategory(app, token, { type: 'EXPENSE' });

    const created = await request(app)
      .post('/transactions/recurring')
      .set('Authorization', `Bearer ${token}`)
      .send({
        categoryId: category.id,
        type: 'EXPENSE',
        amount: 30,
        startDate: new Date().toISOString(),
        intervalMonths: 1,
      });

    const recurrenceId = created.body.recurrence.id;

    await prisma.transaction.deleteMany({
      where: { recurrenceId, date: { gt: new Date() } },
    });

    const res = await request(app)
      .get('/dashboard/balance-evolution?months=1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Number(res.body[0].expense)).toBe(30);

    const restantes = await prisma.transaction.count({
      where: { recurrenceId, date: { gt: new Date() } },
    });
    expect(restantes).toBeGreaterThan(0);
  });
});
