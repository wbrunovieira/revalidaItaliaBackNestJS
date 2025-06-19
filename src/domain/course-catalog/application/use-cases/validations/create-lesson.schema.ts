import { z } from 'zod';

const lessonTranslationSchema = z.object({
  locale: z.enum(['pt', 'it', 'es']),
  title: z.string().min(1, 'Lesson title must be at least 1 character long'),
  description: z
    .string()
    .min(1, 'Lesson description must be at least 1 character long')
    .optional(),
});

export const createLessonSchema = z
  .object({
    moduleId: z.string().uuid('Module ID must be a valid UUID'),
    videoId: z.string().uuid('Video ID must be a valid UUID').optional(),
    translations: z
      .array(lessonTranslationSchema)
      .length(3, 'Exactly three translations required (pt, it & es)')
      .superRefine((arr, ctx) => {
        const locales = arr.map((t) => t.locale);
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

export type CreateLessonSchema = z.infer<typeof createLessonSchema>;
