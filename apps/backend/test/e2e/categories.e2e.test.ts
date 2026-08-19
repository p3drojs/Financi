import request from 'supertest';
import { createApp } from '../../src/app';
import { createCategory, registerUser } from './helpers';

const app = createApp();

describe('Categories (e2e)', () => {
  it('cria uma categoria', async () => {
    const { token } = await registerUser(app);

    const res = await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Alimentação', type: 'EXPENSE', color: '#FF0000' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Alimentação');
  });

  it('rejeita categoria duplicada (mesmo nome + tipo)', async () => {
    const { token } = await registerUser(app);

    await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Salário', type: 'INCOME' });

    const res = await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Salário', type: 'INCOME' });

    expect(res.status).toBe(409);
  });

  it('rejeita requisição sem token', async () => {
    const res = await request(app).post('/categories').send({ name: 'Sem Token', type: 'EXPENSE' });

    expect(res.status).toBe(401);
  });

  it('lista só as categorias do próprio usuário', async () => {
    const userA = await registerUser(app);
    const userB = await registerUser(app);

    await createCategory(app, userA.token, { name: 'Do usuário A' });
    await createCategory(app, userB.token, { name: 'Do usuário B' });

    const res = await request(app).get('/categories').set('Authorization', `Bearer ${userA.token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Do usuário A');
  });

  it('atualiza nome e cor', async () => {
    const { token } = await registerUser(app);
    const category = await createCategory(app, token, { name: 'Original' });

    const res = await request(app)
      .patch(`/categories/${category.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Renomeada' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Renomeada');
  });

  it('bloqueia exclusão de categoria em uso por transação', async () => {
    const { token } = await registerUser(app);
    const category = await createCategory(app, token, { type: 'EXPENSE' });

    await request(app).post('/transactions').set('Authorization', `Bearer ${token}`).send({
      categoryId: category.id,
      type: 'EXPENSE',
      amount: 50,
      date: new Date().toISOString(),
    });

    const res = await request(app)
      .delete(`/categories/${category.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(409);
  });

  it('permite excluir categoria não utilizada', async () => {
    const { token } = await registerUser(app);
    const category = await createCategory(app, token);

    const res = await request(app)
      .delete(`/categories/${category.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
  });
});
