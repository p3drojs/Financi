import { Prisma } from '@prisma/client';
import {
  generateInstallmentDates,
  splitInstallments,
  summarizeInstallments,
} from '../../../../src/modules/transactions/installment.util';

describe('splitInstallments', () => {
  it('divide igualmente quando o total é exato', () => {
    const amounts = splitInstallments('300.00', 3);
    expect(amounts.map((a) => a.toString())).toEqual(['100', '100', '100']);
  });

  it('joga o resto de centavos pra última parcela', () => {
    const amounts = splitInstallments('100.00', 3);
    expect(amounts.map((a) => a.toString())).toEqual(['33.33', '33.33', '33.34']);
    const total = amounts.reduce((acc, a) => acc.plus(a), new Prisma.Decimal(0));
    expect(total.toString()).toBe('100');
  });

  it('lança erro para count menor que 1', () => {
    expect(() => splitInstallments('100', 0)).toThrow('installmentTotal deve ser >= 1');
  });
});

describe('generateInstallmentDates', () => {
  it('gera uma data por mês, incluindo a inicial', () => {
    const dates = generateInstallmentDates(new Date(2026, 0, 15), 3);
    expect(dates).toEqual([new Date(2026, 0, 15), new Date(2026, 1, 15), new Date(2026, 2, 15)]);
  });

  it('nunca é limitado pela janela de recorrência (parcelamento é total fixo)', () => {
    const dates = generateInstallmentDates(new Date(2026, 0, 15), 24);
    expect(dates).toHaveLength(24);
  });

  it('lança erro para count menor que 1', () => {
    expect(() => generateInstallmentDates(new Date(), 0)).toThrow('installmentTotal deve ser >= 1');
  });
});

describe('summarizeInstallments', () => {
  it('conta como pagas as parcelas marcadas como pagas, não as de data vencida', () => {
    const summary = summarizeInstallments([
      { amount: '100.00', paid: true },
      { amount: '100.00', paid: true },
      { amount: '100.00', paid: true },
      { amount: '100.00', paid: false },
    ]);

    expect(summary.installmentsGenerated).toBe(4);
    expect(summary.paidCount).toBe(3);
    expect(summary.remainingCount).toBe(1);
    expect(summary.totalAmount.toString()).toBe('400');
    expect(summary.paidAmount.toString()).toBe('300');
    expect(summary.remainingAmount.toString()).toBe('100');
  });

  it('não conta parcela vencida que ainda não foi paga', () => {
    const summary = summarizeInstallments([
      { amount: '100.00', paid: false },
      { amount: '100.00', paid: false },
    ]);

    expect(summary.paidCount).toBe(0);
    expect(summary.remainingAmount.toString()).toBe('200');
  });

  it('soma o resto que ficou na última parcela', () => {
    const amounts = splitInstallments('100.00', 3);
    const summary = summarizeInstallments(amounts.map((amount) => ({ amount, paid: true })));

    expect(summary.totalAmount.toString()).toBe('100');
    expect(summary.paidCount).toBe(3);
    expect(summary.remainingAmount.toString()).toBe('0');
  });

  it('trata grupo sem nenhuma parcela paga', () => {
    const summary = summarizeInstallments([{ amount: new Prisma.Decimal('50.00'), paid: false }]);

    expect(summary.paidCount).toBe(0);
    expect(summary.paidAmount.toString()).toBe('0');
    expect(summary.remainingAmount.toString()).toBe('50');
  });
});
