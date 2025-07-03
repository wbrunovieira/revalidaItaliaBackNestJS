// src/domain/course-catalog/application/use-cases/validations/list-documents.schema.ts
import { z } from 'zod';

export const listDocumentsSchema = z
  .object({
    lessonId: z.string().uuid('Lesson ID must be a valid UUID'),
  })
  .strict();

export type ListDocumentsSchema = z.infer<typeof listDocumentsSchema>;
