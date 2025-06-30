// ═══════════════════════════════════════════════════════════════════
// src/domain/course-catalog/application/use-cases/validations/update-course.schema.ts
// ═══════════════════════════════════════════════════════════════════

import { z } from 'zod';

const translationSchema = z.object({
  locale: z.enum(['pt', 'it', 'es'], {
    errorMap: () => ({ message: 'Locale deve ser pt, it ou es' }),
  }),
  title: z.string().min(3, 'Course title must be at least 3 characters long'),
  description: z
    .string()
    .min(5, 'Course description must be at least 5 characters long'),
});

export const updateCourseSchema = z
  .object({
    id: z
      .string({ required_error: 'Course ID is required' })
      .min(1, 'Course ID is required')
      .regex(
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
        'Course ID must be a valid UUID',
      ),
    slug: z
      .string()
      .min(3, 'Slug must be at least 3 characters long')
      .optional(),
    imageUrl: z
      .union([
        z.string().url('ImageUrl must be a valid URL'),
        z
          .string()
          .regex(
            /^\/.*$/,
            'ImageUrl must be an absolute path like "/images/..."',
          ),
        z.literal(''), // Permitir string vazia explicitamente
      ])
      .optional(),
    translations: z
      .array(translationSchema)
      .min(1, 'At least one translation is required')
      .optional()
      .refine(
        (translations) => {
          if (!translations || translations.length === 0) return true;
          return translations.some((t) => t.locale === 'pt');
        },
        {
          message: 'At least a Portuguese translation is required',
          path: ['translations'],
        },
      )
      .refine(
        (translations) => {
          if (!translations || translations.length === 0) return true;
          const locales = translations.map((t) => t.locale);
          return locales.length === new Set(locales).size;
        },
        {
          message: 'Locale duplicado em traduções',
          path: ['translations'],
        },
      ),
  })
  .refine(
    (data) => {
      const hasSlug = 'slug' in data && data.slug !== undefined;
      const hasImageUrl = 'imageUrl' in data;
      const hasTranslations =
        'translations' in data && data.translations !== undefined;

      return hasSlug || hasImageUrl || hasTranslations;
    },
    {
      message: 'At least one field must be provided for update',
      path: ['root'],
    },
  );

export type UpdateCourseSchema = z.infer<typeof updateCourseSchema>;
