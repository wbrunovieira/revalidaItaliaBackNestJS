// src/domain/auth/application/validations/delete-user.schema.ts
import { z } from 'zod';

export const deleteUserSchema = z.object({
  id: z.string().uuid({ message: 'ID must be a valid UUID' }),
});

export type DeleteUserSchema = z.infer<typeof deleteUserSchema>;
