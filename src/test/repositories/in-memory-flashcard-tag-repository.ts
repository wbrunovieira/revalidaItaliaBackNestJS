import { Either, left, right } from '@/core/either';
import { PaginationParams } from '@/core/repositories/pagination-params';
import {
  IFlashcardTagRepository,
  PaginatedFlashcardTagsResult,
} from '@/domain/flashcard/application/repositories/i-flashcard-tag-repository';
import { FlashcardTag } from '@/domain/flashcard/enterprise/entities/flashcard-tag.entity';

export class InMemoryFlashcardTagRepository implements IFlashcardTagRepository {
  public items: FlashcardTag[] = [];

  async findById(id: string): Promise<Either<Error, FlashcardTag>> {
    const tag = this.items.find((item) => item.id.toString() === id);

    if (!tag) {
      return left(new Error('FlashcardTag not found'));
    }

    return right(tag);
  }

  async findBySlug(slug: string): Promise<Either<Error, FlashcardTag>> {
    const tag = this.items.find((item) => item.slug === slug);

    if (!tag) {
      return left(new Error('FlashcardTag not found'));
    }

    return right(tag);
  }

  async findByName(name: string): Promise<Either<Error, FlashcardTag>> {
    const tag = this.items.find((item) => item.name.toLowerCase() === name.toLowerCase());

    if (!tag) {
      return left(new Error('FlashcardTag not found'));
    }

    return right(tag);
  }

  async findByNameContaining(keyword: string): Promise<Either<Error, FlashcardTag[]>> {
    const searchTerm = keyword.toLowerCase();
    const tags = this.items
      .filter((item) => item.name.toLowerCase().includes(searchTerm))
      .sort((a, b) => a.name.localeCompare(b.name));

    return right(tags);
  }

  async findByIds(ids: string[]): Promise<Either<Error, FlashcardTag[]>> {
    const tags = this.items
      .filter((item) => ids.includes(item.id.toString()))
      .sort((a, b) => a.name.localeCompare(b.name));

    return right(tags);
  }

  async findAll(params?: PaginationParams): Promise<Either<Error, FlashcardTag[]>> {
    let tags = this.items.sort((a, b) => a.name.localeCompare(b.name));

    if (params) {
      const start = (params.page - 1) * params.pageSize;
      const end = start + params.pageSize;
      tags = tags.slice(start, end);
    }

    return right(tags);
  }

  async findAllPaginated(
    limit: number,
    offset: number,
  ): Promise<Either<Error, PaginatedFlashcardTagsResult>> {
    const sorted = this.items.sort((a, b) => a.name.localeCompare(b.name));
    const tags = sorted.slice(offset, offset + limit);

    return right({
      tags,
      total: this.items.length,
    });
  }

  async create(tag: FlashcardTag): Promise<Either<Error, void>> {
    this.items.push(tag);
    return right(undefined);
  }

  async update(tag: FlashcardTag): Promise<Either<Error, void>> {
    const index = this.items.findIndex((item) => item.id.equals(tag.id));

    if (index < 0) {
      return left(new Error('FlashcardTag not found'));
    }

    this.items[index] = tag;
    return right(undefined);
  }

  async delete(id: string): Promise<Either<Error, void>> {
    const index = this.items.findIndex((item) => item.id.toString() === id);

    if (index < 0) {
      return left(new Error('FlashcardTag not found'));
    }

    this.items.splice(index, 1);
    return right(undefined);
  }

  async checkIfNameExists(name: string): Promise<Either<Error, boolean>> {
    const exists = this.items.some((item) => item.name.toLowerCase() === name.toLowerCase());
    return right(exists);
  }

  async checkIfSlugExists(slug: string): Promise<Either<Error, boolean>> {
    const exists = this.items.some((item) => item.slug === slug);
    return right(exists);
  }

  async count(): Promise<Either<Error, number>> {
    return right(this.items.length);
  }
}