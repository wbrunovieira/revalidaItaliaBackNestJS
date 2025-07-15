// src/domain/flashcard/application/use-cases/errors/flashcard-tags-not-found-error.ts

export class FlashcardTagsNotFoundError extends Error {
  constructor(tagIds: string[]) {
    super(`Flashcard tags with IDs "${tagIds.join(', ')}" not found`);
    this.name = 'FlashcardTagsNotFoundError';
  }
}