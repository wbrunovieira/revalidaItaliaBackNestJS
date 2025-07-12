// src/domain/assessment/application/use-cases/validations/create-argument.schema.ts

import { z } from 'zod';

export const createArgumentSchema = z.object({
  title: z
    .string()
    .min(3, 'Argument title must be at least 3 characters long')
    .max(255, 'Argument title must be at most 255 characters long'),

  assessmentId: z
    .string()
    .uuid('Assessment ID must be a valid UUID')
    .optional(),
});

export type CreateArgumentSchema = z.infer<typeof createArgumentSchema>;
