// src/domain/course-catalog/application/use-cases/validations/delete-video.schema.ts
import { z } from 'zod';

export const deleteVideoSchema = z.object({
  id: z
    .string({ required_error: 'Video ID is required' })
    .min(1, 'Video ID is required')
    .regex(
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
      'Video ID must be a valid UUID',
    ),
});

export type DeleteVideoSchema = z.infer<typeof deleteVideoSchema>;
