import { prisma } from '../src/config/prisma';
import { SEED_USER, resetSeedUser, runSeed } from './seed.shared';

runSeed(async () => {
  const user = await resetSeedUser();
  const categories = await prisma.category.count({ where: { userId: user.id } });

  console.log(`Usuario ${SEED_USER.email} pronto (senha: ${SEED_USER.password})`);
  console.log(`${categories} categorias padrao, nenhum lancamento`);
});
