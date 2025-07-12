// src/domain/assessment/application/dtos/create-argument-request.dto.ts
export interface CreateArgumentRequest {
  title: string;
  assessmentId?: string; // Opcional - permite criar argumentos sem assessment
}
