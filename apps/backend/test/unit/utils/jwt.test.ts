import { signAccessToken, verifyAccessToken } from '../../../src/utils/jwt';

describe('jwt utils', () => {
  it('gera um token que, ao ser verificado, devolve o mesmo payload', () => {
    const token = signAccessToken({ sub: 'user-1', email: 'user@financi.dev' });
    const payload = verifyAccessToken(token);

    expect(payload.sub).toBe('user-1');
    expect(payload.email).toBe('user@financi.dev');
  });

  it('lança erro ao verificar um token inválido', () => {
    expect(() => verifyAccessToken('token-invalido')).toThrow();
  });
});
