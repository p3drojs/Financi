import request from 'supertest';
import { createApp } from '../../src/app';
import { createAccount, createCategory, registerUser } from './helpers';
import { balanceOf, createTransfer, listAccounts } from './helpers.accounts';

const app = createApp();

const PAST = new Date('2026-03-01').toISOString();

async function createTransaction(
  token: string,
  input: { categoryId: string; type: 'INCOME' | 'EXPENSE'; amount: number },
) {
  return request(app)
    .post('/transactions')
    .set('Authorization', `Bearer ${token}`)
    .send({ ...input, date: PAST });
}

describe('Accounts (e2e)', () => {
  it('nasce com a conta padrão e devolve o saldo inicial', async () => {
    const { token, accountId } = await registerUser(app);

    const accounts = await listAccounts(app, token);

    expect(accounts).toHaveLength(1);
    expect(accounts[0]?.id).toBe(accountId);
    expect(Number(accounts[0]?.balance)).toBe(0);
  });

  it('recusa nome repetido com 409', async () => {
    const { token } = await registerUser(app);
    await createAccount(app, token, { name: 'Nubank' });

    const res = await request(app)
      .post('/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Nubank', kind: 'CHECKING' });

    expect(res.status).toBe(409);
  });

  it('soma receita e desconta despesa no saldo, partindo do saldo inicial', async () => {
    const { token, accountId } = await registerUser(app);
    await request(app)
      .patch(`/accounts/${accountId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ initialBalance: 100 });

    const income = await createCategory(app, token, { type: 'INCOME' });
    const expense = await createCategory(app, token, { type: 'EXPENSE' });

    await createTransaction(token, { categoryId: income.id, type: 'INCOME', amount: 250.5 });
    await createTransaction(token, { categoryId: expense.id, type: 'EXPENSE', amount: 80.25 });

    const accounts = await listAccounts(app, token);

    expect(balanceOf(accounts, accountId)).toBe(270.25);
  });

  it('não apaga conta com lançamento, mas deixa arquivar', async () => {
    const { token, accountId } = await registerUser(app);
    const category = await createCategory(app, token, { type: 'EXPENSE' });
    await createTransaction(token, { categoryId: category.id, type: 'EXPENSE', amount: 10 });

    const deleted = await request(app)
      .delete(`/accounts/${accountId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleted.status).toBe(409);

    const archived = await request(app)
      .patch(`/accounts/${accountId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ archived: true });

    expect(archived.status).toBe(200);

    const visible = await listAccounts(app, token);
    expect(visible.find((account) => account.id === accountId)).toBeUndefined();
  });

  it('não vaza a existência de conta de outro usuário', async () => {
    const owner = await registerUser(app);
    const stranger = await registerUser(app);

    const res = await request(app)
      .get(`/accounts/${owner.accountId}`)
      .set('Authorization', `Bearer ${stranger.token}`);

    expect(res.status).toBe(404);
  });
});

describe('Transferências (e2e)', () => {
  it('move o dinheiro entre as contas sem virar receita nem despesa', async () => {
    const { token, accountId } = await registerUser(app);
    const destination = await createAccount(app, token, { name: 'Reserva', kind: 'SAVINGS' });

    const income = await createCategory(app, token, { type: 'INCOME' });
    await createTransaction(token, { categoryId: income.id, type: 'INCOME', amount: 1000 });

    const before = await request(app)
      .get('/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);

    const transfer = await createTransfer(app, token, {
      fromAccountId: accountId,
      toAccountId: destination.id,
      amount: 100,
    });

    expect(transfer.status).toBe(201);

    const after = await request(app)
      .get('/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(after.body.totalIncome).toBe(before.body.totalIncome);
    expect(after.body.totalExpense).toBe(before.body.totalExpense);
    expect(after.body.balance).toBe(before.body.balance);

    const accounts = await listAccounts(app, token);
    expect(balanceOf(accounts, accountId)).toBe(900);
    expect(balanceOf(accounts, destination.id)).toBe(100);
  });

  it('recusa transferência para a mesma conta', async () => {
    const { token, accountId } = await registerUser(app);

    const res = await createTransfer(app, token, {
      fromAccountId: accountId,
      toAccountId: accountId,
      amount: 50,
    });

    expect(res.status).toBe(400);
  });

  it('recusa transferência com conta arquivada', async () => {
    const { token, accountId } = await registerUser(app);
    const destination = await createAccount(app, token, { name: 'Guardada', kind: 'SAVINGS' });

    await request(app)
      .patch(`/accounts/${destination.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ archived: true });

    const res = await createTransfer(app, token, {
      fromAccountId: accountId,
      toAccountId: destination.id,
      amount: 50,
    });

    expect(res.status).toBe(400);
  });

  it('bloqueia editar e apagar uma ponta pela rota de lançamento', async () => {
    const { token, accountId } = await registerUser(app);
    const destination = await createAccount(app, token, { name: 'Cofre', kind: 'SAVINGS' });

    const transfer = await createTransfer(app, token, {
      fromAccountId: accountId,
      toAccountId: destination.id,
      amount: 70,
    });

    const legId = transfer.body.from.id as string;

    const patched = await request(app)
      .patch(`/transactions/${legId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 5 });

    expect(patched.status).toBe(400);

    const deleted = await request(app)
      .delete(`/transactions/${legId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleted.status).toBe(400);
  });

  it('apaga as duas pontas de uma vez e devolve os saldos', async () => {
    const { token, accountId } = await registerUser(app);
    const destination = await createAccount(app, token, { name: 'Poupança', kind: 'SAVINGS' });

    const transfer = await createTransfer(app, token, {
      fromAccountId: accountId,
      toAccountId: destination.id,
      amount: 40,
    });

    const res = await request(app)
      .delete(`/accounts/transfers/${transfer.body.transferGroupId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);

    const accounts = await listAccounts(app, token);
    expect(balanceOf(accounts, accountId)).toBe(0);
    expect(balanceOf(accounts, destination.id)).toBe(0);
  });

  it('esconde a categoria de sistema da lista e recusa lançamento manual nela', async () => {
    const { token, accountId } = await registerUser(app);
    const destination = await createAccount(app, token, { name: 'Outra', kind: 'CHECKING' });

    await createTransfer(app, token, {
      fromAccountId: accountId,
      toAccountId: destination.id,
      amount: 30,
    });

    const listed = await request(app).get('/categories').set('Authorization', `Bearer ${token}`);
    expect(listed.body.some((category: { system: boolean }) => category.system)).toBe(false);

    const withSystem = await request(app)
      .get('/categories?includeSystem=true')
      .set('Authorization', `Bearer ${token}`);
    const system = withSystem.body.find(
      (category: { system: boolean; type: string }) =>
        category.system && category.type === 'EXPENSE',
    );

    const res = await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ categoryId: system.id, type: 'EXPENSE', amount: 10, date: PAST });

    expect(res.status).toBe(400);
  });
});
