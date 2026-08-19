import { z } from 'zod';

const baseFields = {
  categoryId: z.string().uuid(),
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.number().positive(),
  description: z.string().max(280).optional(),
  tagNames: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
};

export const createTransactionSchema = z.object({
  body: z.object({
    ...baseFields,
    date: z.coerce.date(),
  }),
});

export const createRecurringTransactionSchema = z.object({
  body: z.object({
    ...baseFields,
    startDate: z.coerce.date(),
    intervalMonths: z.number().int().min(1).max(60),
    endDate: z.coerce.date().optional(),
    occurrences: z.number().int().min(1).max(600).optional(),
  }),
});

export const createInstallmentTransactionSchema = z.object({
  body: z.object({
    ...baseFields,
    startDate: z.coerce.date(),
    installmentTotal: z.number().int().min(2).max(60),
  }),
});

export const updateTransactionSchema = z.object({
  body: z.object({
    categoryId: z.string().uuid().optional(),
    amount: z.number().positive().optional(),
    description: z.string().max(280).optional(),
    date: z.coerce.date().optional(),
    tagNames: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const transactionIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const recurrenceIdParamSchema = z.object({
  params: z.object({
    recurrenceId: z.string().uuid(),
  }),
});

export const listTransactionsSchema = z.object({
  query: z.object({
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    categoryId: z.string().uuid().optional(),
    type: z.enum(['INCOME', 'EXPENSE']).optional(),
    tag: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(200).default(50),
  }),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>['body'];
export type CreateRecurringTransactionInput = z.infer<
  typeof createRecurringTransactionSchema
>['body'];
export type CreateInstallmentTransactionInput = z.infer<
  typeof createInstallmentTransactionSchema
>['body'];
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>['body'];
export type ListTransactionsQuery = z.infer<typeof listTransactionsSchema>['query'];
