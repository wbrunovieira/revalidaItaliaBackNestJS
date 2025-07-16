// src/domain/assessment/application/use-cases/validations/list-pending-reviews.schema.ts

import { z } from 'zod';

export const listPendingReviewsSchema = z.object({
  requesterId: z.string().uuid(),
  page: z.number().int().min(1).optional().default(1),
  pageSize: z.number().int().min(1).max(100).optional().default(20),
});