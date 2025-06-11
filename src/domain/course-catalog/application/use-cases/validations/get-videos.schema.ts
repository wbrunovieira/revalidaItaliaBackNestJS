// src/domain/course-catalog/application/validations/get-videos.schema.ts
import { z } from 'zod';

export const getVideosSchema = z
  .object({
    courseId: z.string().uuid('Course ID must be a valid UUID'),
    moduleId: z.string().uuid('Module ID must be a valid UUID'),
  })
  .strict();

  export type GetVideosSchema = z.infer<typeof getVideosSchema>;