// src/domain/flashcard/application/use-cases/errors/argument-not-found-error.ts

export class ArgumentNotFoundError extends Error {
  constructor(argumentId: string) {
    super(`Argument with ID "${argumentId}" not found`);
    this.name = 'ArgumentNotFoundError';
  }
}
