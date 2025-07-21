// src/domain/assessment/application/dtos/start-attempt-request.dto.ts

export interface StartAttemptRequest {
  identityId: string; // UUID da identidade do usuário
  assessmentId: string; // UUID do assessment
}
