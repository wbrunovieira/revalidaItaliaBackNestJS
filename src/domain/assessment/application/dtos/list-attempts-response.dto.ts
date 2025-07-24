// src/domain/assessment/application/dtos/list-attempts-response.dto.ts

export interface AttemptSummary {
  id: string;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADING' | 'GRADED';
  score?: number;
  startedAt: Date;
  submittedAt?: Date;
  gradedAt?: Date;
  timeLimitExpiresAt?: Date;
  identityId: string;
  assessmentId: string;
  assessment: {
    id: string;
    title: string;
    type: 'QUIZ' | 'SIMULADO' | 'PROVA_ABERTA';
    passingScore?: number;
  };
  student?: {
    id: string;
    name: string;
    email: string;
  };
  pendingAnswers?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListAttemptsResponse {
  attempts: AttemptSummary[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
