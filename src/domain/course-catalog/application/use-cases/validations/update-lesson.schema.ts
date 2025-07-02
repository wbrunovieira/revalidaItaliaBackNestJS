// src/domain/course-catalog/application/use-cases/validations/update-lesson.schema.ts

import { z } from 'zod';

const updateLessonTranslationSchema = z.object({
  locale: z.enum(['pt', 'it', 'es']),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be at most 255 characters'),
  description: z
    .string()
    .max(1000, 'Description must be at most 1000 characters')
    .optional(),
});

export const updateLessonSchema = z
  .object({
    id: z
      .string({ required_error: 'Lesson ID is required' })
      .min(1, 'Lesson ID is required')
      .regex(
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
        'Lesson ID must be a valid UUID',
      ),
    imageUrl: z
      .union([
        z.string().url('Image URL must be a valid URL').nullable(),
        z.null(),
      ])
      .optional(),
    translations: z
      .array(updateLessonTranslationSchema)
      .min(1, 'At least one translation is required')
      .refine(
        (translations) => {
          const locales = translations.map((t) => t.locale);
          return locales.includes('pt');
        },
        { message: 'Portuguese translation is required' },
      )
      .refine(
        (translations) => {
          const locales = translations.map((t) => t.locale);
          const uniqueLocales = new Set(locales);
          return locales.length === uniqueLocales.size;
        },
        { message: 'Duplicate locales are not allowed' },
      )
      .optional(),
    order: z
      .number()
      .int('Order must be an integer')
      .positive('Order must be a positive number')
      .optional(),
    videoId: z
      .union([
        z.string().min(1, 'Video ID cannot be empty').nullable(),
        z.null(),
      ])
      .optional(),
    flashcardIds: z
      .array(z.string().min(1, 'Flashcard ID cannot be empty'))
      .optional(),
    quizIds: z.array(z.string().min(1, 'Quiz ID cannot be empty')).optional(),
    commentIds: z
      .array(z.string().min(1, 'Comment ID cannot be empty'))
      .optional(),
  })
  .refine(
    (data) => {
      // At least one field besides ID must be provided for update
      return (
        data.imageUrl !== undefined ||
        data.translations !== undefined ||
        data.order !== undefined ||
        data.videoId !== undefined ||
        data.flashcardIds !== undefined ||
        data.quizIds !== undefined ||
        data.commentIds !== undefined
      );
    },
    { message: 'At least one field must be provided for update' },
  );

export type UpdateLessonSchema = z.infer<typeof updateLessonSchema>;
