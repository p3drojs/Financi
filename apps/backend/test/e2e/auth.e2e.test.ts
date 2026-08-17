import request from 'supertest';
import { createApp } from '../../src/app';

const app = createApp();

describe('Auth (e2e)', () => {
  describe('POST /auth/register', () => {
    it('cria um usuário novo e retorna um token', async () => {
      const res = await request(app).post('/auth/register').send({
        email: 'teste@financi.dev',
        password: 'senha12345',
        name: 'Usuário Teste',
      });

      expect(res.status).toBe(201);
      expect(res.body.user.email).toBe('teste@financi.dev');
      expect(res.body.token).toEqual(expect.any(String));
    });

    it('rejeita registro duplicado com o mesmo email', async () => {
      await request(app).post('/auth/register').send({
        email: 'duplicado@financi.dev',
        password: 'senha12345',
      });

      const res = await request(app).post('/auth/register').send({
        email: 'duplicado@financi.dev',
        password: 'outrasenha123',
      });

      expect(res.status).toBe(409);
    });

    it('rejeita senha curta demais', async () => {
      const res = await request(app).post('/auth/register').send({
        email: 'senhacurta@financi.dev',
        password: '123',
      });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    it('autentica com credenciais válidas', async () => {
      await request(app).post('/auth/register').send({
        email: 'login@financi.dev',
        password: 'senha12345',
      });

      const res = await request(app).post('/auth/login').send({
        email: 'login@financi.dev',
        password: 'senha12345',
      });

      expect(res.status).toBe(200);
      expect(res.body.token).toEqual(expect.any(String));
    });

    it('rejeita senha incorreta', async () => {
      await request(app).post('/auth/register').send({
        email: 'senhaerrada@financi.dev',
        password: 'senhacorreta123',
      });

      const res = await request(app).post('/auth/login').send({
        email: 'senhaerrada@financi.dev',
        password: 'senhaerrada123',
      });

      expect(res.status).toBe(401);
    });

    it('rejeita login de email inexistente', async () => {
      const res = await request(app).post('/auth/login').send({
        email: 'naoexiste@financi.dev',
        password: 'qualquercoisa123',
      });

      expect(res.status).toBe(401);
    });
  });
});
