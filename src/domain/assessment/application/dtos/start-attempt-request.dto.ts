// src/domain/assessment/application/dtos/start-attempt-request.dto.ts

export interface StartAttemptRequest {
  userId: string; // UUID do usuário
  assessmentId: string; // UUID do assessment
}
