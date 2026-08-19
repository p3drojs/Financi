import request from 'supertest';
import { createApp } from '../../src/app';
import { createCategory, registerUser } from './helpers';

const app = createApp();

describe('Tags (e2e)', () => {
  it('cria tags automaticamente ao usá-las numa transação e lista sem duplicar', async () => {
    const { token } = await registerUser(app);
    const category = await createCategory(app, token, { type: 'EXPENSE' });

    await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        categoryId: category.id,
        type: 'EXPENSE',
        amount: 10,
        date: new Date().toISOString(),
        tagNames: ['viagem', 'urgente'],
      });

    await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        categoryId: category.id,
        type: 'EXPENSE',
        amount: 20,
        date: new Date().toISOString(),
        tagNames: ['viagem'],
      });

    const res = await request(app).get('/tags').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it('bloqueia exclusão de tag em uso', async () => {
    const { token } = await registerUser(app);
    const category = await createCategory(app, token, { type: 'EXPENSE' });

    await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        categoryId: category.id,
        type: 'EXPENSE',
        amount: 10,
        date: new Date().toISOString(),
        tagNames: ['essencial'],
      });

    const tags = await request(app).get('/tags').set('Authorization', `Bearer ${token}`);
    const tagId = tags.body[0].id;

    const res = await request(app).delete(`/tags/${tagId}`).set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(409);
  });

  it('exclui tag não utilizada', async () => {
    const { token } = await registerUser(app);
    const category = await createCategory(app, token, { type: 'EXPENSE' });

    const created = await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        categoryId: category.id,
        type: 'EXPENSE',
        amount: 10,
        date: new Date().toISOString(),
        tagNames: ['temporaria'],
      });

    await request(app)
      .delete(`/transactions/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    const tags = await request(app).get('/tags').set('Authorization', `Bearer ${token}`);
    const tagId = tags.body[0].id;

    const res = await request(app).delete(`/tags/${tagId}`).set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
  });

  it('rejeita exclusão de tag de outro usuário', async () => {
    const userA = await registerUser(app);
    const userB = await registerUser(app);
    const category = await createCategory(app, userA.token, { type: 'EXPENSE' });

    await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({
        categoryId: category.id,
        type: 'EXPENSE',
        amount: 10,
        date: new Date().toISOString(),
        tagNames: ['privada'],
      });

    const tags = await request(app).get('/tags').set('Authorization', `Bearer ${userA.token}`);
    const tagId = tags.body[0].id;

    const res = await request(app)
      .delete(`/tags/${tagId}`)
      .set('Authorization', `Bearer ${userB.token}`);

    expect(res.status).toBe(404);
  });
});
