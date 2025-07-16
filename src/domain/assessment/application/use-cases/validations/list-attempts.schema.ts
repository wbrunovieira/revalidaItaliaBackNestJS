// src/domain/assessment/application/use-cases/validations/list-attempts.schema.ts

import { z } from 'zod';

export const listAttemptsSchema = z.object({
  status: z.enum(['IN_PROGRESS', 'SUBMITTED', 'GRADING', 'GRADED']).optional(),
  userId: z.string().uuid().optional(),
  assessmentId: z.string().uuid().optional(),
  page: z.number().int().min(1).optional().default(1),
  pageSize: z.number().int().min(1).max(100).optional().default(20),
  requesterId: z.string().uuid(),
});