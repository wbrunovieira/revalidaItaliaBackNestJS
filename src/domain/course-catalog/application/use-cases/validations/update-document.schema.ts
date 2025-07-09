// src/domain/course-catalog/application/use-cases/validations/update-document.schema.ts

import { z } from 'zod';

const translationSchema = z.object({
  locale: z.enum(['pt', 'it', 'es'], {
    errorMap: () => ({ message: 'Locale must be one of: pt, it, es' }),
  }),
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(1000, 'Description too long'),
  url: z
    .string()
    .min(1, 'URL is required')
    .refine(
      (url) => {
        // Aceita URLs válidas ou caminhos de arquivo
        try {
          new URL(url);
          return true;
        } catch {
          // Verifica se é um caminho de arquivo válido
          return (
            /^[\/\\]?[\w\-\._\/\\]+\.\w+$/.test(url) ||
            /^\.?[\/\\][\w\-\._\/\\]+\.\w+$/.test(url)
          );
        }
      },
      {
        message: 'URL must be a valid URL or file path',
      },
    ),
});

export const updateDocumentSchema = z.object({
  id: z.string().uuid('Document ID must be a valid UUID'),
  filename: z
    .string()
    .min(1, 'Filename is required')
    .max(255, 'Filename too long')
    .optional(),
  fileSize: z
    .number()
    .int()
    .min(1, 'File size must be greater than 0')
    .max(100 * 1024 * 1024, 'File size cannot exceed 100MB')
    .optional(),
  mimeType: z.string().min(1, 'MIME type is required').optional(),
  isDownloadable: z.boolean().optional(),
  translations: z
    .array(translationSchema)
    .min(1, 'At least one translation is required')
    .max(3, 'Maximum of 3 translations allowed')
    .optional()
    .refine(
      (translations) => {
        if (!translations) return true;
        const locales = translations.map((t) => t.locale);
        const uniqueLocales = new Set(locales);
        return locales.length === uniqueLocales.size;
      },
      {
        message: 'Each locale can only appear once in translations',
      },
    )
    .refine(
      (translations) => {
        if (!translations) return true;
        return translations.some((t) => t.locale === 'pt');
      },
      {
        message: 'Portuguese (pt) translation is required',
      },
    ),
});

export type UpdateDocumentSchema = z.infer<typeof updateDocumentSchema>;
