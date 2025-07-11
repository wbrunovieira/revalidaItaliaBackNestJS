import { z } from 'zod';

export const listArgumentsSchema = z
  .object({
    page: z
      .number()
      .int('Page must be an integer')
      .min(1, 'Page must be at least 1')
      .optional()
      .default(1),
    limit: z
      .number()
      .int('Limit must be an integer')
      .min(1, 'Limit must be at least 1')
      .max(100, 'Limit cannot exceed 100')
      .optional()
      .default(10),
    assessmentId: z
      .string()
      .uuid('Assessment ID must be a valid UUID')
      .optional(),
  })
  .strict();

export type ListArgumentsSchema = z.infer<typeof listArgumentsSchema>;
