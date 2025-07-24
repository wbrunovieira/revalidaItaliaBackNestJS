import { Either } from '@/core/either';
import { InvalidInputError } from '../use-cases/errors/invalid-input-error';

export interface FlashcardTagResponseObject {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ListAllFlashcardTagsResponse = Either<
  InvalidInputError,
  {
    flashcardTags: FlashcardTagResponseObject[];
  }
>;
