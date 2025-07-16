// src/domain/assessment/application/dtos/list-questions-by-assessment-response.dto.ts

export interface QuestionOptionResponse {
  id: string;
  text: string;
}

export interface QuestionResponse {
  id: string;
  text: string;
  type: 'MULTIPLE_CHOICE' | 'OPEN';
  argumentId?: string;
  argumentName: string | null;
  options: QuestionOptionResponse[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ListQuestionsByAssessmentResponse {
  assessment: {
    id: string;
    slug: string;
    title: string;
    description?: string;
    type: 'QUIZ' | 'SIMULADO' | 'PROVA_ABERTA';
    quizPosition?: 'BEFORE_LESSON' | 'AFTER_LESSON';
    passingScore?: number;
    timeLimitInMinutes?: number;
    randomizeQuestions?: boolean;
    randomizeOptions?: boolean;
    lessonId?: string;
    createdAt: Date;
    updatedAt: Date;
  };
  questions: QuestionResponse[];
}