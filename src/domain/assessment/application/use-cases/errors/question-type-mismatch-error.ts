// src/domain/assessment/application/use-cases/errors/question-type-mismatch-error.ts

export class QuestionTypeMismatchError extends Error {
  constructor(assessmentType: string, recommendedQuestionType: string) {
    super(
      `Question type mismatch: ${assessmentType} assessments work best with ${recommendedQuestionType} questions`,
    );
    this.name = 'QuestionTypeMismatchError';
  }
}
