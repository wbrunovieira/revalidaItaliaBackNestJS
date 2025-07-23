import { z } from 'zod';

// Schema de cada tradução de documento, aceita URL absoluto ou caminho de arquivo (iniciando com `/`)
const translationSchema = z.object({
  locale: z.enum(['pt', 'it', 'es']),
  title: z.string().min(1, 'Document title must be at least 1 character long'),
  description: z
    .string()
    .min(5, 'Document description must be at least 5 characters long'),
  url: z
    .string()
    .min(1, 'Document translation URL or path is required')
    .refine(
      (val) => {
        try {
          // aceita URL válido
          new URL(val);
          return true;
        } catch {
          // ou caminho de arquivo começando com `/`
          return /^\/[^\s]+$/.test(val);
        }
      },
      {
        message:
          'Invalid URL format or file path (must be a valid URL or start with `/`)',
      },
    ),
});

export const createDocumentSchema = z
  .object({
    lessonId: z.string().uuid('Lesson ID must be a valid UUID'),

    filename: z
      .string()
      .min(1, 'Filename is required')
      .regex(
        /^[a-zA-Z0-9._-]+\.[a-zA-Z0-9]+$/,
        'Invalid filename format (must include extension)',
      ),

    translations: z
      .array(translationSchema)
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

export type CreateDocumentSchema = z.infer<typeof createDocumentSchema>;
