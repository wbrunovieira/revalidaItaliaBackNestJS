// src/domain/assessment/application/dtos/create-answer-request.dto.ts

export interface CreateAnswerRequest {
  correctOptionId?: string; // Obrigatório para MULTIPLE_CHOICE, opcional para OPEN
  explanation: string; // Sempre obrigatório
  questionId: string; // UUID da questão
  translations?: Array<{
    locale: 'pt' | 'it' | 'es';
    explanation: string;
  }>; // Traduções opcionais
}
