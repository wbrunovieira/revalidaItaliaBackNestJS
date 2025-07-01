// src/domain/course-catalog/application/use-cases/validations/update-track.schema.ts
import { z } from 'zod';

const SUPPORTED_LOCALES = ['pt', 'it', 'es'] as const;

const updateTrackTranslationSchema = z.object({
  locale: z.enum(SUPPORTED_LOCALES),
  title: z.string().min(1).max(255),
  description: z.string().min(1).max(1000),
});

export const updateTrackSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1).max(100).optional(),
  imageUrl: z
    .union([
      z.string().url(), // URLs absolutas
      z.string().regex(/^\/.*$/, {
        message: 'Caminho relativo inválido', // caminhos que começam com /
      }),
      z.literal(''), // se quiser suportar string vazia
    ])
    .optional(), // ou undefined
  courseIds: z.array(z.string().uuid()).optional(),
  translations: z.array(updateTrackTranslationSchema).min(1).optional(),
});

export type UpdateTrackSchema = z.infer<typeof updateTrackSchema>;
