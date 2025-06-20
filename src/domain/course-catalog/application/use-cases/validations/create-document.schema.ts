// src/domain/course-catalog/application/use-cases/validations/create-document.schema.ts
import { z } from 'zod';

const translationSchema = z.object({
  locale: z.enum(['pt', 'it', 'es']),
  title: z.string().min(1, 'Document title must be at least 1 character long'),
  description: z
    .string()
    .min(5, 'Document description must be at least 5 characters long'),
});

const allowedMimeTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
] as const;

export const createDocumentSchema = z
  .object({
    lessonId: z.string().uuid('Lesson ID must be a valid UUID'),
    url: z
      .string()
      .url('Invalid URL format')
      .min(1, 'Document URL is required'),
    filename: z
      .string()
      .min(1, 'Filename is required')
      .regex(
        /^[a-zA-Z0-9._-]+\.[a-zA-Z0-9]+$/,
        'Invalid filename format (must include extension)',
      ),
    fileSize: z
      .number()
      .positive('File size must be positive')
      .max(50 * 1024 * 1024, 'File size cannot exceed 50MB'), // 50MB limit
    mimeType: z
      .enum(allowedMimeTypes as any)
      .refine(
        (type) => allowedMimeTypes.includes(type as any),
        'Unsupported file type',
      ),
    isDownloadable: z.boolean().default(true),
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
  .strict()
  .superRefine((data, ctx) => {
    // Validate filename extension matches mimeType
    const extension = data.filename.toLowerCase().split('.').pop();
    const mimeTypeExtensionMap: Record<string, string[]> = {
      'application/pdf': ['pdf'],
      'application/msword': ['doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        ['docx'],
      'application/vnd.ms-excel': ['xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
        'xlsx',
      ],
      'application/vnd.ms-powerpoint': ['ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        ['pptx'],
      'text/plain': ['txt'],
      'text/csv': ['csv'],
    };

    const allowedExtensions = mimeTypeExtensionMap[data.mimeType] || [];
    if (extension && !allowedExtensions.includes(extension)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `File extension .${extension} does not match MIME type ${data.mimeType}`,
        path: ['filename'],
      });
    }
  });

export type CreateDocumentSchema = z.infer<typeof createDocumentSchema>;
