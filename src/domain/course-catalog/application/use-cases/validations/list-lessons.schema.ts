// src/domain/course-catalog/application/use-cases/validations/list-lessons.schema.ts
import { z } from 'zod';

export const listLessonsSchema = z.object({
  moduleId: z
    .string()
    .uuid('Module ID must be a valid UUID')
    .min(1, 'Module ID is required'),

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

  includeVideo: z.boolean().optional().default(false),
});

export type ListLessonsSchema = z.infer<typeof listLessonsSchema>;
