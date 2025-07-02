// src/domain/course-catalog/application/use-cases/validations/delete-lesson.schema.ts

import { z } from 'zod';

export const deleteLessonSchema = z.object({
  id: z
    .string({ required_error: 'Lesson ID is required' })
    .min(1, 'Lesson ID is required')
    .regex(
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
      'Lesson ID must be a valid UUID',
    ),
});

export type DeleteLessonSchema = z.infer<typeof deleteLessonSchema>;
