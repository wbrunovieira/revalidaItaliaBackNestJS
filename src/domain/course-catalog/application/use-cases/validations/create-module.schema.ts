// src/domain/course-catalog/application/validations/create-module.schema.ts
import { z } from 'zod';

const translationSchema = z.object({
  locale: z.enum(['pt', 'it', 'es']),
  title: z.string().min(3, 'Module title must be at least 3 characters long'),
  description: z.string().min(5, 'Module description must be at least 5 characters long'),
});

export const createModuleSchema = z.object({
  courseId: z
    .string()
    .uuid('ID must be a valid UUID'),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters long'),
  translations: z
    .array(translationSchema)
    .min(1, 'At least one translation is required')
    .superRefine((arr, ctx) => {
      if (!arr.some((t) => t.locale === 'pt')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'At least a Portuguese translation is required',
          path: ['translations'],
        });
      }
      const locales = arr.map((t) => t.locale);
      if (new Set(locales).size !== locales.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Duplicate locale in translations',
          path: ['translations'],
        });
      }
    }),
  order: z
    .number()
    .int('Order must be an integer')
    .positive('Order must be a positive number'),
}).strict();

export type CreateModuleSchema = z.infer<typeof createModuleSchema>;