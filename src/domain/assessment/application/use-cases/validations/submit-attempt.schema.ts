// src/domain/assessment/application/use-cases/validations/submit-attempt.schema.ts
import { z } from 'zod';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const submitAttemptSchema = z.object({
  attemptId: z
    .string({
      required_error: 'Attempt ID is required',
      invalid_type_error: 'Attempt ID must be a string',
    })
    .min(1, 'Attempt ID cannot be empty')
    .regex(uuidRegex, 'Attempt ID must be a valid UUID'),
});

export type SubmitAttemptSchemaType = z.infer<typeof submitAttemptSchema>;