// src/domain/assessment/application/dtos/create-question-option-response.dto.ts

export interface CreateQuestionOptionResponse {
  questionOption: {
    id: string;
    text: string;
    questionId: string;
    createdAt: Date;
    updatedAt: Date;
  };
}