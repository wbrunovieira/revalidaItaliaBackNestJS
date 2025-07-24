// src/domain/assessment/application/dtos/get-questions-detailed-response.dto.ts

export interface QuestionOptionDetailed {
  id: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnswerTranslation {
  locale: string;
  explanation: string;
}

export interface QuestionDetailed {
  id: string;
  text: string;
  type: 'MULTIPLE_CHOICE' | 'OPEN';
  argumentId?: string;
  options: QuestionOptionDetailed[];
  answer?: {
    id: string;
    correctOptionId?: string;
    explanation: string;
    translations: AnswerTranslation[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ArgumentDetailed {
  id: string;
  title: string;
  description?: string;
  assessmentId: string;
  questions: QuestionDetailed[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GetQuestionsDetailedResponse {
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
  lesson?: {
    id: string;
    slug: string;
    title: string;
    order: number;
    moduleId: string;
  };
  arguments: ArgumentDetailed[];
  questions: QuestionDetailed[];
  totalQuestions: number;
  totalQuestionsWithAnswers: number;
}
