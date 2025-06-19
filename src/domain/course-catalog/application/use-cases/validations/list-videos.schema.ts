// src/domain/course-catalog/application/validations/list-videos.schema.ts
import { z } from 'zod';

export const listVideosSchema = z
  .object({
    lessonId: z.string().uuid('lessonId deve ser um UUID válido'),
  })
  .strict();

export type ListVideosSchema = z.infer<typeof listVideosSchema>;
