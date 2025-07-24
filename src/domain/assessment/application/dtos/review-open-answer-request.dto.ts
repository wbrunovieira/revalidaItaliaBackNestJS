// src/domain/assessment/application/dtos/review-open-answer-request.dto.ts

export interface ReviewOpenAnswerRequest {
  attemptAnswerId: string; // UUID da resposta da tentativa
  reviewerId: string; // UUID do tutor/admin que está revisando
  isCorrect: boolean; // Se a resposta está correta ou não
  teacherComment?: string; // Comentário opcional do professor
}
