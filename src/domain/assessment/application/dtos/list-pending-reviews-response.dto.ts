// src/domain/assessment/application/dtos/list-pending-reviews-response.dto.ts

export interface PendingReviewAttempt {
  id: string;
  status: 'SUBMITTED' | 'GRADING';
  submittedAt: Date;
  assessment: {
    id: string;
    title: string;
    type: 'PROVA_ABERTA';
  };
  student?: {
    id: string;
    name: string;
    email: string;
  };
  pendingAnswers: number;
  totalOpenQuestions: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListPendingReviewsResponse {
  attempts: PendingReviewAttempt[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
