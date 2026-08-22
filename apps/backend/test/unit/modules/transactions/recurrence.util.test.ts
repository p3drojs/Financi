import {
  addMonths,
  generateRecurrenceDates,
  pendingRecurrenceDates,
} from '../../../../src/modules/transactions/recurrence.util';

describe('addMonths', () => {
  it('soma meses normalmente', () => {
    expect(addMonths(new Date(2026, 0, 15), 2)).toEqual(new Date(2026, 2, 15));
  });

  it('vira o ano quando ultrapassa dezembro', () => {
    expect(addMonths(new Date(2026, 10, 10), 3)).toEqual(new Date(2027, 1, 10));
  });

  it('faz clamp no fim do mês (31 jan + 1 mês = 28/29 fev)', () => {
    expect(addMonths(new Date(2026, 0, 31), 1)).toEqual(new Date(2026, 1, 28));
  });

  it('faz clamp em ano bissexto (31 jan + 1 mês = 29 fev)', () => {
    expect(addMonths(new Date(2028, 0, 31), 1)).toEqual(new Date(2028, 1, 29));
  });

  it('aceita meses negativos', () => {
    expect(addMonths(new Date(2026, 2, 15), -2)).toEqual(new Date(2026, 0, 15));
  });
});

describe('generateRecurrenceDates', () => {
  const now = new Date(2026, 0, 1);

  it('gera ocorrências respeitando o intervalo em meses', () => {
    const dates = generateRecurrenceDates({
      startDate: new Date(2026, 0, 10),
      intervalMonths: 3,
      now,
      windowMonthsAhead: 12,
    });

    expect(dates).toEqual([
      new Date(2026, 0, 10),
      new Date(2026, 3, 10),
      new Date(2026, 6, 10),
      new Date(2026, 9, 10),
    ]);
  });

  it('para no endDate mesmo com janela maior', () => {
    const dates = generateRecurrenceDates({
      startDate: new Date(2026, 0, 10),
      intervalMonths: 1,
      endDate: new Date(2026, 2, 20),
      now,
      windowMonthsAhead: 12,
    });

    expect(dates).toEqual([new Date(2026, 0, 10), new Date(2026, 1, 10), new Date(2026, 2, 10)]);
  });

  it('para no número de ocorrências mesmo sem endDate', () => {
    const dates = generateRecurrenceDates({
      startDate: new Date(2026, 0, 10),
      intervalMonths: 1,
      occurrences: 2,
      now,
      windowMonthsAhead: 12,
    });

    expect(dates).toHaveLength(2);
  });

  it('nunca gera além da janela de lote, mesmo sem limite', () => {
    const dates = generateRecurrenceDates({
      startDate: new Date(2020, 0, 1),
      intervalMonths: 1,
      now,
      windowMonthsAhead: 3,
    });

    expect(dates.every((d) => d <= addMonths(now, 3))).toBe(true);
  });

  it('lança erro para intervalMonths menor que 1', () => {
    expect(() => generateRecurrenceDates({ startDate: now, intervalMonths: 0, now })).toThrow(
      'intervalMonths deve ser >= 1',
    );
  });
});

describe('pendingRecurrenceDates', () => {
  const now = new Date(2027, 0, 1);

  it('gera só o que falta depois da última ocorrência já criada', () => {
    const dates = pendingRecurrenceDates({
      startDate: new Date(2026, 0, 10),
      intervalMonths: 1,
      now,
      windowMonthsAhead: 3,
      generatedThrough: new Date(2026, 11, 10),
    });

    expect(dates).toEqual([new Date(2027, 0, 10), new Date(2027, 1, 10), new Date(2027, 2, 10)]);
  });

  it('não gera nada quando o lote já cobre a janela inteira', () => {
    const dates = pendingRecurrenceDates({
      startDate: new Date(2026, 0, 10),
      intervalMonths: 1,
      now,
      windowMonthsAhead: 3,
      generatedThrough: new Date(2027, 3, 10),
    });

    expect(dates).toEqual([]);
  });

  it('respeita o limite de ocorrências ao estender', () => {
    const dates = pendingRecurrenceDates({
      startDate: new Date(2026, 0, 10),
      intervalMonths: 1,
      occurrences: 14,
      now,
      windowMonthsAhead: 12,
      generatedThrough: new Date(2026, 11, 10),
    });

    expect(dates).toEqual([new Date(2027, 0, 10), new Date(2027, 1, 10)]);
  });

  it('sem ocorrência anterior, não recria histórico passado', () => {
    const dates = pendingRecurrenceDates({
      startDate: new Date(2026, 0, 10),
      intervalMonths: 6,
      now,
      windowMonthsAhead: 12,
      generatedThrough: null,
    });

    expect(dates.every((date) => date > now)).toBe(true);
  });
});
