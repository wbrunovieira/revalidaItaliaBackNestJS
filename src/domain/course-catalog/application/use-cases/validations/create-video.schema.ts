// src/domain/course-catalog/application/use-cases/validations/create-video.schema.ts
import { z } from 'zod';

const translationSchema = z.object({
  locale: z.enum(['pt', 'it', 'es']),
  title: z.string().min(1, 'Video title must be at least 1 character long'),
  description: z
    .string()
    .min(5, 'Video description must be at least 5 characters long'),
});

export const createVideoSchema = z
  .object({
    lessonId: z.string().uuid('Lesson ID must be a valid UUID'),
    slug: z
      .string()
      .min(3, 'Slug must be at least 3 characters long')
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Invalid slug format (lowercase, hyphens)',
      ),
    providerVideoId: z.string().min(1, 'providerVideoId is required'),
    translations: z
      .array(translationSchema)
      .length(3, 'Exactly three translations required (pt, it & es)')
      .superRefine((arr, ctx) => {
        const locales = arr.map((t) => t.locale);
        // Must include pt, it, es exactly once each
        for (const want of ['pt', 'it', 'es'] as const) {
          if (!locales.includes(want)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Missing ${want} translation`,
              path: ['translations'],
            });
          }
        }
        if (new Set(locales).size !== locales.length) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Duplicate locale in translations',
            path: ['translations'],
          });
        }
      }),
  })
  .strict();

export type CreateVideoSchema = z.infer<typeof createVideoSchema>;
