// src/domain/course-catalog/application/use-cases/validations/get-videos.schema.ts
import { z } from 'zod';

export const getVideosSchema = z.object({
  lessonId: z.string().uuid(),
});

export type GetVideosSchema = z.infer<typeof getVideosSchema>;
