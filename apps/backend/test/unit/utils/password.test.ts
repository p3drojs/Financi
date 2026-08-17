import { comparePassword, hashPassword } from '../../../src/utils/password';

describe('password utils', () => {
  it('gera um hash diferente do texto original', async () => {
    const hash = await hashPassword('minhasenha123');
    expect(hash).not.toBe('minhasenha123');
  });

  it('valida corretamente quando a senha está certa', async () => {
    const hash = await hashPassword('minhasenha123');
    await expect(comparePassword('minhasenha123', hash)).resolves.toBe(true);
  });

  it('rejeita quando a senha está errada', async () => {
    const hash = await hashPassword('minhasenha123');
    await expect(comparePassword('outrasenha', hash)).resolves.toBe(false);
  });
});
