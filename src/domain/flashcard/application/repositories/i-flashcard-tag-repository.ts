import { Either } from '@/core/either';
import { PaginationParams } from '@/core/repositories/pagination-params';
import { FlashcardTag } from '../../enterprise/entities/flashcard-tag.entity';

export interface PaginatedFlashcardTagsResult {
  tags: FlashcardTag[];
  total: number;
}

export abstract class IFlashcardTagRepository {
  abstract findById(id: string): Promise<Either<Error, FlashcardTag>>;
  abstract findBySlug(slug: string): Promise<Either<Error, FlashcardTag>>;
  abstract findByName(name: string): Promise<Either<Error, FlashcardTag>>;
  abstract findByNameContaining(
    keyword: string,
  ): Promise<Either<Error, FlashcardTag[]>>;
  abstract findByIds(ids: string[]): Promise<Either<Error, FlashcardTag[]>>;
  abstract findAll(
    params?: PaginationParams,
  ): Promise<Either<Error, FlashcardTag[]>>;
  abstract findAllPaginated(
    limit: number,
    offset: number,
  ): Promise<Either<Error, PaginatedFlashcardTagsResult>>;
  abstract create(tag: FlashcardTag): Promise<Either<Error, void>>;
  abstract update(tag: FlashcardTag): Promise<Either<Error, void>>;
  abstract delete(id: string): Promise<Either<Error, void>>;
  abstract checkIfNameExists(name: string): Promise<Either<Error, boolean>>;
  abstract checkIfSlugExists(slug: string): Promise<Either<Error, boolean>>;
  abstract count(): Promise<Either<Error, number>>;
}
