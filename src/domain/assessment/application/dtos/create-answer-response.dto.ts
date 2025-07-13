// src/domain/assessment/application/dtos/create-answer-response.dto.ts

export interface CreateAnswerResponse {
  answer: {
    id: string;
    correctOptionId?: string;
    explanation: string;
    questionId: string;
    translations: Array<{
      locale: string;
      explanation: string;
    }>;
    createdAt: Date;
    updatedAt: Date;
  };
}
