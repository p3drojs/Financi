import { generateRefreshToken, hashRefreshToken } from '../../../src/utils/refreshToken';

describe('refresh token utils', () => {
  it('gera tokens diferentes a cada chamada', () => {
    const a = generateRefreshToken();
    const b = generateRefreshToken();
    expect(a).not.toBe(b);
  });

  it('gera um hash determinístico pro mesmo valor', () => {
    const raw = generateRefreshToken();
    expect(hashRefreshToken(raw)).toBe(hashRefreshToken(raw));
  });

  it('gera hashes diferentes pra valores diferentes', () => {
    const a = generateRefreshToken();
    const b = generateRefreshToken();
    expect(hashRefreshToken(a)).not.toBe(hashRefreshToken(b));
  });

  it('o hash não é igual ao valor original', () => {
    const raw = generateRefreshToken();
    expect(hashRefreshToken(raw)).not.toBe(raw);
  });
});
