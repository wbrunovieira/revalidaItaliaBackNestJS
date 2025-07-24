// src/domain/assessment/application/dtos/list-question-options-response.dto.ts

export interface ListQuestionOptionsResponse {
  options: Array<{
    id: string;
    text: string;
    questionId: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
}
