import { z } from 'zod';

export const getFlashcardTagByIdSchema = z.object({
  id: z
    .string()
    .uuid('ID must be a valid UUID')
    .refine((value) => value.length > 0, {
      message: 'ID cannot be empty',
    }),
}).strict();

export type GetFlashcardTagByIdSchema = z.infer<typeof getFlashcardTagByIdSchema>;