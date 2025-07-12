// src/domain/assessment/application/dtos/list-assessments-response.dto.ts
export interface AssessmentDto {
  id: string;
  slug: string;
  title: string;
  description?: string;
  type: 'QUIZ' | 'SIMULADO' | 'PROVA_ABERTA';
  quizPosition?: 'BEFORE_LESSON' | 'AFTER_LESSON';
  passingScore: number;
  timeLimitInMinutes?: number;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  lessonId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ListAssessmentsResponse {
  assessments: AssessmentDto[];
  pagination: PaginationInfo;
}
