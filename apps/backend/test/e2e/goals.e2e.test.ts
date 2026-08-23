import request from 'supertest';
import { createApp } from '../../src/app';
import { createAccount, createCategory, registerUser } from './helpers';

const app = createApp();

const FUTURE = '2027-03-01T00:00:00.000Z';
const PAST = '2026-01-01T00:00:00.000Z';

async function post(token: string, path: string, body: object) {
  return request(app).post(path).set('Authorization', `Bearer ${token}`).send(body);
}

async function createGoal(token: string, overrides: Record<string, unknown> = {}) {
  return post(token, '/goals', {
    name: 'Notebook novo',
    targetAmount: 4200,
    ...overrides,
  });
}

describe('Metas (e2e)', () => {
  it('cria a meta e devolve os derivados zerados', async () => {
    const { token } = await registerUser(app);

    const res = await createGoal(token, { targetDate: FUTURE });

    expect(res.status).toBe(201);
    expect(Number(res.body.saved)).toBe(0);
    expect(Number(res.body.remaining)).toBe(4200);
    expect(res.body.pace).toBeNull();
    expect(res.body.projectedDate).toBeNull();
    expect(res.body.requiredMonthly).not.toBeNull();
  });

  it('aguenta meta sem data-alvo sem estourar', async () => {
    const { token } = await registerUser(app);

    const res = await createGoal(token);

    expect(res.status).toBe(201);
    expect(res.body.requiredMonthly).toBeNull();
    expect(res.body.onTrack).toBeNull();
  });

  it('recusa data-alvo no passado e nome repetido', async () => {
    const { token } = await registerUser(app);
    await createGoal(token);

    const repeated = await createGoal(token);
    expect(repeated.status).toBe(409);

    const past = await createGoal(token, { name: 'Outra', targetDate: PAST });
    expect(past.status).toBe(400);
  });

  it('soma os aportes e marca achievedAt ao bater o alvo', async () => {
    const { token } = await registerUser(app);
    const goal = await createGoal(token, { targetAmount: 500 });

    const partial = await post(token, `/goals/${goal.body.id}/contributions`, {
      amount: 200,
      date: PAST,
    });

    expect(Number(partial.body.saved)).toBe(200);
    expect(partial.body.achievedAt).toBeNull();

    const closing = await post(token, `/goals/${goal.body.id}/contributions`, {
      amount: 300,
      date: PAST,
    });

    expect(Number(closing.body.saved)).toBe(500);
    expect(Number(closing.body.remaining)).toBe(0);
    expect(closing.body.achievedAt).not.toBeNull();
  });

  it('limpa o achievedAt quando o aporte é apagado', async () => {
    const { token } = await registerUser(app);
    const goal = await createGoal(token, { targetAmount: 100 });

    const contributed = await post(token, `/goals/${goal.body.id}/contributions`, {
      amount: 100,
      date: PAST,
    });

    expect(contributed.body.achievedAt).not.toBeNull();

    const contributionId = contributed.body.contributions[0].id as string;

    const res = await request(app)
      .delete(`/goals/${goal.body.id}/contributions/${contributionId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Number(res.body.saved)).toBe(0);
    expect(res.body.achievedAt).toBeNull();
  });

  it('liga o aporte a um lançamento e recusa reaproveitar o mesmo', async () => {
    const { token } = await registerUser(app);
    const goal = await createGoal(token, { targetAmount: 1000 });
    const category = await createCategory(app, token, { type: 'EXPENSE' });

    const transaction = await post(token, '/transactions', {
      categoryId: category.id,
      type: 'EXPENSE',
      amount: 100,
      date: PAST,
    });

    const first = await post(token, `/goals/${goal.body.id}/contributions`, {
      amount: 100,
      date: PAST,
      transactionId: transaction.body.id,
    });
    expect(first.status).toBe(201);

    const second = await post(token, `/goals/${goal.body.id}/contributions`, {
      amount: 100,
      date: PAST,
      transactionId: transaction.body.id,
    });
    expect(second.status).toBe(409);
  });

  it('guarda o vínculo com a conta sem mexer no dinheiro ainda', async () => {
    const { token } = await registerUser(app);
    const account = await createAccount(app, token, { name: 'Reserva', kind: 'SAVINGS' });

    const goal = await createGoal(token, { accountId: account.id });

    expect(goal.body.accountId).toBe(account.id);

    const accounts = await request(app).get('/accounts').set('Authorization', `Bearer ${token}`);
    const reserva = accounts.body.find((item: { id: string }) => item.id === account.id);
    expect(Number(reserva.balance)).toBe(0);
  });

  it('apaga a meta sem apagar o lançamento que a financiou', async () => {
    const { token } = await registerUser(app);
    const goal = await createGoal(token, { targetAmount: 1000 });
    const category = await createCategory(app, token, { type: 'EXPENSE' });

    const transaction = await post(token, '/transactions', {
      categoryId: category.id,
      type: 'EXPENSE',
      amount: 100,
      date: PAST,
    });

    await post(token, `/goals/${goal.body.id}/contributions`, {
      amount: 100,
      date: PAST,
      transactionId: transaction.body.id,
    });

    const deleted = await request(app)
      .delete(`/goals/${goal.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleted.status).toBe(204);

    const survivor = await request(app)
      .get(`/transactions/${transaction.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(survivor.status).toBe(200);
  });

  it('não vaza meta de outro usuário', async () => {
    const owner = await registerUser(app);
    const stranger = await registerUser(app);
    const goal = await createGoal(owner.token);

    const res = await request(app)
      .get(`/goals/${goal.body.id}`)
      .set('Authorization', `Bearer ${stranger.token}`);

    expect(res.status).toBe(404);
  });
});

describe('Aporte que move dinheiro (e2e)', () => {
  it('tira da conta de origem e põe na conta da meta, sem virar despesa', async () => {
    const { token, accountId } = await registerUser(app);
    const vault = await createAccount(app, token, { name: 'Reserva', kind: 'SAVINGS' });
    await request(app)
      .patch(`/accounts/${accountId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ initialBalance: 1000 });

    const goal = await createGoal(token, { targetAmount: 5000, accountId: vault.id });

    const before = await request(app)
      .get('/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);

    const res = await post(token, `/goals/${goal.body.id}/contributions`, {
      amount: 500,
      date: PAST,
      fromAccountId: accountId,
    });

    expect(res.status).toBe(201);
    expect(Number(res.body.saved)).toBe(500);

    const accounts = await request(app).get('/accounts').set('Authorization', `Bearer ${token}`);
    const source = accounts.body.find((item: { id: string }) => item.id === accountId);
    const target = accounts.body.find((item: { id: string }) => item.id === vault.id);

    expect(Number(source.balance)).toBe(500);
    expect(Number(target.balance)).toBe(500);

    const after = await request(app)
      .get('/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(after.body.totalIncome).toBe(before.body.totalIncome);
    expect(after.body.totalExpense).toBe(before.body.totalExpense);
  });

  it('recusa fromAccountId quando a meta não tem conta vinculada', async () => {
    const { token, accountId } = await registerUser(app);
    const goal = await createGoal(token, { targetAmount: 1000 });

    const res = await post(token, `/goals/${goal.body.id}/contributions`, {
      amount: 100,
      date: PAST,
      fromAccountId: accountId,
    });

    expect(res.status).toBe(400);
  });

  it('sem fromAccountId continua sendo só escrituração', async () => {
    const { token, accountId } = await registerUser(app);
    const vault = await createAccount(app, token, { name: 'Cofre', kind: 'SAVINGS' });
    const goal = await createGoal(token, { targetAmount: 1000, accountId: vault.id });

    await post(token, `/goals/${goal.body.id}/contributions`, { amount: 100, date: PAST });

    const accounts = await request(app).get('/accounts').set('Authorization', `Bearer ${token}`);
    const target = accounts.body.find((item: { id: string }) => item.id === vault.id);
    const source = accounts.body.find((item: { id: string }) => item.id === accountId);

    expect(Number(target.balance)).toBe(0);
    expect(Number(source.balance)).toBe(0);
  });

  it('apagar o aporte desfaz a transferência inteira', async () => {
    const { token, accountId } = await registerUser(app);
    const vault = await createAccount(app, token, { name: 'Guardado', kind: 'SAVINGS' });
    await request(app)
      .patch(`/accounts/${accountId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ initialBalance: 800 });

    const goal = await createGoal(token, { targetAmount: 5000, accountId: vault.id });
    const contributed = await post(token, `/goals/${goal.body.id}/contributions`, {
      amount: 300,
      date: PAST,
      fromAccountId: accountId,
    });

    const contributionId = contributed.body.contributions[0].id as string;

    await request(app)
      .delete(`/goals/${goal.body.id}/contributions/${contributionId}`)
      .set('Authorization', `Bearer ${token}`);

    const accounts = await request(app).get('/accounts').set('Authorization', `Bearer ${token}`);
    const source = accounts.body.find((item: { id: string }) => item.id === accountId);
    const target = accounts.body.find((item: { id: string }) => item.id === vault.id);

    expect(Number(source.balance)).toBe(800);
    expect(Number(target.balance)).toBe(0);

    const listed = await request(app).get('/transactions').set('Authorization', `Bearer ${token}`);
    expect(listed.body.total).toBe(0);
  });
});
