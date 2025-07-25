import { z } from 'zod';

export const updateVideoSchema = z
  .object({
    videoId: z.string().uuid({ message: 'Invalid video ID format' }),
    slug: z
      .string()
      .min(3, { message: 'Slug must be at least 3 characters' })
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
        message: 'Slug must be lowercase with hyphens only',
      })
      .optional(),
    imageUrl: z
      .string()
      .min(1, { message: 'Image URL cannot be empty' })
      .nullable()
      .optional(),
    providerVideoId: z
      .string()
      .min(1, { message: 'Provider video ID cannot be empty' })
      .optional(),
    durationInSeconds: z
      .number()
      .int({ message: 'Duration must be an integer' })
      .positive({ message: 'Duration must be positive' })
      .optional(),
    lessonId: z
      .string()
      .uuid({ message: 'Invalid lesson ID format' })
      .nullable()
      .optional(),
    translations: z
      .array(
        z.object({
          locale: z.enum(['pt', 'it', 'es'], {
            errorMap: () => ({ message: 'Locale must be pt, it, or es' }),
          }),
          title: z.string().min(1, { message: 'Title cannot be empty' }),
          description: z
            .string()
            .min(1, { message: 'Description cannot be empty' }),
        }),
      )
      .length(3, {
        message: 'Must provide exactly 3 translations (pt, it, es)',
      })
      .refine(
        (translations) => {
          const locales = translations.map((t) => t.locale);
          const uniqueLocales = new Set(locales);
          return (
            uniqueLocales.size === 3 &&
            uniqueLocales.has('pt') &&
            uniqueLocales.has('it') &&
            uniqueLocales.has('es')
          );
        },
        {
          message: 'Must provide one translation for each locale: pt, it, es',
        },
      )
      .optional(),
  })
  .refine(
    (data) => {
      const hasUpdateFields =
        data.slug !== undefined ||
        data.imageUrl !== undefined ||
        data.providerVideoId !== undefined ||
        data.durationInSeconds !== undefined ||
        data.lessonId !== undefined ||
        data.translations !== undefined;

      return hasUpdateFields;
    },
    {
      message: 'At least one field must be provided for update',
    },
  );
