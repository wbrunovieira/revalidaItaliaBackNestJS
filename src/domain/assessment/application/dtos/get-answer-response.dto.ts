// src/domain/assessment/application/dtos/get-answer-response.dto.ts

export interface GetAnswerResponse {
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