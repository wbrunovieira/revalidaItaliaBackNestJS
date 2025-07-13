// src/domain/assessment/application/dtos/submit-answer-response.dto.ts

export interface SubmitAnswerResponse {
  attemptAnswer: {
    id: string;
    selectedOptionId?: string;
    textAnswer?: string;
    status: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADING' | 'GRADED';
    isCorrect?: boolean;
    attemptId: string;
    questionId: string;
    createdAt: Date;
    updatedAt: Date;
  };
}