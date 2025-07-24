// src/domain/assessment/application/dtos/list-answers-response.dto.ts

export interface AnswerDto {
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
}

export interface ListAnswersResponse {
  answers: AnswerDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
