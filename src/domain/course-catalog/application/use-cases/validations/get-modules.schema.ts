// src/domain/course-catalog/application/validations/get-modules.schema.ts
import { z } from 'zod';

export const getModulesSchema = z.object({
  courseId: z.string().uuid('ID must be a valid UUID'),
});

export type GetModulesSchema = z.infer<typeof getModulesSchema>;
