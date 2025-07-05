// src/domain/course-catalog/application/use-cases/validations/update-module.schema.ts

import { z } from 'zod';

const updateModuleTranslationSchema = z.object({
  locale: z.enum(['pt', 'it', 'es']),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be at most 255 characters'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(1000, 'Description must be at most 1000 characters'),
});

export const updateModuleSchema = z
  .object({
    id: z
      .string({ required_error: 'Module ID is required' })
      .min(1, 'Module ID is required')
      .regex(
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/, // UUID v4 format
        'Module ID must be a valid UUID',
      ),
    slug: z
      .string()
      .min(1, 'Slug cannot be empty')
      .max(100, 'Slug must be at most 100 characters')
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Slug must contain only lowercase letters, numbers, and hyphens',
      )
      .optional(),
    imageUrl: z
      .union([
        z.string().url('Image URL must be a valid URL'),
        z
          .string()
          .regex(
            /^\/[^\s]+/,
            'Image URL must be a valid path starting with "/"',
          ),
        z.null(),
      ])
      .optional(),
    translations: z
      .array(updateModuleTranslationSchema)
      .min(1, 'At least one translation is required')
      .refine((translations) => translations.some((t) => t.locale === 'pt'), {
        message: 'Portuguese translation is required',
      })
      .refine(
        (translations) =>
          new Set(translations.map((t) => t.locale)).size ===
          translations.length,
        { message: 'Duplicate locales are not allowed' },
      )
      .optional(),
    order: z
      .number()
      .int('Order must be an integer')
      .positive('Order must be a positive number')
      .optional(),
  })
  .refine(
    (data) =>
      data.slug !== undefined ||
      data.imageUrl !== undefined ||
      data.translations !== undefined ||
      data.order !== undefined,
    { message: 'At least one field must be provided for update' },
  );

export type UpdateModuleSchema = z.infer<typeof updateModuleSchema>;
