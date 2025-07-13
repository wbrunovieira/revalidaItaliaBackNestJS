// src/domain/assessment/application/dtos/start-attempt-response.dto.ts

export interface StartAttemptResponse {
  attempt: {
    id: string;
    status: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADING' | 'GRADED';
    startedAt: Date;
    timeLimitExpiresAt?: Date;
    userId: string;
    assessmentId: string;
    createdAt: Date;
    updatedAt: Date;
  };
}
