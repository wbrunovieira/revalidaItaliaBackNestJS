// src/domain/assessment/application/use-cases/validations/get-argument.schema.ts
import { z } from 'zod';

export const getArgumentSchema = z
  .object({
    id: z.string()
      .trim()
      .min(1, 'ID cannot be empty')
      .refine(
        (val) => {
          // Check for valid UUID format after trimming
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          return uuidRegex.test(val);
        },
        'ID must be a valid UUID'
      )
      .refine(
        (val) => {
          // Ensure no extra characters or malformed structure
          return val.length === 36;
        },
        'ID must be exactly 36 characters long'
      )
      .refine(
        (val) => {
          // Check for proper hyphen placement
          const parts = val.split('-');
          return parts.length === 5 && 
                 parts[0].length === 8 && 
                 parts[1].length === 4 && 
                 parts[2].length === 4 && 
                 parts[3].length === 4 && 
                 parts[4].length === 12;
        },
        'ID must have proper UUID structure'
      ),
  })
  .strict();

export type GetArgumentSchemaType = z.infer<typeof getArgumentSchema>;