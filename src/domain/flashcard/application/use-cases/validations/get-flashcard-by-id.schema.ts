// src/domain/flashcard/application/use-cases/validations/get-flashcard-by-id.schema.ts
import { z } from 'zod';

export const getFlashcardByIdSchema = z.object({
  id: z.string().uuid('ID must be a valid UUID'),
  filters: z
    .object({
      includeTags: z.boolean().optional(),
      includeInteractionStats: z.boolean().optional(),
      includeRelatedFlashcards: z.boolean().optional(),
    })
    .optional(),
});
