// src/domain/assessment/application/dtos/get-question-response.dto.ts
export interface GetQuestionResponse {
  question: {
    id: string;
    text: string;
    type: 'MULTIPLE_CHOICE' | 'OPEN';
    assessmentId: string;
    argumentId?: string;
    createdAt: Date;
    updatedAt: Date;
  };
}