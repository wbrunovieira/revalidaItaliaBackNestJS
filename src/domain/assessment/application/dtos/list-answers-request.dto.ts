// src/domain/assessment/application/dtos/list-answers-request.dto.ts

export interface ListAnswersRequest {
  page?: number;
  limit?: number;
  questionId?: string;
}
