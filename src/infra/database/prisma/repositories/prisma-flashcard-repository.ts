import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Either, left, right } from '@/core/either';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { PaginationParams } from '@/core/repositories/pagination-params';

import {
  IFlashcardRepository,
  PaginatedFlashcardsResult,
} from '@/domain/flashcard/application/repositories/i-flashcard-repository';
import { Flashcard } from '@/domain/flashcard/enterprise/entities/flashcard.entity';
import { FlashcardContentVO } from '@/domain/flashcard/enterprise/value-objects/flashcard-content.vo';
import { FlashcardContentTypeVO } from '@/domain/flashcard/enterprise/value-objects/flashcard-content-type.vo';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class PrismaFlashcardRepository implements IFlashcardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Either<Error, Flashcard>> {
    try {
      const flashcard = await this.prisma.flashcard.findUnique({
        where: { id },
        include: {
          tags: true,
        },
      });

      if (!flashcard) {
        return left(new Error('Flashcard not found'));
      }

      return right(this.mapToEntity(flashcard));
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return left(new Error(err.message));
      }
      return left(new Error('Database error'));
    }
  }

  async findBySlug(slug: string): Promise<Either<Error, Flashcard>> {
    try {
      const flashcard = await this.prisma.flashcard.findUnique({
        where: { slug },
        include: {
          tags: true,
        },
      });

      if (!flashcard) {
        return left(new Error('Flashcard not found'));
      }

      return right(this.mapToEntity(flashcard));
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return left(new Error(err.message));
      }
      return left(new Error('Database error'));
    }
  }

  async findByArgumentId(
    argumentId: string,
  ): Promise<Either<Error, Flashcard[]>> {
    try {
      const flashcards = await this.prisma.flashcard.findMany({
        where: { argumentId },
        include: {
          tags: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      return right(flashcards.map(this.mapToEntity));
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return left(new Error(err.message));
      }
      return left(new Error('Database error'));
    }
  }

  async findByTagIds(tagIds: string[]): Promise<Either<Error, Flashcard[]>> {
    try {
      const flashcards = await this.prisma.flashcard.findMany({
        where: {
          tags: {
            some: {
              id: {
                in: tagIds,
              },
            },
          },
        },
        include: {
          tags: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      return right(flashcards.map(this.mapToEntity));
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return left(new Error(err.message));
      }
      return left(new Error('Database error'));
    }
  }

  async findByImportBatchId(
    batchId: string,
  ): Promise<Either<Error, Flashcard[]>> {
    try {
      const flashcards = await this.prisma.flashcard.findMany({
        where: { importBatchId: batchId },
        include: {
          tags: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      return right(flashcards.map(this.mapToEntity));
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return left(new Error(err.message));
      }
      return left(new Error('Database error'));
    }
  }

  async findByQuestionContent(
    content: string,
  ): Promise<Either<Error, Flashcard[]>> {
    try {
      const flashcards = await this.prisma.flashcard.findMany({
        where: {
          OR: [
            { questionText: { contains: content, mode: 'insensitive' } },
            { questionImageUrl: { contains: content, mode: 'insensitive' } },
          ],
        },
        include: {
          tags: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return right(flashcards.map(this.mapToEntity));
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return left(new Error(err.message));
      }
      return left(new Error('Database error'));
    }
  }

  async findByAnswerContent(
    content: string,
  ): Promise<Either<Error, Flashcard[]>> {
    try {
      const flashcards = await this.prisma.flashcard.findMany({
        where: {
          OR: [
            { answerText: { contains: content, mode: 'insensitive' } },
            { answerImageUrl: { contains: content, mode: 'insensitive' } },
          ],
        },
        include: {
          tags: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return right(flashcards.map(this.mapToEntity));
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return left(new Error(err.message));
      }
      return left(new Error('Database error'));
    }
  }

  async findAll(
    params?: PaginationParams,
  ): Promise<Either<Error, Flashcard[]>> {
    try {
      const flashcards = await this.prisma.flashcard.findMany({
        include: {
          tags: true,
        },
        orderBy: { createdAt: 'desc' },
        ...(params && {
          take: params.pageSize,
          skip: (params.page - 1) * params.pageSize,
        }),
      });

      return right(flashcards.map(this.mapToEntity));
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
  ): Promise<Either<Error, PaginatedFlashcardsResult>> {
    try {
      const [flashcards, total] = await Promise.all([
        this.prisma.flashcard.findMany({
          include: {
            tags: true,
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        this.prisma.flashcard.count(),
      ]);

      return right({
        flashcards: flashcards.map(this.mapToEntity),
        total,
      });
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return left(new Error(err.message));
      }
      return left(new Error('Database error'));
    }
  }

  async findAllByArgumentIdPaginated(
    argumentId: string,
    limit: number,
    offset: number,
  ): Promise<Either<Error, PaginatedFlashcardsResult>> {
    try {
      const [flashcards, total] = await Promise.all([
        this.prisma.flashcard.findMany({
          where: { argumentId },
          include: {
            tags: true,
          },
          orderBy: { createdAt: 'asc' },
          take: limit,
          skip: offset,
        }),
        this.prisma.flashcard.count({
          where: { argumentId },
        }),
      ]);

      return right({
        flashcards: flashcards.map(this.mapToEntity),
        total,
      });
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return left(new Error(err.message));
      }
      return left(new Error('Database error'));
    }
  }

  async create(flashcard: Flashcard): Promise<Either<Error, void>> {
    try {
      await this.prisma.flashcard.create({
        data: {
          id: flashcard.id.toString(),
          slug: flashcard.slug,
          questionText: flashcard.question.isText()
            ? flashcard.question.getContent()
            : null,
          questionImageUrl: flashcard.question.isImage()
            ? flashcard.question.getContent()
            : null,
          questionType: flashcard.question.getType().getValue(),
          answerText: flashcard.answer.isText()
            ? flashcard.answer.getContent()
            : null,
          answerImageUrl: flashcard.answer.isImage()
            ? flashcard.answer.getContent()
            : null,
          answerType: flashcard.answer.getType().getValue(),
          argumentId: flashcard.argumentId.toString(),
          importBatchId: flashcard.importBatchId,
          exportedAt: flashcard.exportedAt,
          createdAt: flashcard.createdAt,
          updatedAt: flashcard.updatedAt,
          tags: {
            connect: flashcard.tagIds.map((tagId) => ({
              id: tagId.toString(),
            })),
          },
        },
      });

      return right(undefined);
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return left(new Error(err.message));
      }
      return left(new Error('Failed to create flashcard'));
    }
  }

  async createMany(flashcards: Flashcard[]): Promise<Either<Error, void>> {
    try {
      await this.prisma.$transaction(async (tx) => {
        for (const flashcard of flashcards) {
          await tx.flashcard.create({
            data: {
              id: flashcard.id.toString(),
              slug: flashcard.slug,
              questionText: flashcard.question.isText()
                ? flashcard.question.getContent()
                : null,
              questionImageUrl: flashcard.question.isImage()
                ? flashcard.question.getContent()
                : null,
              questionType: flashcard.question.getType().getValue(),
              answerText: flashcard.answer.isText()
                ? flashcard.answer.getContent()
                : null,
              answerImageUrl: flashcard.answer.isImage()
                ? flashcard.answer.getContent()
                : null,
              answerType: flashcard.answer.getType().getValue(),
              argumentId: flashcard.argumentId.toString(),
              importBatchId: flashcard.importBatchId,
              exportedAt: flashcard.exportedAt,
              createdAt: flashcard.createdAt,
              updatedAt: flashcard.updatedAt,
              tags: {
                connect: flashcard.tagIds.map((tagId) => ({
                  id: tagId.toString(),
                })),
              },
            },
          });
        }
      });

      return right(undefined);
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return left(new Error(err.message));
      }
      return left(new Error('Failed to create flashcards'));
    }
  }

  async update(flashcard: Flashcard): Promise<Either<Error, void>> {
    try {
      await this.prisma.flashcard.update({
        where: { id: flashcard.id.toString() },
        data: {
          slug: flashcard.slug,
          questionText: flashcard.question.isText()
            ? flashcard.question.getContent()
            : null,
          questionImageUrl: flashcard.question.isImage()
            ? flashcard.question.getContent()
            : null,
          questionType: flashcard.question.getType().getValue(),
          answerText: flashcard.answer.isText()
            ? flashcard.answer.getContent()
            : null,
          answerImageUrl: flashcard.answer.isImage()
            ? flashcard.answer.getContent()
            : null,
          answerType: flashcard.answer.getType().getValue(),
          argumentId: flashcard.argumentId.toString(),
          importBatchId: flashcard.importBatchId,
          exportedAt: flashcard.exportedAt,
          updatedAt: flashcard.updatedAt,
          tags: {
            set: flashcard.tagIds.map((tagId) => ({ id: tagId.toString() })),
          },
        },
      });

      return right(undefined);
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return left(new Error(err.message));
      }
      return left(new Error('Failed to update flashcard'));
    }
  }

  async delete(id: string): Promise<Either<Error, void>> {
    try {
      await this.prisma.flashcard.delete({
        where: { id },
      });

      return right(undefined);
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return left(new Error(err.message));
      }
      return left(new Error('Failed to delete flashcard'));
    }
  }

  async countByArgumentId(argumentId: string): Promise<Either<Error, number>> {
    try {
      const count = await this.prisma.flashcard.count({
        where: { argumentId },
      });

      return right(count);
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return left(new Error(err.message));
      }
      return left(new Error('Database error'));
    }
  }

  async countByTagIds(tagIds: string[]): Promise<Either<Error, number>> {
    try {
      const count = await this.prisma.flashcard.count({
        where: {
          tags: {
            some: {
              id: {
                in: tagIds,
              },
            },
          },
        },
      });

      return right(count);
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return left(new Error(err.message));
      }
      return left(new Error('Database error'));
    }
  }

  private mapToEntity = (flashcard: any): Flashcard => {
    const question =
      flashcard.questionType === 'TEXT'
        ? FlashcardContentVO.createText(flashcard.questionText)
        : FlashcardContentVO.createImage(flashcard.questionImageUrl);

    const answer =
      flashcard.answerType === 'TEXT'
        ? FlashcardContentVO.createText(flashcard.answerText)
        : FlashcardContentVO.createImage(flashcard.answerImageUrl);

    return Flashcard.reconstruct(
      {
        slug: flashcard.slug,
        question,
        answer,
        argumentId: new UniqueEntityID(flashcard.argumentId),
        tagIds:
          flashcard.tags?.map((tag: any) => new UniqueEntityID(tag.id)) ?? [],
        importBatchId: flashcard.importBatchId ?? undefined,
        exportedAt: flashcard.exportedAt ?? undefined,
        createdAt: flashcard.createdAt,
        updatedAt: flashcard.updatedAt,
      },
      new UniqueEntityID(flashcard.id),
    );
  };
}
