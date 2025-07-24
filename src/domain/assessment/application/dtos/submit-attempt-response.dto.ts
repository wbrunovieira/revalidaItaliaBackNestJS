// src/domain/assessment/application/dtos/submit-attempt-response.dto.ts

export interface SubmitAttemptResponse {
  attempt: {
    id: string;
    status: 'SUBMITTED' | 'GRADED';
    score?: number;
    startedAt: Date;
    submittedAt: Date;
    gradedAt?: Date;
    timeLimitExpiresAt?: Date;
    identityId: string;
    assessmentId: string;
    createdAt: Date;
    updatedAt: Date;
  };
  summary: {
    totalQuestions: number;
    answeredQuestions: number;
    correctAnswers?: number; // Apenas para questões de múltipla escolha
    scorePercentage?: number; // Apenas quando há score calculado
  };
}
