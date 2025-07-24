// src/domain/assessment/application/use-cases/validations/get-answer.schema.ts

import { z } from 'zod';

export const getAnswerSchema = z.object({
  id: z.string().uuid('Invalid answer ID format'),
});

export type GetAnswerSchema = z.infer<typeof getAnswerSchema>;
