// ═══════════════════════════════════════════════════════════════════
// src/domain/course-catalog/application/use-cases/validations/delete-course.schema.ts
// ═══════════════════════════════════════════════════════════════════

import { z } from 'zod';

export const deleteCourseSchema = z.object({
  id: z
    .string({ required_error: 'Course ID is required' })
    .min(1, 'Course ID is required')
    .regex(
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
      'Course ID must be a valid UUID',
    ),
});

export type DeleteCourseSchema = z.infer<typeof deleteCourseSchema>;
