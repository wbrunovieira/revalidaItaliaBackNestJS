// src/domain/course-catalog/application/use-cases/validations/delete-track.schema.ts

import { z } from 'zod';

export const deleteTrackSchema = z.object({
  id: z
    .string({ required_error: 'Track ID is required' })
    .min(1, 'Track ID is required')
    .regex(
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
      'Track ID must be a valid UUID',
    ),
});

export type DeleteTrackSchema = z.infer<typeof deleteTrackSchema>;
