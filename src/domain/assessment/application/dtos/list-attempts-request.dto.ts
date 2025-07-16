// src/domain/assessment/application/dtos/list-attempts-request.dto.ts

export interface ListAttemptsRequest {
  status?: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADING' | 'GRADED';
  userId?: string;
  assessmentId?: string;
  page?: number;
  pageSize?: number;
  requesterId: string;
}