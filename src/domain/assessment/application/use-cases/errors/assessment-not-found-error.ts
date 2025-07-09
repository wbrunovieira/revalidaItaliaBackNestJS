// src/domain/assessment/application/use-cases/errors/assessment-not-found-error.ts
export class AssessmentNotFoundError extends Error {
  constructor() {
    super('Assessment not found');
  }
}
