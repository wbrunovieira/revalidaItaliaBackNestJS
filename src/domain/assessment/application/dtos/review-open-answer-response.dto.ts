// src/domain/assessment/application/dtos/review-open-answer-response.dto.ts

export interface ReviewOpenAnswerResponse {
  attemptAnswer: {
    id: string;
    textAnswer?: string;
    status: 'SUBMITTED' | 'GRADING' | 'GRADED';
    isCorrect: boolean;
    teacherComment?: string;
    attemptId: string;
    questionId: string;
    createdAt: Date;
    updatedAt: Date;
  };
  attemptStatus: {
    id: string;
    status: 'SUBMITTED' | 'GRADED';
    allOpenQuestionsReviewed: boolean; // Se todas as questões abertas foram revisadas
  };
}