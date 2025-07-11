// src/domain/assessment/application/use-cases/validations/update-assessment.schema.ts
import { z } from 'zod';

export const updateAssessmentSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(3).max(255).optional(),
  description: z.union([z.string().max(1000), z.null()]).optional(),
  type: z.enum(['QUIZ', 'SIMULADO', 'PROVA_ABERTA']).optional(),
  quizPosition: z
    .union([z.enum(['BEFORE_LESSON', 'AFTER_LESSON']), z.null()])
    .optional(),
  passingScore: z.number().min(0).max(100).optional(),
  timeLimitInMinutes: z.union([z.number().min(1), z.null()]).optional(),
  randomizeQuestions: z.boolean().optional(),
  randomizeOptions: z.boolean().optional(),
  lessonId: z.union([z.string(), z.null()]).optional(), // Aceita qualquer string ou null
});

export type UpdateAssessmentSchema = z.infer<typeof updateAssessmentSchema>;
