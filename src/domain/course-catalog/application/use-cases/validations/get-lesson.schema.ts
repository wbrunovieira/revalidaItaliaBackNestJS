// src/domain/course-catalog/application/use-cases/validations/get-lesson.schema.ts
import { z } from 'zod';

export const getLessonSchema = z
  .object({
    id: z.string().uuid('ID must be a valid UUID'),
  })
  .strict();

export type GetLessonSchema = z.infer<typeof getLessonSchema>;
