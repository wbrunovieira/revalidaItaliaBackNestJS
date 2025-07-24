export class DuplicateFlashcardTagError extends Error {
  constructor() {
    super('FlashcardTag with this name already exists');
    this.name = 'DuplicateFlashcardTagError';
  }
}
