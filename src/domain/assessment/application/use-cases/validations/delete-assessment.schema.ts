// src/domain/assessment/application/use-cases/validations/delete-assessment.schema.ts
import { z } from 'zod';

export const deleteAssessmentSchema = z
  .object({
    id: z.string().uuid('ID must be a valid UUID'),
  })
  .strict();

export type DeleteAssessmentSchemaType = z.infer<typeof deleteAssessmentSchema>;
