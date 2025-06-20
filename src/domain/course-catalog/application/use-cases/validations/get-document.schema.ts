// src/domain/course-catalog/application/use-cases/validations/get-document.schema.ts
import { z } from 'zod';

export const getDocumentSchema = z
  .object({
    lessonId: z.string().uuid('Lesson ID must be a valid UUID'),
    documentId: z.string().uuid('Document ID must be a valid UUID'),
  })
  .strict();

export type GetDocumentSchema = z.infer<typeof getDocumentSchema>;
