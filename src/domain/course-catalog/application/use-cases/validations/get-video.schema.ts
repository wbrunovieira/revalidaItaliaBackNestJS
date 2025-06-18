//src/domain/course-catalog/application/use-cases/validations/get-video.schema.ts
import { z } from 'zod';

export const getVideoSchema = z
  .object({
    id: z.string().uuid('Video ID deve ser um UUID válido'),
  })
  .strict();

export type GetVideoSchema = z.infer<typeof getVideoSchema>;
