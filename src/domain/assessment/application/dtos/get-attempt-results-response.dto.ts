// src/domain/assessment/application/dtos/get-attempt-results-response.dto.ts

export interface ArgumentResult {
  argumentId: string;
  argumentTitle: string;
  totalQuestions: number;
  correctAnswers: number;
  scorePercentage: number;
}

export interface AttemptAnswerResult {
  id: string;
  questionId: string;
  questionText: string;
  questionType: 'MULTIPLE_CHOICE' | 'OPEN';
  argumentId?: string;
  argumentTitle?: string;
  // Para multiple choice
  selectedOptionId?: string;
  selectedOptionText?: string;
  correctOptionId?: string;
  correctOptionText?: string;
  explanation?: string;
  // Para questões abertas
  textAnswer?: string;
  teacherComment?: string;
  submittedAt?: Date;
  reviewedAt?: Date;
  // Comum
  isCorrect?: boolean;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADING' | 'GRADED';
}

export interface GetAttemptResultsResponse {
  attempt: {
    id: string;
    status: 'SUBMITTED' | 'GRADING' | 'GRADED';
    score?: number;
    startedAt: Date;
    submittedAt?: Date;
    gradedAt?: Date;
    timeLimitExpiresAt?: Date;
    userId: string;
    assessmentId: string;
  };
  assessment: {
    id: string;
    title: string;
    type: 'QUIZ' | 'SIMULADO' | 'PROVA_ABERTA';
    passingScore?: number;
    timeLimitInMinutes?: number;
  };
  results: {
    totalQuestions: number;
    answeredQuestions: number;
    correctAnswers?: number; // undefined se tiver questões pendentes
    reviewedQuestions?: number; // para PROVA_ABERTA
    pendingReview?: number; // para PROVA_ABERTA
    scorePercentage?: number;
    passed?: boolean;
    timeSpent?: number; // em minutos
    argumentResults?: ArgumentResult[]; // para SIMULADO
  };
  answers: AttemptAnswerResult[];
}