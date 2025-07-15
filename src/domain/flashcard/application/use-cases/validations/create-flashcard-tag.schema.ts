import { z } from 'zod';

export const createFlashcardTagSchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters long')
    .max(50, 'Name cannot exceed 50 characters')
    .trim()
    .refine((value) => value.length > 0, {
      message: 'Name cannot be empty after trimming',
    }),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters long')
    .max(50, 'Slug cannot exceed 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .optional(),
}).strict();

export type CreateFlashcardTagSchema = z.infer<typeof createFlashcardTagSchema>;