// src/domain/assessment/application/use-cases/validations/start-attempt.schema.ts

import { z } from 'zod';

export const startAttemptSchema = z
  .object({
    userId: z
      .string()
      .trim()
      .min(1, 'User ID cannot be empty')
      .refine((val) => {
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(val);
      }, 'User ID must be a valid UUID'),

    assessmentId: z
      .string()
      .trim()
      .min(1, 'Assessment ID cannot be empty')
      .refine((val) => {
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(val);
      }, 'Assessment ID must be a valid UUID'),
  })
  .strict();

export type StartAttemptSchema = z.infer<typeof startAttemptSchema>;
