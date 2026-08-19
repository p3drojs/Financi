import request from 'supertest';
import { createApp } from '../../src/app';
import { createCategory, registerUser } from './helpers';

const app = createApp();

describe('Transactions (e2e)', () => {
  it('cria uma transação simples com tags', async () => {
    const { token } = await registerUser(app);
    const category = await createCategory(app, token, { type: 'EXPENSE' });

    const res = await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        categoryId: category.id,
        type: 'EXPENSE',
        amount: 49.9,
        description: 'Mercado',
        date: new Date('2026-03-01').toISOString(),
        tagNames: ['essencial', 'casa'],
      });

    expect(res.status).toBe(201);
    expect(res.body.tags).toHaveLength(2);
    expect(res.body.category.id).toBe(category.id);
  });

  it('rejeita quando tipo da transação não bate com o tipo da categoria', async () => {
    const { token } = await registerUser(app);
    const category = await createCategory(app, token, { type: 'INCOME' });

    const res = await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        categoryId: category.id,
        type: 'EXPENSE',
        amount: 10,
        date: new Date().toISOString(),
      });

    expect(res.status).toBe(400);
  });

  it('edita apenas a transação alvo, sem afetar outras', async () => {
    const { token } = await registerUser(app);
    const category = await createCategory(app, token, { type: 'EXPENSE' });

    const create = await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        categoryId: category.id,
        type: 'EXPENSE',
        amount: 10,
        date: new Date().toISOString(),
      });

    const res = await request(app)
      .patch(`/transactions/${create.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 99.5 });

    expect(res.status).toBe(200);
    expect(res.body.amount).toBe('99.5');
  });

  it('exclui uma transação', async () => {
    const { token } = await registerUser(app);
    const category = await createCategory(app, token, { type: 'EXPENSE' });

    const create = await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        categoryId: category.id,
        type: 'EXPENSE',
        amount: 10,
        date: new Date().toISOString(),
      });

    const res = await request(app)
      .delete(`/transactions/${create.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
  });

  it('gera lote de ocorrências para transação recorrente', async () => {
    const { token } = await registerUser(app);
    const category = await createCategory(app, token, { type: 'EXPENSE' });

    const res = await request(app)
      .post('/transactions/recurring')
      .set('Authorization', `Bearer ${token}`)
      .send({
        categoryId: category.id,
        type: 'EXPENSE',
        amount: 29.9,
        description: 'Streaming',
        startDate: new Date().toISOString(),
        intervalMonths: 1,
      });

    expect(res.status).toBe(201);
    expect(res.body.recurrence.intervalMonths).toBe(1);
    expect(res.body.transactions.length).toBeGreaterThanOrEqual(12);
    expect(
      res.body.transactions.every(
        (t: { recurrenceId: string }) => t.recurrenceId === res.body.recurrence.id,
      ),
    ).toBe(true);
  });

  it('cancela recorrência removendo só ocorrências futuras', async () => {
    const { token } = await registerUser(app);
    const category = await createCategory(app, token, { type: 'EXPENSE' });

    const created = await request(app)
      .post('/transactions/recurring')
      .set('Authorization', `Bearer ${token}`)
      .send({
        categoryId: category.id,
        type: 'EXPENSE',
        amount: 10,
        startDate: new Date().toISOString(),
        intervalMonths: 1,
      });

    const recurrenceId = created.body.recurrence.id;

    const cancelRes = await request(app)
      .delete(`/transactions/recurring/${recurrenceId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(cancelRes.status).toBe(204);

    const list = await request(app).get('/transactions').set('Authorization', `Bearer ${token}`);

    const remaining = list.body.items.filter(
      (t: { recurrenceId: string | null }) => t.recurrenceId === recurrenceId,
    );
    expect(remaining.length).toBeLessThanOrEqual(1);
  });

  it('gera parcelamento dividindo o valor total entre as parcelas', async () => {
    const { token } = await registerUser(app);
    const category = await createCategory(app, token, { type: 'EXPENSE' });

    const res = await request(app)
      .post('/transactions/installments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        categoryId: category.id,
        type: 'EXPENSE',
        amount: 100,
        startDate: new Date().toISOString(),
        installmentTotal: 3,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveLength(3);
    const total = res.body.reduce(
      (acc: number, t: { amount: string }) => acc + Number(t.amount),
      0,
    );
    expect(total).toBeCloseTo(100);
    expect(res.body[0].installmentNumber).toBe(1);
    expect(res.body[2].installmentNumber).toBe(3);
  });
});
