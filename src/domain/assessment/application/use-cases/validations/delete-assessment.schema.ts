// src/domain/assessment/application/use-cases/validations/delete-assessment.schema.ts
import { z } from 'zod';

export const deleteAssessmentSchema = z.object({
  id: z.string().uuid(),
});
