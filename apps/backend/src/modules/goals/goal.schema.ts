import { z } from 'zod';

export const listGoalsSchema = z.object({
  query: z.object({
    includeArchived: z
      .enum(['true', 'false'])
      .optional()
      .transform((value) => value === 'true'),
  }),
});

export const createGoalSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(80),
    targetAmount: z.number().positive(),
    targetDate: z.coerce.date().optional(),
    accountId: z.string().uuid().optional(),
    color: z.string().max(20).optional(),
  }),
});

export const updateGoalSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(80).optional(),
    targetAmount: z.number().positive().optional(),
    targetDate: z.coerce.date().nullable().optional(),
    accountId: z.string().uuid().nullable().optional(),
    color: z.string().max(20).nullable().optional(),
    archived: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const goalIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const createContributionSchema = z.object({
  body: z.object({
    amount: z.number().positive(),
    date: z.coerce.date(),
    transactionId: z.string().uuid().optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const contributionParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
    contributionId: z.string().uuid(),
  }),
});

export type ListGoalsQuery = z.infer<typeof listGoalsSchema>['query'];
export type CreateGoalInput = z.infer<typeof createGoalSchema>['body'];
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>['body'];
export type CreateContributionInput = z.infer<typeof createContributionSchema>['body'];
