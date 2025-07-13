// src/domain/assessment/application/use-cases/validations/create-answer.schema.ts

import { z } from 'zod';

export const createAnswerSchema = z
  .object({
    correctOptionId: z
      .string()
      .trim()
      .min(1, 'Correct option ID cannot be empty')
      .refine((val) => {
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(val);
      }, 'Correct option ID must be a valid UUID')
      .optional(),

    explanation: z
      .string()
      .trim()
      .min(1, 'Explanation cannot be empty')
      .max(2000, 'Explanation must be at most 2000 characters'),

    questionId: z
      .string()
      .trim()
      .min(1, 'Question ID cannot be empty')
      .refine((val) => {
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(val);
      }, 'Question ID must be a valid UUID'),

    translations: z
      .array(
        z.object({
          locale: z.enum(['pt', 'it', 'es'], {
            errorMap: () => ({
              message: 'Locale must be pt, it, or es',
            }),
          }),
          explanation: z
            .string()
            .trim()
            .min(1, 'Translation explanation cannot be empty')
            .max(
              2000,
              'Translation explanation must be at most 2000 characters',
            ),
        }),
      )
      .optional(),
  })
  .strict();

export type CreateAnswerSchema = z.infer<typeof createAnswerSchema>;
