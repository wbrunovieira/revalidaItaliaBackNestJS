// src/domain/course-catalog/application/validations/create-track.schema.ts
import { z } from 'zod';

const translationSchema = z.object({
  locale: z.enum(['pt', 'it', 'es']),
  title: z.string().min(3, 'Title must be at least 3 characters long'),
  description: z
    .string()
    .min(5, 'Description must be at least 5 characters long'),
});

export const createTrackSchema = z.object({
  slug: z.string().min(3, 'Slug must be at least 3 characters long'),
  imageUrl: z
    .union([
      z.string().url('imageUrl must be a valid absolute URL'),
      z
        .string()
        .regex(/^\/.+/, 'imageUrl must be an absolute path like "/images/..."'),
    ])
    .optional(),
  courseIds: z
    .array(z.string(), {
      invalid_type_error: 'Each courseId must be a string',
    })
    .min(1, 'At least one courseId is required'),
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
});

export type CreateTrackSchema = z.infer<typeof createTrackSchema>;
