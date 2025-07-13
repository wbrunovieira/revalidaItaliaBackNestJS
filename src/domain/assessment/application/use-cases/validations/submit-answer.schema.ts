// src/domain/assessment/application/use-cases/validations/submit-answer.schema.ts
import { z } from 'zod';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const submitAnswerSchema = z.object({
  attemptId: z
    .string({
      required_error: 'Attempt ID is required',
      invalid_type_error: 'Attempt ID must be a string',
    })
    .min(1, 'Attempt ID cannot be empty')
    .regex(uuidRegex, 'Attempt ID must be a valid UUID'),
  
  questionId: z
    .string({
      required_error: 'Question ID is required',
      invalid_type_error: 'Question ID must be a string',
    })
    .min(1, 'Question ID cannot be empty')
    .regex(uuidRegex, 'Question ID must be a valid UUID'),
  
  selectedOptionId: z
    .string()
    .regex(uuidRegex, 'Selected option ID must be a valid UUID')
    .optional(),
  
  textAnswer: z
    .string()
    .trim()
    .optional(),
}).refine(
  (data) => data.selectedOptionId || data.textAnswer,
  {
    message: 'Either selectedOptionId or textAnswer must be provided',
    path: ['selectedOptionId', 'textAnswer'],
  }
).refine(
  (data) => !(data.selectedOptionId && data.textAnswer),
  {
    message: 'Cannot provide both selectedOptionId and textAnswer',
    path: ['selectedOptionId', 'textAnswer'],
  }
);

export type SubmitAnswerSchemaType = z.infer<typeof submitAnswerSchema>;