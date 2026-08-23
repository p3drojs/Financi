import { deriveGoal, monthsBetween } from '../../../../src/modules/goals/goal.util';

const NOW = new Date('2026-08-23T00:00:00.000Z');
const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

describe('monthsBetween', () => {
  it('conta cerca de um mês para trinta dias', () => {
    expect(monthsBetween(day('2026-08-01'), day('2026-08-31'))).toBeCloseTo(0.99, 1);
  });

  it('devolve negativo quando a data já passou', () => {
    expect(monthsBetween(day('2026-08-23'), day('2026-07-23'))).toBeLessThan(0);
  });
});

describe('deriveGoal', () => {
  it('soma os aportes e calcula o que falta', () => {
    const derived = deriveGoal({
      targetAmount: 4200,
      targetDate: null,
      contributions: [
        { amount: 300, date: day('2026-06-05') },
        { amount: 250, date: day('2026-07-05') },
        { amount: 600, date: day('2026-08-05') },
      ],
      now: NOW,
    });

    expect(derived.saved.toString()).toBe('1150');
    expect(derived.remaining.toString()).toBe('3050');
    expect(derived.progress).toBeCloseTo(0.2738, 3);
  });

  it('devolve requiredMonthly null sem data-alvo, em vez de estourar', () => {
    const derived = deriveGoal({
      targetAmount: 1000,
      targetDate: null,
      contributions: [],
      now: NOW,
    });

    expect(derived.requiredMonthly).toBeNull();
    expect(derived.onTrack).toBeNull();
  });

  it('devolve requiredMonthly null quando a data-alvo já passou', () => {
    const derived = deriveGoal({
      targetAmount: 1000,
      targetDate: day('2026-01-01'),
      contributions: [],
      now: NOW,
    });

    expect(derived.requiredMonthly).toBeNull();
  });

  it('devolve pace null com menos de um mês de histórico', () => {
    const derived = deriveGoal({
      targetAmount: 1000,
      targetDate: null,
      contributions: [{ amount: 100, date: day('2026-08-20') }],
      now: NOW,
    });

    expect(derived.pace).toBeNull();
    expect(derived.projectedDate).toBeNull();
  });

  it('projeta a data pelo ritmo quando há histórico suficiente', () => {
    const derived = deriveGoal({
      targetAmount: 1000,
      targetDate: null,
      contributions: [
        { amount: 100, date: day('2026-05-23') },
        { amount: 100, date: day('2026-06-23') },
        { amount: 100, date: day('2026-07-23') },
      ],
      now: NOW,
    });

    expect(derived.pace).not.toBeNull();
    expect(derived.projectedDate).not.toBeNull();
    expect(derived.projectedDate!.getTime()).toBeGreaterThan(NOW.getTime());
  });

  it('não devolve progresso infinito quando o alvo é zero', () => {
    const derived = deriveGoal({
      targetAmount: 0,
      targetDate: null,
      contributions: [{ amount: 50, date: day('2026-01-01') }],
      now: NOW,
    });

    expect(derived.progress).toBeNull();
    expect(Number.isFinite(derived.progress as number)).toBe(false);
  });

  it('marca onTrack quando a meta já foi atingida', () => {
    const derived = deriveGoal({
      targetAmount: 100,
      targetDate: day('2027-01-01'),
      contributions: [{ amount: 120, date: day('2026-01-01') }],
      now: NOW,
    });

    expect(derived.remaining.toString()).toBe('0');
    expect(derived.onTrack).toBe(true);
  });
});
