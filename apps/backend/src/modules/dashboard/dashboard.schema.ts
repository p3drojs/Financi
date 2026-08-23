import { z } from 'zod';

export const summarySchema = z.object({
  query: z.object({
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    accountId: z.string().uuid().optional(),
  }),
});

export const byCategorySchema = z.object({
  query: z.object({
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    type: z.enum(['INCOME', 'EXPENSE']).optional(),
    accountId: z.string().uuid().optional(),
  }),
});

export const balanceEvolutionSchema = z.object({
  query: z.object({
    months: z.coerce.number().int().min(1).max(36).default(6),
    accountId: z.string().uuid().optional(),
  }),
});

export const forecastSchema = z.object({
  query: z.object({
    until: z.coerce.date().optional(),
    accountId: z.string().uuid().optional(),
  }),
});

export type SummaryQuery = z.infer<typeof summarySchema>['query'];
export type ByCategoryQuery = z.infer<typeof byCategorySchema>['query'];
export type BalanceEvolutionQuery = z.infer<typeof balanceEvolutionSchema>['query'];
export type ForecastQuery = z.infer<typeof forecastSchema>['query'];
