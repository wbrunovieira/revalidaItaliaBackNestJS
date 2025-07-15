export class FlashcardTagNotFoundError extends Error {
  constructor() {
    super('FlashcardTag not found');
    this.name = 'FlashcardTagNotFoundError';
  }
}