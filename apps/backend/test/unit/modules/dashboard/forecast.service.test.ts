import { Prisma } from '@prisma/client';
import {
  buildDailySeries,
  lowestPointOf,
} from '../../../../src/modules/dashboard/forecast.service';

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

describe('buildDailySeries', () => {
  it('devolve um ponto por dia, inclusive as pontas', () => {
    const series = buildDailySeries(
      day('2026-08-22'),
      day('2026-08-25'),
      new Prisma.Decimal(100),
      [],
    );

    expect(series.map((point) => point.date)).toEqual([
      '2026-08-22',
      '2026-08-23',
      '2026-08-24',
      '2026-08-25',
    ]);
    expect(series.every((point) => point.balance.equals(100))).toBe(true);
  });

  it('acumula o saldo dia a dia', () => {
    const series = buildDailySeries(day('2026-08-22'), day('2026-08-24'), new Prisma.Decimal(500), [
      { date: day('2026-08-23'), type: 'EXPENSE', amount: new Prisma.Decimal(200) },
      { date: day('2026-08-24'), type: 'INCOME', amount: new Prisma.Decimal(50) },
    ]);

    expect(series.map((point) => point.balance.toString())).toEqual(['500', '300', '350']);
  });

  it('soma mais de um movimento no mesmo dia', () => {
    const series = buildDailySeries(day('2026-08-22'), day('2026-08-22'), new Prisma.Decimal(0), [
      { date: day('2026-08-22'), type: 'EXPENSE', amount: new Prisma.Decimal(30) },
      { date: day('2026-08-22'), type: 'EXPENSE', amount: new Prisma.Decimal(20) },
    ]);

    expect(series[0]?.balance.toString()).toBe('-50');
  });
});

describe('lowestPointOf', () => {
  it('acha o vale no meio da série, não a última ponta', () => {
    const series = buildDailySeries(
      day('2026-08-22'),
      day('2026-08-25'),
      new Prisma.Decimal(1000),
      [
        { date: day('2026-08-23'), type: 'EXPENSE', amount: new Prisma.Decimal(900) },
        { date: day('2026-08-25'), type: 'INCOME', amount: new Prisma.Decimal(400) },
      ],
    );

    const lowest = lowestPointOf(series);

    expect(lowest?.date).toBe('2026-08-23');
    expect(lowest?.balance.toString()).toBe('100');
  });

  it('no empate fica com a data mais cedo', () => {
    const series = buildDailySeries(day('2026-08-22'), day('2026-08-24'), new Prisma.Decimal(10), [
      { date: day('2026-08-23'), type: 'EXPENSE', amount: new Prisma.Decimal(10) },
      { date: day('2026-08-24'), type: 'EXPENSE', amount: new Prisma.Decimal(0) },
    ]);

    expect(lowestPointOf(series)?.date).toBe('2026-08-23');
  });

  it('devolve null para série vazia', () => {
    expect(lowestPointOf([])).toBeNull();
  });
});
