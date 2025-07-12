// src/domain/assessment/application/dtos/list-assessments-request.dto.ts
export interface ListAssessmentsRequest {
  page?: number;
  limit?: number;
  type?: 'QUIZ' | 'SIMULADO' | 'PROVA_ABERTA';
  lessonId?: string;
}
