// src/domain/assessment/application/dtos/create-assessment.dto.ts

export interface CreateAssessmentDto {
  assessment: {
    id: string;
    title: string;
    description?: string;
    type: string;
    quizPosition?: string;
    passingScore: number;
    timeLimitInMinutes?: number;
    randomizeQuestions: boolean;
    randomizeOptions: boolean;
    lessonId?: string;
    createdAt: Date;
    updatedAt: Date;
  };
}
