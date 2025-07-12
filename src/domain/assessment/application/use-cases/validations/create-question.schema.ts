// src/domain/assessment/application/use-cases/validations/create-question.schema.ts

import { z } from 'zod';

export const createQuestionSchema = z.object({
  text: z
    .string()
    .min(10, 'Question text must be at least 10 characters long')
    .max(1000, 'Question text must be at most 1000 characters long'),

  type: z.enum(['MULTIPLE_CHOICE', 'OPEN'], {
    errorMap: () => ({
      message: 'Type must be MULTIPLE_CHOICE or OPEN',
    }),
  }),

  assessmentId: z.string().uuid('Assessment ID must be a valid UUID'),

  argumentId: z.string().uuid('Argument ID must be a valid UUID').optional(),
});

export type CreateQuestionSchema = z.infer<typeof createQuestionSchema>;