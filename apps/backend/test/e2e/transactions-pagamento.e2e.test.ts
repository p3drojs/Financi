import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/config/prisma';
import { createCategory, registerUser } from './helpers';

const app = createApp();

function daysFromNow(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(0, 0, 0, 0);
  return date.toISOString();
}

describe('Pago / não pago (e2e)', () => {
  it('nasce pago quando a data já chegou e pendente quando é futura', async () => {
    const { token } = await registerUser(app);
    const category = await createCategory(app, token, { type: 'EXPENSE' });

    const today = await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ categoryId: category.id, type: 'EXPENSE', amount: 10, date: daysFromNow(0) });

    const future = await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ categoryId: category.id, type: 'EXPENSE', amount: 10, date: daysFromNow(5) });

    expect(today.body.paid).toBe(true);
    expect(today.body.paidAt).not.toBeNull();
    expect(future.body.paid).toBe(false);
    expect(future.body.paidAt).toBeNull();
  });

  it('separa vencido de a vencer em upcoming', async () => {
    const { token } = await registerUser(app);
    const category = await createCategory(app, token, { type: 'EXPENSE' });

    await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        categoryId: category.id,
        type: 'EXPENSE',
        amount: 120,
        date: daysFromNow(-5),
        paid: false,
      });

    await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ categoryId: category.id, type: 'EXPENSE', amount: 80, date: daysFromNow(3) });

    await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ categoryId: category.id, type: 'EXPENSE', amount: 999, date: daysFromNow(40) });

    const res = await request(app)
      .get('/transactions/upcoming')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.overdue.items).toHaveLength(1);
    expect(Number(res.body.overdue.total)).toBe(120);
    expect(res.body.upcoming.items).toHaveLength(1);
    expect(Number(res.body.upcoming.total)).toBe(80);
  });

  it('paga em lote e ignora id de outro usuário sem vazar existência', async () => {
    const { token } = await registerUser(app);
    const stranger = await registerUser(app);
    const category = await createCategory(app, token, { type: 'EXPENSE' });
    const strangerCategory = await createCategory(app, stranger.token, { type: 'EXPENSE' });

    const mine = await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ categoryId: category.id, type: 'EXPENSE', amount: 50, date: daysFromNow(4) });

    const theirs = await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${stranger.token}`)
      .send({
        categoryId: strangerCategory.id,
        type: 'EXPENSE',
        amount: 50,
        date: daysFromNow(4),
      });

    const res = await request(app)
      .post('/transactions/pay')
      .set('Authorization', `Bearer ${token}`)
      .send({ ids: [mine.body.id, theirs.body.id] });

    expect(res.status).toBe(200);
    expect(res.body.updated).toBe(1);

    const untouched = await prisma.transaction.findUniqueOrThrow({
      where: { id: theirs.body.id },
    });
    expect(untouched.paid).toBe(false);
  });

  it('conta a parcela como paga pelo flag, não pela data', async () => {
    const { token } = await registerUser(app);
    const category = await createCategory(app, token, { type: 'EXPENSE' });

    const created = await request(app)
      .post('/transactions/installments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        categoryId: category.id,
        type: 'EXPENSE',
        amount: 300,
        installmentTotal: 3,
        startDate: daysFromNow(10),
      });

    const groupId = created.body[0].installmentGroupId as string;

    const before = await request(app)
      .get(`/transactions/installments/${groupId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(before.body.paidCount).toBe(0);

    await request(app)
      .post('/transactions/pay')
      .set('Authorization', `Bearer ${token}`)
      .send({ ids: [created.body[0].id] });

    const after = await request(app)
      .get(`/transactions/installments/${groupId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(after.body.paidCount).toBe(1);
    expect(after.body.remainingCount).toBe(2);
  });

  it('desmarca o pagamento e limpa o paidAt', async () => {
    const { token } = await registerUser(app);
    const category = await createCategory(app, token, { type: 'EXPENSE' });

    const created = await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ categoryId: category.id, type: 'EXPENSE', amount: 25, date: daysFromNow(0) });

    const res = await request(app)
      .patch(`/transactions/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ paid: false });

    expect(res.status).toBe(200);
    expect(res.body.paid).toBe(false);
    expect(res.body.paidAt).toBeNull();
  });

  it('não deixa o filtro por conta ver lançamento de outra conta', async () => {
    const { token, accountId } = await registerUser(app);
    const other = await request(app)
      .post('/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Segunda', kind: 'CHECKING' });

    const category = await createCategory(app, token, { type: 'EXPENSE' });
    await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ categoryId: category.id, type: 'EXPENSE', amount: 15, date: daysFromNow(-1) });

    const mine = await request(app)
      .get(`/transactions?accountId=${accountId}`)
      .set('Authorization', `Bearer ${token}`);

    const empty = await request(app)
      .get(`/transactions?accountId=${other.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(mine.body.total).toBe(1);
    expect(empty.body.total).toBe(0);
  });
});
