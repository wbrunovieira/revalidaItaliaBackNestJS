// src/domain/assessment/application/use-cases/errors/argument-not-found-error.ts
export class ArgumentNotFoundError extends Error {
  constructor(message: string = 'Argument not found') {
    super(message);
  }
}