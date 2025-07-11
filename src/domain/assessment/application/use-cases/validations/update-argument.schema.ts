// src/domain/assessment/application/use-cases/validations/update-argument.schema.ts
import { z } from 'zod';

export const updateArgumentSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(3).max(255).optional(),
});

export type UpdateArgumentSchema = z.infer<typeof updateArgumentSchema>;
