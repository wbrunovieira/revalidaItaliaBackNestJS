// src/domain/course-catalog/application/use-cases/validations/delete-module.schema.ts

import { z } from 'zod';

export const deleteModuleSchema = z.object({
  id: z
    .string({ required_error: 'Module ID is required' })
    .min(1, 'Module ID is required')
    .regex(
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
      'Module ID must be a valid UUID',
    ),
});

export type DeleteModuleSchema = z.infer<typeof deleteModuleSchema>;
