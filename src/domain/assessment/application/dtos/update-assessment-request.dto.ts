// src/domain/assessment/application/dtos/update-assessment-request.dto.ts
export interface UpdateAssessmentRequest {
  id: string;
  title?: string | null;
  description?: string | null;
  type?: 'QUIZ' | 'SIMULADO' | 'PROVA_ABERTA' | null;
  quizPosition?: 'BEFORE_LESSON' | 'AFTER_LESSON' | null;
  passingScore?: number | null;
  timeLimitInMinutes?: number | null;
  randomizeQuestions?: boolean | null;
  randomizeOptions?: boolean | null;
  lessonId?: string | null;
}
