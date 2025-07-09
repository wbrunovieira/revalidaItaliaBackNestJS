// src/domain/course-catalog/application/use-cases/errors/invalid-input-error.ts
export class InvalidInputError extends Error {
  public readonly details: any;
  constructor(message: string, details?: any) {
    super(message);
    this.details = details;
  }
}
