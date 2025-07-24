// src/domain/assessment/application/dtos/submit-answer-request.dto.ts

export interface SubmitAnswerRequest {
  attemptId: string; // UUID da tentativa
  questionId: string; // UUID da questão
  selectedOptionId?: string; // UUID da opção selecionada (questões múltipla escolha)
  textAnswer?: string; // Resposta textual (questões abertas)
}
