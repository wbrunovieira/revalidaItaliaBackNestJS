// src/domain/assessment/application/dtos/create-question-request.dto.ts
export interface CreateQuestionRequest {
  text: string;
  type: 'MULTIPLE_CHOICE' | 'OPEN';
  assessmentId: string;
  argumentId?: string;
}
