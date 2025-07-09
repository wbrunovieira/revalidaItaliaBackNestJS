// src/domain/assessment/application/use-cases/validations/create-assessment.schema.ts

import { z } from 'zod';

export const createAssessmentSchema = z
  .object({
    title: z
      .string()
      .min(3, 'Assessment title must be at least 3 characters long'),
    description: z.string().optional(),
    type: z.enum(['QUIZ', 'SIMULADO', 'PROVA_ABERTA'], {
      errorMap: () => ({
        message: 'Type must be QUIZ, SIMULADO or PROVA_ABERTA',
      }),
    }),
    quizPosition: z.enum(['BEFORE_LESSON', 'AFTER_LESSON']).optional(),
    passingScore: z
      .number()
      .int('Passing score must be an integer')
      .min(0, 'Passing score must be at least 0')
      .max(100, 'Passing score must be at most 100'),
    timeLimitInMinutes: z
      .number()
      .int('Time limit must be an integer')
      .positive('Time limit must be positive')
      .optional(),
    randomizeQuestions: z.boolean().default(false),
    randomizeOptions: z.boolean().default(false),
    lessonId: z.string().uuid('Lesson ID must be a valid UUID').optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    // Quiz-specific validations
    if (data.type === 'QUIZ') {
      if (!data.quizPosition) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Quiz position is required for QUIZ type assessments',
          path: ['quizPosition'],
        });
      }
      if (!data.lessonId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Lesson ID is required for QUIZ type assessments',
          path: ['lessonId'],
        });
      }
    }

    // Non-quiz validations
    if (data.type !== 'QUIZ') {
      if (data.quizPosition) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Quiz position can only be set for QUIZ type assessments',
          path: ['quizPosition'],
        });
      }
    }

    // Simulado-specific validations
    if (data.type === 'SIMULADO') {
      if (!data.timeLimitInMinutes) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Time limit is recommended for SIMULADO type assessments',
          path: ['timeLimitInMinutes'],
        });
      }
    }
  });

export type CreateAssessmentSchema = z.infer<typeof createAssessmentSchema>;
