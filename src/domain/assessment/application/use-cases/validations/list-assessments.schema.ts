// src/domain/assessment/application/use-cases/validations/list-assessments.schema.ts
import { z } from 'zod';

export const listAssessmentsSchema = z
  .object({
    page: z
      .number()
      .int('Page must be an integer')
      .min(1, 'Page must be at least 1')
      .optional()
      .default(1),
    limit: z
      .number()
      .int('Limit must be an integer')
      .min(1, 'Limit must be at least 1')
      .max(100, 'Limit cannot exceed 100')
      .optional()
      .default(10),
    type: z
      .enum(['QUIZ', 'SIMULADO', 'PROVA_ABERTA'], {
        errorMap: () => ({
          message: 'Type must be QUIZ, SIMULADO, or PROVA_ABERTA',
        }),
      })
      .optional(),
    lessonId: z.string().uuid('Lesson ID must be a valid UUID').optional(),
  })
  .strict();

export type ListAssessmentsSchema = z.infer<typeof listAssessmentsSchema>;
