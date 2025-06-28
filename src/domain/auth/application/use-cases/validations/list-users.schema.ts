// src/domain/auth/application/validations/list-users.schema.ts
import { z } from 'zod';

export const listUsersSchema = z.object({
  page: z
    .number()
    .int()
    .min(1, { message: 'Page must be at least 1' })
    .optional()
    .default(1),
  pageSize: z
    .number()
    .int()
    .min(1, { message: 'Page size must be at least 1' })
    .max(100, { message: 'Page size must not exceed 100' })
    .optional()
    .default(20),
});

export type ListUsersSchema = z.infer<typeof listUsersSchema>;
