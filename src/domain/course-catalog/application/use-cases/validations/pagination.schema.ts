// src/domain/course-catalog/application/use-cases/validations/pagination.schema.ts
import { z } from 'zod';

export const paginationParamsSchema = z.object({
  page: z
    .number()
    .int('Page must be an integer')
    .min(1, 'Page must be at least 1')
    .optional()
    .default(1),

  limit: z
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .optional()
    .default(10),
});

export type PaginationParamsSchema = z.infer<typeof paginationParamsSchema>;

export const paginationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().min(1).max(1000)),

  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .pipe(z.number().int().min(1).max(100)),
});

export type PaginationQuerySchema = z.infer<typeof paginationQuerySchema>;
