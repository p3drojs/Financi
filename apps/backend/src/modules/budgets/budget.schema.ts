import { z } from 'zod';
import { MONTH_PATTERN, monthStart } from './budget.util';

const month = z.string().regex(MONTH_PATTERN, 'month precisa estar no formato YYYY-MM');

export const listBudgetsSchema = z.object({
  query: z.object({
    month: month.optional(),
  }),
});

export const createBudgetSchema = z.object({
  body: z.object({
    categoryId: z.string().uuid(),
    month,
    amount: z.number().positive(),
  }),
});

export const updateBudgetSchema = z.object({
  body: z.object({
    amount: z.number().positive(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const budgetIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const copyBudgetSchema = z.object({
  body: z.object({
    fromMonth: month,
    toMonth: month,
  }),
});

export { monthStart };

export type ListBudgetsQuery = z.infer<typeof listBudgetsSchema>['query'];
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>['body'];
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>['body'];
export type CopyBudgetInput = z.infer<typeof copyBudgetSchema>['body'];
