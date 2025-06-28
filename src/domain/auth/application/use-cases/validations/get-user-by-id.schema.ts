// src/domain/auth/application/schemas/get-user-by-id.schema.ts
import { z } from 'zod';

export const getUserByIdSchema = z.object({
  id: z.string().uuid('Invalid user ID format'),
});

export type GetUserByIdSchema = z.infer<typeof getUserByIdSchema>;
