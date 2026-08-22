import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/config/prisma';
import { DEFAULT_ACCOUNT } from '../../src/modules/accounts/account.defaults';

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
      expect(res.body.refreshToken).toEqual(expect.any(String));
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

    it('cria exatamente uma conta padrão para o usuário novo', async () => {
      const res = await request(app).post('/auth/register').send({
        email: 'comconta@financi.dev',
        password: 'senha12345',
      });

      const accounts = await prisma.account.findMany({ where: { userId: res.body.user.id } });

      expect(accounts).toHaveLength(1);
      expect(accounts[0]?.name).toBe(DEFAULT_ACCOUNT.name);
      expect(accounts[0]?.kind).toBe(DEFAULT_ACCOUNT.kind);
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

  describe('GET /auth/me', () => {
    it('retorna o usuário autenticado', async () => {
      const register = await request(app).post('/auth/register').send({
        email: 'me@financi.dev',
        password: 'senha12345',
        name: 'Usuário Me',
      });

      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${register.body.token}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe('me@financi.dev');
      expect(res.body.name).toBe('Usuário Me');
    });

    it('rejeita sem token', async () => {
      const res = await request(app).get('/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /auth/refresh', () => {
    it('gera um par novo de tokens e invalida o refresh usado', async () => {
      const register = await request(app).post('/auth/register').send({
        email: 'refresh@financi.dev',
        password: 'senha12345',
      });

      const res = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: register.body.refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.token).toEqual(expect.any(String));
      expect(res.body.refreshToken).not.toBe(register.body.refreshToken);

      const reused = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: register.body.refreshToken });

      expect(reused.status).toBe(401);
    });

    it('rejeita refresh token inválido', async () => {
      const res = await request(app).post('/auth/refresh').send({ refreshToken: 'invalido' });
      expect(res.status).toBe(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('revoga o refresh token', async () => {
      const register = await request(app).post('/auth/register').send({
        email: 'logout@financi.dev',
        password: 'senha12345',
      });

      const logout = await request(app)
        .post('/auth/logout')
        .send({ refreshToken: register.body.refreshToken });

      expect(logout.status).toBe(204);

      const refresh = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: register.body.refreshToken });

      expect(refresh.status).toBe(401);
    });

    it('não quebra ao deslogar com token desconhecido', async () => {
      const res = await request(app).post('/auth/logout').send({ refreshToken: 'desconhecido' });
      expect(res.status).toBe(204);
    });
  });
});
