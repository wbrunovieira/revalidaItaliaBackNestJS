import { Either } from '@/core/either';
import { DuplicateFlashcardTagError } from '../use-cases/errors/duplicate-flashcard-tag-error';
import { InvalidInputError } from '../use-cases/errors/invalid-input-error';

export interface FlashcardTagResponseObject {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateFlashcardTagResponse = Either<
  InvalidInputError | DuplicateFlashcardTagError,
  {
    flashcardTag: FlashcardTagResponseObject;
  }
>;