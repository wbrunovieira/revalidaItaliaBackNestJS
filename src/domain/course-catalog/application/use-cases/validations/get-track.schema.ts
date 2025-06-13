// src/domain/course-catalog/application/validations/get-track.schema.ts
import { z } from 'zod';

export const getTrackSchema = z.object({
  id: z.string().uuid({ message: 'ID must be a valid UUID' }),
});

export type GetTrackSchema = z.infer<typeof getTrackSchema>;