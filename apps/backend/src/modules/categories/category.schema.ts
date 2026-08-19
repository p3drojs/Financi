import { z } from 'zod';

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(60),
    type: z.enum(['INCOME', 'EXPENSE']),
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, 'Cor deve estar no formato hexadecimal, ex: #FF0000')
      .optional(),
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(60).optional(),
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, 'Cor deve estar no formato hexadecimal, ex: #FF0000')
      .optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const categoryIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const listCategoriesSchema = z.object({
  query: z.object({
    type: z.enum(['INCOME', 'EXPENSE']).optional(),
  }),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>['body'];
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>['body'];
