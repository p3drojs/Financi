import { z } from 'zod';

const accountKind = z.enum(['CHECKING', 'SAVINGS', 'CASH', 'CREDIT_CARD', 'INVESTMENT']);

export const createAccountSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(60),
    kind: accountKind,
    color: z.string().max(20).optional(),
    initialBalance: z.number().optional(),
  }),
});

export const updateAccountSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(60).optional(),
    color: z.string().max(20).nullable().optional(),
    initialBalance: z.number().optional(),
    archived: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const accountIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const listAccountsSchema = z.object({
  query: z.object({
    includeArchived: z
      .enum(['true', 'false'])
      .optional()
      .transform((value) => value === 'true'),
  }),
});

export const createTransferSchema = z.object({
  body: z.object({
    fromAccountId: z.string().uuid(),
    toAccountId: z.string().uuid(),
    amount: z.number().positive(),
    date: z.coerce.date(),
    description: z.string().max(280).optional(),
  }),
});

export const transferGroupParamSchema = z.object({
  params: z.object({
    transferGroupId: z.string().uuid(),
  }),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>['body'];
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>['body'];
export type ListAccountsQuery = z.infer<typeof listAccountsSchema>['query'];
export type CreateTransferInput = z.infer<typeof createTransferSchema>['body'];
