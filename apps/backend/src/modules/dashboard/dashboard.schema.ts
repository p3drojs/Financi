import { z } from 'zod';

export const summarySchema = z.object({
  query: z.object({
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
  }),
});

export const byCategorySchema = z.object({
  query: z.object({
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    type: z.enum(['INCOME', 'EXPENSE']).optional(),
  }),
});

export const balanceEvolutionSchema = z.object({
  query: z.object({
    months: z.coerce.number().int().min(1).max(36).default(6),
  }),
});

export type SummaryQuery = z.infer<typeof summarySchema>['query'];
export type ByCategoryQuery = z.infer<typeof byCategorySchema>['query'];
export type BalanceEvolutionQuery = z.infer<typeof balanceEvolutionSchema>['query'];
