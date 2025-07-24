// src/domain/assessment/application/use-cases/validations/review-open-answer.schema.ts
import { z } from 'zod';

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const reviewOpenAnswerSchema = z.object({
  attemptAnswerId: z
    .string({
      required_error: 'Attempt answer ID is required',
      invalid_type_error: 'Attempt answer ID must be a string',
    })
    .min(1, 'Attempt answer ID cannot be empty')
    .regex(uuidRegex, 'Attempt answer ID must be a valid UUID'),

  reviewerId: z
    .string({
      required_error: 'Reviewer ID is required',
      invalid_type_error: 'Reviewer ID must be a string',
    })
    .min(1, 'Reviewer ID cannot be empty')
    .regex(uuidRegex, 'Reviewer ID must be a valid UUID'),

  isCorrect: z.boolean({
    required_error: 'isCorrect is required',
    invalid_type_error: 'isCorrect must be a boolean',
  }),

  teacherComment: z
    .string()
    .trim()
    .min(1, 'Teacher comment cannot be empty if provided')
    .max(1000, 'Teacher comment cannot exceed 1000 characters')
    .optional(),
});

export type ReviewOpenAnswerSchemaType = z.infer<typeof reviewOpenAnswerSchema>;
