// src/domain/assessment/application/use-cases/validations/list-questions-by-assessment.schema.ts

import { z } from 'zod';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const listQuestionsByAssessmentSchema = z.object({
  assessmentId: z
    .string({
      required_error: 'Assessment ID is required',
      invalid_type_error: 'Assessment ID must be a string',
    })
    .min(1, 'Assessment ID cannot be empty')
    .regex(uuidRegex, 'Assessment ID must be a valid UUID'),
});

export type ListQuestionsByAssessmentSchemaType = z.infer<typeof listQuestionsByAssessmentSchema>;