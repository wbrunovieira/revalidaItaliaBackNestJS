// src/domain/assessment/application/dtos/update-assessment-request.dto.ts
export interface UpdateAssessmentRequest {
  id: string;
  title?: string;
  description?: string;
  type?: 'QUIZ' | 'SIMULADO' | 'PROVA_ABERTA';
  quizPosition?: 'BEFORE_LESSON' | 'AFTER_LESSON';
  passingScore?: number;
  timeLimitInMinutes?: number;
  randomizeQuestions?: boolean;
  randomizeOptions?: boolean;
  lessonId?: string | null;
}
