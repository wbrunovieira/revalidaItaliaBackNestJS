// src/domain/flashcard/application/use-cases/errors/flashcard-not-found-error.ts
export class FlashcardNotFoundError extends Error {
  constructor(id: string) {
    super(`Flashcard with ID "${id}" not found`);
    this.name = 'FlashcardNotFoundError';
  }
}
