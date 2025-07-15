import { Either } from '@/core/either';
import { PaginationParams } from '@/core/repositories/pagination-params';
import { Flashcard } from '../../enterprise/entities/flashcard.entity';

export interface PaginatedFlashcardsResult {
  flashcards: Flashcard[];
  total: number;
}

export abstract class IFlashcardRepository {
  abstract findById(id: string): Promise<Either<Error, Flashcard>>;
  abstract findBySlug(slug: string): Promise<Either<Error, Flashcard>>;
  abstract findByArgumentId(argumentId: string): Promise<Either<Error, Flashcard[]>>;
  abstract findByTagIds(tagIds: string[]): Promise<Either<Error, Flashcard[]>>;
  abstract findByImportBatchId(batchId: string): Promise<Either<Error, Flashcard[]>>;
  abstract findByQuestionContent(content: string): Promise<Either<Error, Flashcard[]>>;
  abstract findByAnswerContent(content: string): Promise<Either<Error, Flashcard[]>>;
  abstract findAll(params?: PaginationParams): Promise<Either<Error, Flashcard[]>>;
  abstract findAllPaginated(
    limit: number,
    offset: number,
  ): Promise<Either<Error, PaginatedFlashcardsResult>>;
  abstract findAllByArgumentIdPaginated(
    argumentId: string,
    limit: number,
    offset: number,
  ): Promise<Either<Error, PaginatedFlashcardsResult>>;
  abstract create(flashcard: Flashcard): Promise<Either<Error, void>>;
  abstract createMany(flashcards: Flashcard[]): Promise<Either<Error, void>>;
  abstract update(flashcard: Flashcard): Promise<Either<Error, void>>;
  abstract delete(id: string): Promise<Either<Error, void>>;
  abstract countByArgumentId(argumentId: string): Promise<Either<Error, number>>;
  abstract countByTagIds(tagIds: string[]): Promise<Either<Error, number>>;
}