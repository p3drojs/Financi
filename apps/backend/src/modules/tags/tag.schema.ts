import { z } from 'zod';

export const tagIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const tagNamesSchema = z.array(z.string().trim().min(1).max(40)).max(20);
