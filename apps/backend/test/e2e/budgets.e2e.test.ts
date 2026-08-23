import request from 'supertest';
import { createApp } from '../../src/app';
import { createCategory, registerUser } from './helpers';

const app = createApp();

const MONTH = '2026-08';
const IN_MONTH = '2026-08-10T00:00:00.000Z';

async function post(token: string, path: string, body: object) {
  return request(app).post(path).set('Authorization', `Bearer ${token}`).send(body);
}

async function budgets(token: string, month = MONTH) {
  return request(app).get(`/budgets?month=${month}`).set('Authorization', `Bearer ${token}`);
}

describe('Orçamento (e2e)', () => {
  it('cria um teto e devolve zeros enquanto não há gasto', async () => {
    const { token } = await registerUser(app);
    const category = await createCategory(app, token, { type: 'EXPENSE' });

    const created = await post(token, '/budgets', {
      categoryId: category.id,
      month: MONTH,
      amount: 900,
    });

    expect(created.status).toBe(201);

    const res = await budgets(token);

    expect(res.body.month).toBe(MONTH);
    expect(res.body.items).toHaveLength(1);
    expect(Number(res.body.items[0].spent)).toBe(0);
    expect(Number(res.body.items[0].committed)).toBe(0);
    expect(Number(res.body.items[0].remaining)).toBe(900);
    expect(res.body.items[0].status).toBe('OK');
  });

  it('separa o que já saiu do que só está prometido', async () => {
    const { token } = await registerUser(app);
    const category = await createCategory(app, token, { type: 'EXPENSE' });
    await post(token, '/budgets', { categoryId: category.id, month: MONTH, amount: 1000 });

    await post(token, '/transactions', {
      categoryId: category.id,
      type: 'EXPENSE',
      amount: 300,
      date: IN_MONTH,
      paid: true,
    });
    await post(token, '/transactions', {
      categoryId: category.id,
      type: 'EXPENSE',
      amount: 500,
      date: IN_MONTH,
      paid: false,
    });

    const res = await budgets(token);
    const item = res.body.items[0];

    expect(Number(item.spent)).toBe(300);
    expect(Number(item.committed)).toBe(800);
    expect(Number(item.remaining)).toBe(200);
    expect(item.status).toBe('WARNING');
  });

  it('estoura o teto por causa de parcela que ainda nem venceu', async () => {
    const { token } = await registerUser(app);
    const category = await createCategory(app, token, { type: 'EXPENSE' });
    await post(token, '/budgets', { categoryId: category.id, month: MONTH, amount: 400 });

    await post(token, '/transactions', {
      categoryId: category.id,
      type: 'EXPENSE',
      amount: 297.5,
      date: IN_MONTH,
      paid: true,
    });
    await post(token, '/transactions', {
      categoryId: category.id,
      type: 'EXPENSE',
      amount: 220.5,
      date: IN_MONTH,
      paid: false,
    });

    const item = (await budgets(token)).body.items[0];

    expect(Number(item.spent)).toBe(297.5);
    expect(Number(item.committed)).toBe(518);
    expect(Number(item.remaining)).toBe(-118);
    expect(item.status).toBe('OVER');
  });

  it('recusa teto duplicado, categoria de entrada e categoria de sistema', async () => {
    const { token } = await registerUser(app);
    const expense = await createCategory(app, token, { type: 'EXPENSE' });
    const income = await createCategory(app, token, { type: 'INCOME' });

    await post(token, '/budgets', { categoryId: expense.id, month: MONTH, amount: 100 });

    const duplicated = await post(token, '/budgets', {
      categoryId: expense.id,
      month: MONTH,
      amount: 200,
    });
    expect(duplicated.status).toBe(409);

    const wrongType = await post(token, '/budgets', {
      categoryId: income.id,
      month: MONTH,
      amount: 200,
    });
    expect(wrongType.status).toBe(400);

    const withSystem = await request(app)
      .get('/categories?includeSystem=true')
      .set('Authorization', `Bearer ${token}`);
    const system = withSystem.body.find(
      (category: { system: boolean; type: string }) =>
        category.system && category.type === 'EXPENSE',
    );

    const systemBudget = await post(token, '/budgets', {
      categoryId: system.id,
      month: MONTH,
      amount: 200,
    });
    expect(systemBudget.status).toBe(400);
  });

  it('recusa month fora do formato YYYY-MM', async () => {
    const { token } = await registerUser(app);
    const category = await createCategory(app, token, { type: 'EXPENSE' });

    const res = await post(token, '/budgets', {
      categoryId: category.id,
      month: '2026-8',
      amount: 100,
    });

    expect(res.status).toBe(400);
  });

  it('não conta gasto de categoria sem teto nos totais', async () => {
    const { token } = await registerUser(app);
    const budgeted = await createCategory(app, token, { type: 'EXPENSE', name: 'Com teto' });
    const loose = await createCategory(app, token, { type: 'EXPENSE', name: 'Sem teto' });

    await post(token, '/budgets', { categoryId: budgeted.id, month: MONTH, amount: 500 });
    await post(token, '/transactions', {
      categoryId: budgeted.id,
      type: 'EXPENSE',
      amount: 100,
      date: IN_MONTH,
      paid: true,
    });
    await post(token, '/transactions', {
      categoryId: loose.id,
      type: 'EXPENSE',
      amount: 999,
      date: IN_MONTH,
      paid: true,
    });

    const res = await budgets(token);

    expect(res.body.items).toHaveLength(1);
    expect(Number(res.body.totalBudgeted)).toBe(500);
    expect(Number(res.body.totalSpent)).toBe(100);
    expect(Number(res.body.totalCommitted)).toBe(100);
  });

  it('não deixa gasto de outro mês entrar na conta', async () => {
    const { token } = await registerUser(app);
    const category = await createCategory(app, token, { type: 'EXPENSE' });
    await post(token, '/budgets', { categoryId: category.id, month: MONTH, amount: 500 });

    await post(token, '/transactions', {
      categoryId: category.id,
      type: 'EXPENSE',
      amount: 400,
      date: '2026-09-01T00:00:00.000Z',
      paid: true,
    });

    const item = (await budgets(token)).body.items[0];
    expect(Number(item.committed)).toBe(0);
  });

  it('copia do mês anterior pulando o que já existe', async () => {
    const { token } = await registerUser(app);
    const first = await createCategory(app, token, { type: 'EXPENSE', name: 'Primeira' });
    const second = await createCategory(app, token, { type: 'EXPENSE', name: 'Segunda' });

    await post(token, '/budgets', { categoryId: first.id, month: '2026-07', amount: 100 });
    await post(token, '/budgets', { categoryId: second.id, month: '2026-07', amount: 200 });
    await post(token, '/budgets', { categoryId: first.id, month: MONTH, amount: 999 });

    const res = await post(token, '/budgets/copy', { fromMonth: '2026-07', toMonth: MONTH });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ created: 1, skipped: 1 });

    const items = (await budgets(token)).body.items;
    expect(items).toHaveLength(2);
    expect(
      Number(items.find((i: { categoryId: string }) => i.categoryId === first.id).amount),
    ).toBe(999);
  });

  it('atualiza e apaga o teto', async () => {
    const { token } = await registerUser(app);
    const category = await createCategory(app, token, { type: 'EXPENSE' });
    const created = await post(token, '/budgets', {
      categoryId: category.id,
      month: MONTH,
      amount: 100,
    });

    const patched = await request(app)
      .patch(`/budgets/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 250 });

    expect(Number(patched.body.amount)).toBe(250);

    const deleted = await request(app)
      .delete(`/budgets/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleted.status).toBe(204);
    expect((await budgets(token)).body.items).toHaveLength(0);
  });
});
