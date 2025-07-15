// src/domain/assessment/application/dtos/list-questions-by-assessment-response.dto.ts

export interface QuestionOptionResponse {
  id: string;
  text: string;
}

export interface QuestionResponse {
  id: string;
  text: string;
  type: 'MULTIPLE_CHOICE' | 'OPEN';
  options: QuestionOptionResponse[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ListQuestionsByAssessmentResponse {
  questions: QuestionResponse[];
}