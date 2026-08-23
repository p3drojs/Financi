import { Prisma, TransactionType } from '@prisma/client';

export interface AccountMovement {
  type: TransactionType;
  total: Prisma.Decimal.Value;
}

export function computeBalance(
  initialBalance: Prisma.Decimal.Value,
  movements: AccountMovement[],
): Prisma.Decimal {
  return movements.reduce((balance, movement) => {
    const amount = new Prisma.Decimal(movement.total);
    return movement.type === 'INCOME' ? balance.plus(amount) : balance.minus(amount);
  }, new Prisma.Decimal(initialBalance));
}
