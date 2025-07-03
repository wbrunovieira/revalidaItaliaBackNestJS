// src/domain/course-catalog/application/use-cases/validations/delete-document.schema.ts

import { z } from 'zod';

export const deleteDocumentSchema = z.object({
  id: z.string().uuid('Document ID must be a valid UUID').min(1, 'Document ID is required'),
});

export type DeleteDocumentSchema = z.infer<typeof deleteDocumentSchema>;