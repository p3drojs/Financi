import {
  budgetPercent,
  budgetStatus,
  monthEnd,
  monthKey,
  monthStart,
} from '../../../../src/modules/budgets/budget.util';

describe('monthStart', () => {
  it('ancora no primeiro dia do mês em UTC, não no fuso local', () => {
    expect(monthStart('2026-08').toISOString()).toBe('2026-08-01T00:00:00.000Z');
  });

  it('não escorrega para o mês anterior em janeiro', () => {
    expect(monthStart('2026-01').toISOString()).toBe('2026-01-01T00:00:00.000Z');
  });
});

describe('monthEnd', () => {
  it('devolve o primeiro instante do mês seguinte', () => {
    expect(monthEnd('2026-08').toISOString()).toBe('2026-09-01T00:00:00.000Z');
  });

  it('vira o ano em dezembro', () => {
    expect(monthEnd('2026-12').toISOString()).toBe('2027-01-01T00:00:00.000Z');
  });
});

describe('monthKey', () => {
  it('formata com zero à esquerda', () => {
    expect(monthKey(new Date('2026-03-15T00:00:00.000Z'))).toBe('2026-03');
  });
});

describe('budgetPercent', () => {
  it('arredonda para uma casa', () => {
    expect(budgetPercent(900, 780.9)).toBe(86.8);
  });

  it('devolve zero quando o teto é zero, em vez de infinito', () => {
    expect(budgetPercent(0, 100)).toBe(0);
  });
});

describe('budgetStatus', () => {
  it('fica OK abaixo de 80%', () => {
    expect(budgetStatus(1000, 799.99)).toBe('OK');
  });

  it('vira WARNING a partir de 80%', () => {
    expect(budgetStatus(1000, 800)).toBe('WARNING');
  });

  it('vira OVER a partir de 100%', () => {
    expect(budgetStatus(1000, 1000)).toBe('OVER');
  });

  it('continua OVER quando estoura', () => {
    expect(budgetStatus(400, 518)).toBe('OVER');
  });
});
