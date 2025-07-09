// src/domain/assessment/application/use-cases/errors/invalid-input-error.ts
export class InvalidInputError extends Error {
  constructor(
    message: string,
    public readonly details: string[] = [],
  ) {
    super(message);
  }
}
