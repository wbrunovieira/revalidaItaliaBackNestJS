// src/domain/assessment/application/dtos/create-question.dto.ts
export interface CreateQuestionDto {
  text: string;
  type: 'MULTIPLE_CHOICE' | 'OPEN';
  assessmentId: string;
  argumentId?: string;
}