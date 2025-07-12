// src/domain/assessment/application/use-cases/validations/get-assessment.schema.ts
import { z } from 'zod';

export const getAssessmentSchema = z
  .object({
    id: z.string().uuid('ID must be a valid UUID'),
  })
  .strict();

export type GetAssessmentSchemaType = z.infer<typeof getAssessmentSchema>;
