// src/domain/course-catalog/application/use-cases/validations/update-track.schema.ts
import { z } from 'zod';

const SUPPORTED_LOCALES = ['pt', 'it', 'es'] as const;

const updateTrackTranslationSchema = z.object({
  locale: z.enum(SUPPORTED_LOCALES), // Usar enum em vez de string genérica
  title: z.string().min(1).max(255),
  description: z.string().min(1).max(1000),
});

export const updateTrackSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1).max(100).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  courseIds: z.array(z.string().uuid()).optional(),
  translations: z.array(updateTrackTranslationSchema).min(1).optional(),
});

export type UpdateTrackSchema = z.infer<typeof updateTrackSchema>;
