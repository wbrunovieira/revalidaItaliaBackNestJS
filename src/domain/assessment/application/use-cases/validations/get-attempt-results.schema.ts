// src/domain/assessment/application/use-cases/validations/get-attempt-results.schema.ts

import { z } from 'zod';

export const getAttemptResultsSchema = z.object({
  attemptId: z.string().uuid('Invalid attempt ID format'),
  requesterId: z.string().uuid('Invalid requester ID format'),
});

export type GetAttemptResultsSchema = z.infer<typeof getAttemptResultsSchema>;