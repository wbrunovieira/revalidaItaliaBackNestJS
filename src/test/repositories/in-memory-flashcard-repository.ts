import { Either, left, right } from '@/core/either';
import { PaginationParams } from '@/core/repositories/pagination-params';
import {
  IFlashcardRepository,
  PaginatedFlashcardsResult,
} from '@/domain/flashcard/application/repositories/i-flashcard-repository';
import { Flashcard } from '@/domain/flashcard/enterprise/entities/flashcard.entity';

export class InMemoryFlashcardRepository implements IFlashcardRepository {
  public items: Flashcard[] = [];

  async findById(id: string): Promise<Either<Error, Flashcard>> {
    const flashcard = this.items.find((item) => item.id.toString() === id);

    if (!flashcard) {
      return left(new Error('Flashcard not found'));
    }

    return right(flashcard);
  }

  async findBySlug(slug: string): Promise<Either<Error, Flashcard>> {
    const flashcard = this.items.find((item) => item.slug === slug);

    if (!flashcard) {
      return left(new Error('Flashcard not found'));
    }

    return right(flashcard);
  }

  async findByArgumentId(argumentId: string): Promise<Either<Error, Flashcard[]>> {
    const flashcards = this.items
      .filter((item) => item.argumentId.toString() === argumentId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    return right(flashcards);
  }

  async findByTagIds(tagIds: string[]): Promise<Either<Error, Flashcard[]>> {
    const flashcards = this.items
      .filter((item) => 
        item.tagIds.some((tagId) => tagIds.includes(tagId.toString()))
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    return right(flashcards);
  }

  async findByImportBatchId(batchId: string): Promise<Either<Error, Flashcard[]>> {
    const flashcards = this.items
      .filter((item) => item.importBatchId === batchId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    return right(flashcards);
  }

  async findByQuestionContent(content: string): Promise<Either<Error, Flashcard[]>> {
    const searchTerm = content.toLowerCase();
    const flashcards = this.items
      .filter((item) => {
        const questionContent = item.question.getContent().toLowerCase();
        return questionContent.includes(searchTerm);
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return right(flashcards);
  }

  async findByAnswerContent(content: string): Promise<Either<Error, Flashcard[]>> {
    const searchTerm = content.toLowerCase();
    const flashcards = this.items
      .filter((item) => {
        const answerContent = item.answer.getContent().toLowerCase();
        return answerContent.includes(searchTerm);
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return right(flashcards);
  }

  async findAll(params?: PaginationParams): Promise<Either<Error, Flashcard[]>> {
    let flashcards = this.items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (params) {
      const start = (params.page - 1) * params.pageSize;
      const end = start + params.pageSize;
      flashcards = flashcards.slice(start, end);
    }

    return right(flashcards);
  }

  async findAllPaginated(
    limit: number,
    offset: number,
  ): Promise<Either<Error, PaginatedFlashcardsResult>> {
    const sorted = this.items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const flashcards = sorted.slice(offset, offset + limit);

    return right({
      flashcards,
      total: this.items.length,
    });
  }

  async findAllByArgumentIdPaginated(
    argumentId: string,
    limit: number,
    offset: number,
  ): Promise<Either<Error, PaginatedFlashcardsResult>> {
    const filtered = this.items
      .filter((item) => item.argumentId.toString() === argumentId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    const flashcards = filtered.slice(offset, offset + limit);

    return right({
      flashcards,
      total: filtered.length,
    });
  }

  async create(flashcard: Flashcard): Promise<Either<Error, void>> {
    this.items.push(flashcard);
    return right(undefined);
  }

  async createMany(flashcards: Flashcard[]): Promise<Either<Error, void>> {
    this.items.push(...flashcards);
    return right(undefined);
  }

  async update(flashcard: Flashcard): Promise<Either<Error, void>> {
    const index = this.items.findIndex((item) => item.id.equals(flashcard.id));

    if (index < 0) {
      return left(new Error('Flashcard not found'));
    }

    this.items[index] = flashcard;
    return right(undefined);
  }

  async delete(id: string): Promise<Either<Error, void>> {
    const index = this.items.findIndex((item) => item.id.toString() === id);

    if (index < 0) {
      return left(new Error('Flashcard not found'));
    }

    this.items.splice(index, 1);
    return right(undefined);
  }

  async countByArgumentId(argumentId: string): Promise<Either<Error, number>> {
    const count = this.items.filter((item) => item.argumentId.toString() === argumentId).length;
    return right(count);
  }

  async countByTagIds(tagIds: string[]): Promise<Either<Error, number>> {
    const count = this.items.filter((item) =>
      item.tagIds.some((tagId) => tagIds.includes(tagId.toString()))
    ).length;
    return right(count);
  }
}