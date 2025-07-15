// src/domain/flashcard/application/use-cases/validations/create-flashcard.schema.ts

import { z } from 'zod';

const flashcardContentSchema = z.object({
  type: z.enum(['TEXT', 'IMAGE'], {
    errorMap: () => ({ message: 'Content type must be either TEXT or IMAGE' }),
  }),
  content: z
    .string()
    .min(1, 'Content cannot be empty')
    .max(1000, 'Content cannot exceed 1000 characters')
    .refine((content) => content.trim().length > 0, {
      message: 'Content cannot be only whitespace',
    }),
});

const imageContentSchema = flashcardContentSchema.extend({
  type: z.literal('IMAGE'),
  content: z
    .string()
    .url('Image content must be a valid URL')
    .refine(
      (url) => {
        try {
          const parsedUrl = new URL(url);
          return ['http:', 'https:'].includes(parsedUrl.protocol);
        } catch {
          return false;
        }
      },
      {
        message: 'Image URL must use HTTP or HTTPS protocol',
      },
    ),
});

const textContentSchema = flashcardContentSchema.extend({
  type: z.literal('TEXT'),
  content: z
    .string()
    .min(1, 'Text content cannot be empty')
    .max(1000, 'Text content cannot exceed 1000 characters')
    .refine((content) => content.trim().length > 0, {
      message: 'Text content cannot be only whitespace',
    }),
});

const contentSchema = z.union([imageContentSchema, textContentSchema], {
  errorMap: (issue, ctx) => {
    if (issue.code === 'invalid_union') {
      return { message: 'Content type must be either TEXT or IMAGE' };
    }
    return { message: ctx.defaultError };
  },
});

export const createFlashcardSchema = z
  .object({
    question: contentSchema,
    answer: contentSchema,
    argumentId: z
      .string()
      .uuid('Argument ID must be a valid UUID')
      .min(1, 'Argument ID is required'),
    tagIds: z
      .array(
        z.string().uuid('Each tag ID must be a valid UUID'),
      )
      .optional()
      .default([])
      .refine(
        (tagIds) => {
          if (!tagIds || tagIds.length === 0) return true;
          const uniqueTagIds = new Set(tagIds);
          return uniqueTagIds.size === tagIds.length;
        },
        {
          message: 'Tag IDs must be unique',
        },
      ),
    slug: z
      .string()
      .min(1, 'Slug cannot be empty')
      .max(100, 'Slug cannot exceed 100 characters')
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Slug must contain only lowercase letters, numbers, and hyphens',
      )
      .optional(),
    importBatchId: z
      .string()
      .min(1, 'Import batch ID cannot be empty')
      .max(100, 'Import batch ID cannot exceed 100 characters')
      .optional(),
  })
  .refine(
    (data) => {
      // Ensure question and answer are different
      if (
        data.question.type === data.answer.type &&
        data.question.content === data.answer.content
      ) {
        return false;
      }
      return true;
    },
    {
      message: 'Question and answer must be different',
      path: ['answer'],
    },
  );