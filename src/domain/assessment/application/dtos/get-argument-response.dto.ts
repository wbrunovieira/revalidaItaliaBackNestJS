// src/domain/assessment/application/dtos/get-argument-response.dto.ts
export interface GetArgumentResponse {
  argument: {
    id: string;
    title: string;
    assessmentId?: string;
    createdAt: Date;
    updatedAt: Date;
  };
}
