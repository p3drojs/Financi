import {
  isDue,
  resolvePaid,
  startOfUtcDay,
} from '../../../../src/modules/transactions/transaction.util';

const NOW = new Date('2026-08-23T15:00:00.000Z');

describe('startOfUtcDay', () => {
  it('zera a hora sem escorregar de dia pelo fuso local', () => {
    expect(startOfUtcDay(new Date('2026-08-23T23:45:00.000Z')).toISOString()).toBe(
      '2026-08-23T00:00:00.000Z',
    );
  });
});

describe('isDue', () => {
  it('conta o próprio dia como vencido', () => {
    expect(isDue(new Date('2026-08-23T00:00:00.000Z'), NOW)).toBe(true);
  });

  it('conta ontem como vencido', () => {
    expect(isDue(new Date('2026-08-22T00:00:00.000Z'), NOW)).toBe(true);
  });

  it('não conta amanhã como vencido', () => {
    expect(isDue(new Date('2026-08-24T00:00:00.000Z'), NOW)).toBe(false);
  });

  it('não vira pendente por um lançamento feito no fim do dia', () => {
    const lateInTheDay = new Date('2026-08-23T23:59:00.000Z');
    expect(isDue(new Date('2026-08-23T00:00:00.000Z'), lateInTheDay)).toBe(true);
  });
});

describe('resolvePaid', () => {
  it('nasce pago quando a data já chegou', () => {
    const state = resolvePaid(new Date('2026-08-23T00:00:00.000Z'), undefined, NOW);
    expect(state.paid).toBe(true);
    expect(state.paidAt).toEqual(NOW);
  });

  it('nasce pendente quando a data é futura', () => {
    const state = resolvePaid(new Date('2026-09-05T00:00:00.000Z'), undefined, NOW);
    expect(state.paid).toBe(false);
    expect(state.paidAt).toBeNull();
  });

  it('respeita o valor explícito acima da data', () => {
    const state = resolvePaid(new Date('2026-08-01T00:00:00.000Z'), false, NOW);
    expect(state.paid).toBe(false);
    expect(state.paidAt).toBeNull();
  });
});
