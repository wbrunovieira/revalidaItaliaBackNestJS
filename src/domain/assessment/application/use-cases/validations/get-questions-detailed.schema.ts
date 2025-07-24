// src/domain/assessment/application/use-cases/validations/get-questions-detailed.schema.ts

import { z } from 'zod';

export const getQuestionsDetailedSchema = z.object({
  assessmentId: z.string().uuid('Assessment ID must be a valid UUID'),
});

export type GetQuestionsDetailedSchema = z.infer<
  typeof getQuestionsDetailedSchema
>;
