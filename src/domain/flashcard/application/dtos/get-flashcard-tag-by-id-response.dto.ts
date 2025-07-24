import { Either } from '@/core/either';
import { InvalidInputError } from '../use-cases/errors/invalid-input-error';
import { FlashcardTagNotFoundError } from '../use-cases/errors/flashcard-tag-not-found-error';
import { FlashcardTagResponseObject } from './create-flashcard-tag-response.dto';

export type GetFlashcardTagByIdResponse = Either<
  InvalidInputError | FlashcardTagNotFoundError,
  {
    flashcardTag: FlashcardTagResponseObject;
  }
>;
