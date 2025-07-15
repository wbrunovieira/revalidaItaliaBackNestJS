import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Either, left, right } from '@/core/either';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { PaginationParams } from '@/core/repositories/pagination-params';

import {
  IFlashcardTagRepository,
  PaginatedFlashcardTagsResult,
} from '@/domain/flashcard/application/repositories/i-flashcard-tag-repository';
import { FlashcardTag } from '@/domain/flashcard/enterprise/entities/flashcard-tag.entity';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class PrismaFlashcardTagRepository implements IFlashcardTagRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Either<Error, FlashcardTag>> {
    try {
      const tag = await this.prisma.flashcardTag.findUnique({
        where: { id },
      });

      if (!tag) {
        return left(new Error('FlashcardTag not found'));
      }

      return right(this.mapToEntity(tag));
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return left(new Error(err.message));
      }
      return left(new Error('Database error'));
    }
  }

  async findBySlug(slug: string): Promise<Either<Error, FlashcardTag>> {
    try {
      const tag = await this.prisma.flashcardTag.findUnique({
        where: { slug },
      });

      if (!tag) {
        return left(new Error('FlashcardTag not found'));
      }

      return right(this.mapToEntity(tag));
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return left(new Error(err.message));
      }
      return left(new Error('Database error'));
    }
  }

  async findByName(name: string): Promise<Either<Error, FlashcardTag>> {
    try {
      const tag = await this.prisma.flashcardTag.findFirst({
        where: { name: { equals: name, mode: 'insensitive' } },
      });

      if (!tag) {
        return left(new Error('FlashcardTag not found'));
      }

      return right(this.mapToEntity(tag));
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return left(new Error(err.message));
      }
      return left(new Error('Database error'));
    }
  }

  async findByNameContaining(
    keyword: string,
  ): Promise<Either<Error, FlashcardTag[]>> {
    try {
      const tags = await this.prisma.flashcardTag.findMany({
        where: {
          name: {
            contains: keyword,
            mode: 'insensitive',
          },
        },
        orderBy: { name: 'asc' },
      });

      return right(tags.map(this.mapToEntity));
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return left(new Error(err.message));
      }
      return left(new Error('Database error'));
    }
  }

  async findByIds(ids: string[]): Promise<Either<Error, FlashcardTag[]>> {
    try {
      const tags = await this.prisma.flashcardTag.findMany({
        where: {
          id: {
            in: ids,
          },
        },
        orderBy: { name: 'asc' },
      });

      return right(tags.map(this.mapToEntity));
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return left(new Error(err.message));
      }
      return left(new Error('Database error'));
    }
  }

  async findAll(
    params?: PaginationParams,
  ): Promise<Either<Error, FlashcardTag[]>> {
    try {
      const tags = await this.prisma.flashcardTag.findMany({
        orderBy: { name: 'asc' },
        ...(params && {
          take: params.pageSize,
          skip: (params.page - 1) * params.pageSize,
        }),
      });

      return right(tags.map(this.mapToEntity));
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return left(new Error(err.message));
      }
      return left(new Error('Database error'));
    }
  }

  async findAllPaginated(
    limit: number,
    offset: number,
  ): Promise<Either<Error, PaginatedFlashcardTagsResult>> {
    try {
      const [tags, total] = await Promise.all([
        this.prisma.flashcardTag.findMany({
          orderBy: { name: 'asc' },
          take: limit,
          skip: offset,
        }),
        this.prisma.flashcardTag.count(),
      ]);

      return right({
        tags: tags.map(this.mapToEntity),
        total,
      });
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return left(new Error(err.message));
      }
      return left(new Error('Database error'));
    }
  }

  async create(tag: FlashcardTag): Promise<Either<Error, void>> {
    try {
      await this.prisma.flashcardTag.create({
        data: {
          id: tag.id.toString(),
          name: tag.name,
          slug: tag.slug,
          createdAt: tag.createdAt,
          updatedAt: tag.updatedAt,
        },
      });

      return right(undefined);
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return left(new Error(err.message));
      }
      return left(new Error('Failed to create flashcard tag'));
    }
  }

  async update(tag: FlashcardTag): Promise<Either<Error, void>> {
    try {
      await this.prisma.flashcardTag.update({
        where: { id: tag.id.toString() },
        data: {
          name: tag.name,
          slug: tag.slug,
          updatedAt: tag.updatedAt,
        },
      });

      return right(undefined);
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return left(new Error(err.message));
      }
      return left(new Error('Failed to update flashcard tag'));
    }
  }

  async delete(id: string): Promise<Either<Error, void>> {
    try {
      await this.prisma.flashcardTag.delete({
        where: { id },
      });

      return right(undefined);
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return left(new Error(err.message));
      }
      return left(new Error('Failed to delete flashcard tag'));
    }
  }

  async checkIfNameExists(name: string): Promise<Either<Error, boolean>> {
    try {
      const tag = await this.prisma.flashcardTag.findFirst({
        where: { name: { equals: name, mode: 'insensitive' } },
        select: { id: true },
      });

      return right(!!tag);
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return left(new Error(err.message));
      }
      return left(new Error('Database error'));
    }
  }

  async checkIfSlugExists(slug: string): Promise<Either<Error, boolean>> {
    try {
      const tag = await this.prisma.flashcardTag.findUnique({
        where: { slug },
        select: { id: true },
      });

      return right(!!tag);
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return left(new Error(err.message));
      }
      return left(new Error('Database error'));
    }
  }

  async count(): Promise<Either<Error, number>> {
    try {
      const count = await this.prisma.flashcardTag.count();
      return right(count);
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return left(new Error(err.message));
      }
      return left(new Error('Database error'));
    }
  }

  private mapToEntity = (tag: any): FlashcardTag => {
    return FlashcardTag.reconstruct(
      {
        name: tag.name,
        slug: tag.slug,
        createdAt: tag.createdAt,
        updatedAt: tag.updatedAt,
      },
      new UniqueEntityID(tag.id),
    );
  };
}
