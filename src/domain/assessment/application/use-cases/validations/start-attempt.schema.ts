// src/domain/assessment/application/use-cases/validations/start-attempt.schema.ts

import { z } from 'zod';

export const startAttemptSchema = z
  .object({
    identityId: z
      .string()
      .trim()
      .min(1, 'Identity ID cannot be empty')
      .refine((val) => {
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(val);
      }, 'Identity ID must be a valid UUID'),

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
