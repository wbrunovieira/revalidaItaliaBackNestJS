// src/domain/assessment/application/use-cases/validations/list-question-options.schema.ts

import { z } from 'zod';

export const listQuestionOptionsSchema = z
  .object({
    questionId: z
      .string({ required_error: 'Question ID is required' })
      .uuid({ message: 'Question ID must be a valid UUID' }),
  })
  .strict();

export type ListQuestionOptionsSchema = z.infer<typeof listQuestionOptionsSchema>;