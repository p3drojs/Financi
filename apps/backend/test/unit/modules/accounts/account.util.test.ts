import { Prisma } from '@prisma/client';
import { computeBalance } from '../../../../src/modules/accounts/account.util';

describe('computeBalance', () => {
  it('devolve o saldo inicial quando não há movimento', () => {
    expect(computeBalance(150.25, []).toString()).toBe('150.25');
  });

  it('soma entradas e subtrai saídas', () => {
    const balance = computeBalance(100, [
      { type: 'INCOME', total: 250.5 },
      { type: 'EXPENSE', total: 80.25 },
    ]);

    expect(balance.toString()).toBe('270.25');
  });

  it('aceita saldo negativo, que é como o cartão de crédito vive', () => {
    const balance = computeBalance(0, [{ type: 'EXPENSE', total: 811.5 }]);

    expect(balance.toString()).toBe('-811.5');
  });

  it('não perde centavo somando decimais que quebram em ponto flutuante', () => {
    const balance = computeBalance(0, [
      { type: 'INCOME', total: new Prisma.Decimal('0.1') },
      { type: 'INCOME', total: new Prisma.Decimal('0.2') },
    ]);

    expect(balance.toString()).toBe('0.3');
  });
});
