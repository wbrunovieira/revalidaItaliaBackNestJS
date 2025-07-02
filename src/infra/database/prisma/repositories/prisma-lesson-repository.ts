// src/infra/course-catalog/database/prisma/repositories/prisma-lesson-repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { Either, left, right } from '@/core/either';
import {
  ILessonRepository,
  PaginatedLessonsResult,
} from '@/domain/course-catalog/application/repositories/i-lesson-repository';
import { Lesson } from '@/domain/course-catalog/enterprise/entities/lesson.entity';
import {
  LessonDependencyInfo,
  LessonDependency,
} from '@/domain/course-catalog/application/dtos/lesson-dependencies.dto';
import { UniqueEntityID } from '@/core/unique-entity-id';

@Injectable()
export class PrismaLessonRepository implements ILessonRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(lesson: Lesson): Promise<Either<Error, undefined>> {
    try {
      await this.prisma.lesson.create({
        data: {
          id: lesson.id.toString(),
          moduleId: lesson.moduleId,
          imageUrl: lesson.imageUrl ?? undefined,
          videoId: lesson.videoId ?? null,
          flashcardIds: lesson.flashcardIds,
          quizIds: lesson.quizIds,
          commentIds: lesson.commentIds,
          createdAt: lesson.createdAt,
          updatedAt: lesson.updatedAt,
          translations: {
            create: lesson.translations.map((t) => ({
              id: new UniqueEntityID().toString(),
              locale: t.locale,
              title: t.title,
              description: t.description ?? null,
            })),
          },
        },
      });
      return right(undefined);
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return left(new Error(err.message));
      }
      return left(err);
    }
  }

  async findById(id: string): Promise<Either<Error, Lesson>> {
    try {
      const row = await this.prisma.lesson.findUnique({
        where: { id },
        include: {
          translations: true,
          Video: {
            include: {
              translations: true,
            },
          },
        },
      });
      if (!row) return left(new Error('Lesson not found'));

      // Mapear os vídeos se existirem
      const videoData =
        row.Video.length > 0
          ? {
              id: row.Video[0].id,
              slug: row.Video[0].slug,
              imageUrl: row.Video[0].imageUrl ?? undefined,
              providerVideoId: row.Video[0].providerVideoId,
              durationInSeconds: row.Video[0].durationInSeconds,
              isSeen: row.Video[0].isSeen,
              translations: row.Video[0].translations.map((t) => ({
                locale: t.locale as any,
                title: t.title,
                description: t.description ?? undefined,
              })),
              createdAt: row.Video[0].createdAt,
              updatedAt: row.Video[0].updatedAt,
            }
          : undefined;

      const lesson = Lesson.reconstruct(
        {
          moduleId: row.moduleId,
          videoId: row.videoId ?? undefined,
          imageUrl: row.imageUrl ?? undefined,
          flashcardIds: row.flashcardIds,
          quizIds: row.quizIds,
          commentIds: row.commentIds,
          translations: row.translations.map((t) => ({
            locale: t.locale as any,
            title: t.title,
            description: t.description ?? undefined,
          })),
          video: videoData,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        },
        new UniqueEntityID(row.id),
      );

      return right(lesson);
    } catch (err: any) {
      return left(new Error(err.message));
    }
  }

  async findByModuleId(
    moduleId: string,
    limit: number,
    offset: number,
  ): Promise<Either<Error, PaginatedLessonsResult>> {
    try {
      // Get both the lessons and the total count
      const [rows, total] = await Promise.all([
        this.prisma.lesson.findMany({
          where: { moduleId },
          include: {
            translations: true,
            Video: {
              include: {
                translations: true,
              },
            },
          },
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'asc' },
        }),
        this.prisma.lesson.count({
          where: { moduleId },
        }),
      ]);

      const lessons = rows.map((row) => {
        // Mapear os vídeos se existirem
        const videoData =
          row.Video.length > 0
            ? {
                id: row.Video[0].id,
                slug: row.Video[0].slug,
                imageUrl: row.Video[0].imageUrl ?? undefined,
                providerVideoId: row.Video[0].providerVideoId,
                durationInSeconds: row.Video[0].durationInSeconds,
                isSeen: row.Video[0].isSeen,
                translations: row.Video[0].translations.map((t) => ({
                  locale: t.locale as any,
                  title: t.title,
                  description: t.description ?? undefined,
                })),
                createdAt: row.Video[0].createdAt,
                updatedAt: row.Video[0].updatedAt,
              }
            : undefined;

        return Lesson.reconstruct(
          {
            moduleId: row.moduleId,
            videoId: row.videoId ?? undefined,
            imageUrl: row.imageUrl ?? undefined,
            flashcardIds: row.flashcardIds,
            quizIds: row.quizIds,
            commentIds: row.commentIds,
            translations: row.translations.map((t) => ({
              locale: t.locale as any,
              title: t.title,
              description: t.description ?? undefined,
            })),
            video: videoData,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
          },
          new UniqueEntityID(row.id),
        );
      });

      return right({ lessons, total });
    } catch (err: any) {
      return left(new Error(err.message));
    }
  }

  async checkLessonDependencies(
    lessonId: string,
  ): Promise<Either<Error, LessonDependencyInfo>> {
    try {
      // Verificar se a lição existe e buscar suas dependências
      const lesson = await this.prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
          Video: {
            include: {
              translations: true,
            },
          },
          documents: {
            include: {
              translations: true,
            },
          },
        },
      });

      if (!lesson) {
        return left(new Error('Lesson not found'));
      }

      const dependencies: LessonDependency[] = [];

      // Adicionar vídeos como dependências
      for (const video of lesson.Video) {
        dependencies.push({
          type: 'video',
          id: video.id,
          name: video.slug,
          relatedEntities: {
            translations: video.translations.length,
          },
        });
      }

      // Adicionar documentos como dependências
      for (const doc of lesson.documents) {
        const ptTranslation = doc.translations.find((t) => t.locale === 'pt');
        const docName =
          doc.filename || ptTranslation?.title || `Document ${doc.id}`;

        dependencies.push({
          type: 'document',
          id: doc.id,
          name: docName,
          relatedEntities: {
            translations: doc.translations.length,
          },
        });
      }

      // Adicionar flashcards (apenas contagem, pois são IDs)
      for (const flashcardId of lesson.flashcardIds) {
        dependencies.push({
          type: 'flashcard',
          id: flashcardId,
          name: `Flashcard ${flashcardId}`,
        });
      }

      // Adicionar quizzes (apenas contagem, pois são IDs)
      for (const quizId of lesson.quizIds) {
        dependencies.push({
          type: 'quiz',
          id: quizId,
          name: `Quiz ${quizId}`,
        });
      }

      // Adicionar comentários (apenas contagem, pois são IDs)
      for (const commentId of lesson.commentIds) {
        dependencies.push({
          type: 'comment',
          id: commentId,
          name: `Comment ${commentId}`,
        });
      }

      const canDelete = dependencies.length === 0;

      return right({
        canDelete,
        totalDependencies: dependencies.length,
        summary: {
          videos: lesson.Video.length,
          documents: lesson.documents.length,
          flashcards: lesson.flashcardIds.length,
          quizzes: lesson.quizIds.length,
          comments: lesson.commentIds.length,
        },
        dependencies,
      });
    } catch (err: any) {
      return left(new Error(`Failed to check dependencies: ${err.message}`));
    }
  }

  async delete(lessonId: string): Promise<Either<Error, void>> {
    try {
      // Usar transação para garantir atomicidade
      await this.prisma.$transaction(async (tx) => {
        // Verificar se a lição existe
        const lessonExists = await tx.lesson.findUnique({
          where: { id: lessonId },
        });

        if (!lessonExists) {
          throw new Error('Lesson not found');
        }

        // Deletar traduções da lição
        await tx.lessonTranslation.deleteMany({
          where: { lessonId },
        });

        // Deletar traduções dos documentos
        await tx.lessonDocumentTranslation.deleteMany({
          where: {
            document: {
              lessonId,
            },
          },
        });

        // Deletar documentos da lição
        await tx.lessonDocument.deleteMany({
          where: { lessonId },
        });

        // Deletar a lição
        await tx.lesson.delete({
          where: { id: lessonId },
        });
      });

      return right(undefined);
    } catch (err: any) {
      if (err.message === 'Lesson not found') {
        return left(new Error('Lesson not found'));
      }
      return left(new Error(`Failed to delete lesson: ${err.message}`));
    }
  }
}
