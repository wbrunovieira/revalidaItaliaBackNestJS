// src/domain/auth/application/use-cases/validations/create-user.schema.ts
import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(
    /[^A-Za-z0-9]/,
    'Password must contain at least one special character',
  );

export const createUserSchema = z.object({
  name: z.string().min(3, 'User name must be at least 3 characters long'),
  email: z.string().min(1, 'Email is required'), // VO Email fará validação completa
  password: passwordSchema,
  nationalId: z.string().min(1, 'Document is required'), // VO NationalId fará validação
  role: z.enum(['admin', 'tutor', 'student']),
  source: z.string().optional(),
});

export type CreateUserSchema = z.infer<typeof createUserSchema>;