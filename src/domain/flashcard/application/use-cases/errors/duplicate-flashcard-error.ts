// src/domain/flashcard/application/use-cases/errors/duplicate-flashcard-error.ts

export class DuplicateFlashcardError extends Error {
  constructor(slug: string) {
    super(`Flashcard with slug "${slug}" already exists`);
    this.name = 'DuplicateFlashcardError';
  }
}