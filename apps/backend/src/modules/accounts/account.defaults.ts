import { AccountKind } from '@prisma/client';

interface DefaultAccount {
  name: string;
  kind: AccountKind;
}

export const DEFAULT_ACCOUNT: DefaultAccount = { name: 'Carteira', kind: 'CASH' };
