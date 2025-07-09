// src/domain/assessment/application/use-cases/errors/duplicate-assessment-error.ts
export class DuplicateAssessmentError extends Error {
  constructor() {
    super('Assessment with this title already exists');
  }
}
