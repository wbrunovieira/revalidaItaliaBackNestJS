// src/domain/course-catalog/application/validations/get-course.schema.ts
import { z } from 'zod';

export const getCourseSchema = z.object({
  id: z.string().uuid('ID must be a valid UUID'),
});

export type GetCourseSchema = z.infer<typeof getCourseSchema>;
