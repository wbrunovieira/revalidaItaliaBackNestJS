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
      .max(100, 'Passing score must be at most 100')
      .optional(),

    timeLimitInMinutes: z
      .number()
      .int('Time limit must be an integer')
      .positive('Time limit must be positive (minimum: 1)')
      .optional(),

    randomizeQuestions: z.boolean().default(false).optional(),

    randomizeOptions: z.boolean().default(false).optional(),

    lessonId: z.string().uuid('Lesson ID must be a valid UUID').optional(),
  })
  .superRefine((data, ctx) => {
    // Regras específicas para QUIZ
    if (data.type === 'QUIZ') {
      if (!data.quizPosition) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Quiz position is required for QUIZ type assessments',
          path: ['quizPosition'],
        });
      }
    }

    // Regras para tipos diferentes de QUIZ
    if (data.type !== 'QUIZ' && data.quizPosition) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Quiz position is only allowed for QUIZ assessments',
        path: ['quizPosition'],
      });
    }

    // Regras para tempo limite (só permitido para SIMULADO)
    if (data.type !== 'SIMULADO' && data.timeLimitInMinutes) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Time limit can only be set for SIMULADO type assessments',
        path: ['timeLimitInMinutes'],
      });
    }

    // Regras para passingScore em PROVA_ABERTA
    if (data.type !== 'PROVA_ABERTA' && data.passingScore === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passing score is required for QUIZ and SIMULADO assessments',
        path: ['passingScore'],
      });
    }

    // Regras para randomizeQuestions e randomizeOptions em tipos diferentes de PROVA_ABERTA
    if (data.type !== 'PROVA_ABERTA') {
      if (data.randomizeQuestions === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'randomizeQuestions is required for QUIZ and SIMULADO assessments',
          path: ['randomizeQuestions'],
        });
      }
      if (data.randomizeOptions === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'randomizeOptions is required for QUIZ and SIMULADO assessments',
          path: ['randomizeOptions'],
        });
      }
    }

    // Não há mais restrição de lessonId para tipos diferentes de QUIZ
    // lessonId pode ser passado para qualquer tipo, ou omitido
  });

export type CreateAssessmentSchema = z.infer<typeof createAssessmentSchema>;
