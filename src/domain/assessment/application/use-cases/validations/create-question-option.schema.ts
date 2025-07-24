// src/domain/assessment/application/use-cases/validations/create-question-option.schema.ts

import { z } from 'zod';

export const createQuestionOptionSchema = z.object({
  text: z
    .string({ required_error: 'Option text is required' })
    .min(1, { message: 'Option text cannot be empty' })
    .max(500, { message: 'Option text must be less than 500 characters' }),
  questionId: z
    .string({ required_error: 'Question ID is required' })
    .uuid({ message: 'Question ID must be a valid UUID' }),
});

export type CreateQuestionOptionSchema = z.infer<
  typeof createQuestionOptionSchema
>;
