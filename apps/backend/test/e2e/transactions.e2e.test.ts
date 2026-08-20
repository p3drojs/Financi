import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/config/prisma';
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

  it('lista as recorrências do usuário com contagem de ocorrências', async () => {
    const { token } = await registerUser(app);
    const category = await createCategory(app, token, { type: 'EXPENSE' });

    const created = await request(app)
      .post('/transactions/recurring')
      .set('Authorization', `Bearer ${token}`)
      .send({
        categoryId: category.id,
        type: 'EXPENSE',
        amount: 19.9,
        description: 'Academia',
        startDate: new Date().toISOString(),
        intervalMonths: 1,
      });

    const res = await request(app)
      .get('/transactions/recurring')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(created.body.recurrence.id);
    expect(res.body[0].category.id).toBe(category.id);
    expect(res.body[0].generatedCount).toBe(created.body.transactions.length);
    expect(res.body[0].nextOccurrenceDate).not.toBeNull();
  });

  it('filtra recorrências por status na listagem', async () => {
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

    await request(app)
      .delete(`/transactions/recurring/${created.body.recurrence.id}`)
      .set('Authorization', `Bearer ${token}`);

    const ativas = await request(app)
      .get('/transactions/recurring?active=true')
      .set('Authorization', `Bearer ${token}`);
    const canceladas = await request(app)
      .get('/transactions/recurring?active=false')
      .set('Authorization', `Bearer ${token}`);

    expect(ativas.body).toHaveLength(0);
    expect(canceladas.body).toHaveLength(1);
  });

  it('reabastece o lote de ocorrências de uma recorrência ativa na leitura', async () => {
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
        tagNames: ['assinatura'],
      });

    const recurrenceId = created.body.recurrence.id;
    const geradas = created.body.transactions.length;

    await prisma.transaction.deleteMany({
      where: { recurrenceId, date: { gt: new Date() } },
    });

    const list = await request(app)
      .get('/transactions?pageSize=200')
      .set('Authorization', `Bearer ${token}`);

    const ocorrencias = list.body.items.filter(
      (t: { recurrenceId: string | null }) => t.recurrenceId === recurrenceId,
    );

    expect(ocorrencias).toHaveLength(geradas);
    expect(
      ocorrencias.every((t: { tags: unknown[] }) => t.tags.length === 1),
    ).toBe(true);
  });

  it('não reabastece o lote de uma recorrência cancelada', async () => {
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

    await request(app)
      .delete(`/transactions/recurring/${recurrenceId}`)
      .set('Authorization', `Bearer ${token}`);

    const list = await request(app)
      .get('/transactions?pageSize=200')
      .set('Authorization', `Bearer ${token}`);

    const ocorrencias = list.body.items.filter(
      (t: { recurrenceId: string | null }) => t.recurrenceId === recurrenceId,
    );

    expect(ocorrencias.length).toBeLessThanOrEqual(1);
  });

  it('edita o template da recorrência aplicando só nas ocorrências futuras', async () => {
    const { token } = await registerUser(app);
    const category = await createCategory(app, token, { type: 'EXPENSE' });

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 2);

    const created = await request(app)
      .post('/transactions/recurring')
      .set('Authorization', `Bearer ${token}`)
      .send({
        categoryId: category.id,
        type: 'EXPENSE',
        amount: 50,
        description: 'Internet',
        startDate: startDate.toISOString(),
        intervalMonths: 1,
      });

    const recurrenceId = created.body.recurrence.id;
    const passada = created.body.transactions[0];

    const res = await request(app)
      .patch(`/transactions/recurring/${recurrenceId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 79.9, description: 'Internet 600MB' });

    expect(res.status).toBe(200);
    expect(res.body.recurrence.amount).toBe('79.9');
    expect(res.body.transactions.every((t: { amount: string }) => t.amount === '79.9')).toBe(true);

    const antiga = await request(app)
      .get(`/transactions/${passada.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(antiga.body.amount).toBe('50');
    expect(antiga.body.description).toBe('Internet');
  });

  it('regera as ocorrências futuras quando o cronograma muda', async () => {
    const { token } = await registerUser(app);
    const category = await createCategory(app, token, { type: 'EXPENSE' });

    const created = await request(app)
      .post('/transactions/recurring')
      .set('Authorization', `Bearer ${token}`)
      .send({
        categoryId: category.id,
        type: 'EXPENSE',
        amount: 20,
        startDate: new Date().toISOString(),
        intervalMonths: 1,
      });

    const recurrenceId = created.body.recurrence.id;

    const res = await request(app)
      .patch(`/transactions/recurring/${recurrenceId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ intervalMonths: 6 });

    expect(res.status).toBe(200);
    expect(res.body.recurrence.intervalMonths).toBe(6);
    expect(res.body.transactions.length).toBeLessThan(created.body.transactions.length);
    expect(res.body.transactions.every((t: { date: string }) => new Date(t.date) > new Date())).toBe(
      true,
    );
  });

  it('rejeita edição de recorrência cancelada', async () => {
    const { token } = await registerUser(app);
    const category = await createCategory(app, token, { type: 'EXPENSE' });

    const created = await request(app)
      .post('/transactions/recurring')
      .set('Authorization', `Bearer ${token}`)
      .send({
        categoryId: category.id,
        type: 'EXPENSE',
        amount: 20,
        startDate: new Date().toISOString(),
        intervalMonths: 1,
      });

    await request(app)
      .delete(`/transactions/recurring/${created.body.recurrence.id}`)
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .patch(`/transactions/recurring/${created.body.recurrence.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 30 });

    expect(res.status).toBe(409);
  });

  it('mostra o grupo de parcelamento com quantas já venceram', async () => {
    const { token } = await registerUser(app);
    const category = await createCategory(app, token, { type: 'EXPENSE' });

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);

    const created = await request(app)
      .post('/transactions/installments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        categoryId: category.id,
        type: 'EXPENSE',
        amount: 100,
        description: 'Notebook',
        startDate: startDate.toISOString(),
        installmentTotal: 5,
      });

    const groupId = created.body[0].installmentGroupId;

    const res = await request(app)
      .get(`/transactions/installments/${groupId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.installmentGroupId).toBe(groupId);
    expect(res.body.installmentTotal).toBe(5);
    expect(res.body.paidCount).toBe(2);
    expect(res.body.remainingCount).toBe(3);
    expect(Number(res.body.totalAmount)).toBeCloseTo(100);
    expect(res.body.transactions).toHaveLength(5);
    expect(res.body.category.id).toBe(category.id);
  });

  it('retorna 404 para grupo de parcelamento inexistente', async () => {
    const { token } = await registerUser(app);

    const res = await request(app)
      .get('/transactions/installments/3f1b6a9c-2f3a-4c1e-9a7b-0d5e6f7a8b9c')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('não expõe o parcelamento de outro usuário', async () => {
    const dono = await registerUser(app);
    const intruso = await registerUser(app);
    const category = await createCategory(app, dono.token, { type: 'EXPENSE' });

    const created = await request(app)
      .post('/transactions/installments')
      .set('Authorization', `Bearer ${dono.token}`)
      .send({
        categoryId: category.id,
        type: 'EXPENSE',
        amount: 60,
        startDate: new Date().toISOString(),
        installmentTotal: 3,
      });

    const res = await request(app)
      .get(`/transactions/installments/${created.body[0].installmentGroupId}`)
      .set('Authorization', `Bearer ${intruso.token}`);

    expect(res.status).toBe(404);
  });
});
