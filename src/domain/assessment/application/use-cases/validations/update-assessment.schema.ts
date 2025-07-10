// src/domain/assessment/application/use-cases/validations/update-assessment.schema.ts
import { z } from 'zod';

export const updateAssessmentSchema = z.object({
  id: z.string().uuid(),
  title: z
    .string()
    .min(3)
    .refine(
      (title) => {
        // Check if title contains at least 3 alphanumeric characters
        // This simulates checking if it would produce a valid slug
        const alphanumeric = title.replace(/[^a-zA-Z0-9]/g, '');
        return alphanumeric.length >= 3;
      },
      { message: 'String must contain at least 3 character(s)' },
    )
    .optional(),
  description: z.string().optional(),
  type: z.enum(['QUIZ', 'SIMULADO', 'PROVA_ABERTA']).optional(),
  quizPosition: z.enum(['BEFORE_LESSON', 'AFTER_LESSON']).optional(),
  passingScore: z.number().min(0).max(100).optional(),
  timeLimitInMinutes: z.number().min(1).optional(),
  randomizeQuestions: z.boolean().optional(),
  randomizeOptions: z.boolean().optional(),
  lessonId: z.union([z.string(), z.null()]).optional(), // Allow string or null
});
