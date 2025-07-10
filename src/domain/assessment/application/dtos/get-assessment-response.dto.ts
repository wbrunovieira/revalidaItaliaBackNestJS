// src/domain/assessment/application/dtos/get-assessment-response.dto.ts
export interface GetAssessmentResponse {
  assessment: {
    id: string;
    slug: string;
    title: string;
    description?: string;
    type: 'QUIZ' | 'SIMULADO' | 'PROVA_ABERTA';
    quizPosition?: 'BEFORE_LESSON' | 'AFTER_LESSON';
    passingScore: number;
    timeLimitInMinutes?: number;
    randomizeQuestions: boolean;
    randomizeOptions: boolean;
    lessonId?: string;
    createdAt: Date;
    updatedAt: Date;
  };
}