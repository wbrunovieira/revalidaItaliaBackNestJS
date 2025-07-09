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
          slug: lesson.slug,
          moduleId: lesson.moduleId,
          order: lesson.order,
          imageUrl: lesson.imageUrl ?? undefined,
          flashcardIds: lesson.flashcardIds,
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
          video: {
            include: {
              translations: true,
            },
          },
          documents: {
            include: {
              translations: true,
            },
          },
          Assessment: true,
        },
      });
      if (!row) return left(new Error('Lesson not found'));

      // Mapear o vídeo se existir (relação one-to-one)
      const videoData = row.video
        ? {
            id: row.video.id,
            slug: row.video.slug,
            imageUrl: row.video.imageUrl ?? undefined,
            providerVideoId: row.video.providerVideoId,
            durationInSeconds: row.video.durationInSeconds,
            translations: row.video.translations.map((t) => ({
              locale: t.locale as any,
              title: t.title,
              description: t.description ?? undefined,
            })),
            createdAt: row.video.createdAt,
            updatedAt: row.video.updatedAt,
          }
        : undefined;

      // Mapear documentos
      const documentsData = row.documents.map((doc) => ({
        id: doc.id,
        filename: doc.filename ?? undefined,
        translations: doc.translations.map((t) => ({
          locale: t.locale as any,
          title: t.title,
          description: t.description ?? undefined,
          url: t.url,
        })),
        createdAt: doc.createdAt,
      }));

      // Mapear assessments
      const assessmentsData = row.Assessment.map((assessment) => ({
        id: assessment.id,
        title: assessment.title,
        description: assessment.description ?? undefined,
        type: assessment.type,
        quizPosition: assessment.quizPosition ?? undefined,
        passingScore: assessment.passingScore,
        timeLimitInMinutes: assessment.timeLimitInMinutes ?? undefined,
        randomizeQuestions: assessment.randomizeQuestions,
        randomizeOptions: assessment.randomizeOptions,
        lessonId: assessment.lessonId ?? undefined,
        createdAt: assessment.createdAt,
        updatedAt: assessment.updatedAt,
      }));

      const lesson = Lesson.reconstruct(
        {
          slug: row.slug,
          moduleId: row.moduleId,
          order: row.order,
          imageUrl: row.imageUrl ?? undefined,
          flashcardIds: row.flashcardIds,
          commentIds: row.commentIds,
          translations: row.translations.map((t) => ({
            locale: t.locale as any,
            title: t.title,
            description: t.description ?? undefined,
          })),
          video: videoData,
          videos: [], // Mantido para compatibilidade
          documents: documentsData,
          assessments: assessmentsData,
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

  async findBySlug(slug: string): Promise<Either<Error, Lesson>> {
    try {
      const row = await this.prisma.lesson.findUnique({
        where: { slug },
        include: {
          translations: true,
          video: {
            include: {
              translations: true,
            },
          },
          documents: {
            include: {
              translations: true,
            },
          },
          Assessment: true,
        },
      });
      if (!row) return left(new Error('Lesson not found'));

      // Mapear o vídeo se existir (relação one-to-one)
      const videoData = row.video
        ? {
            id: row.video.id,
            slug: row.video.slug,
            imageUrl: row.video.imageUrl ?? undefined,
            providerVideoId: row.video.providerVideoId,
            durationInSeconds: row.video.durationInSeconds,
            translations: row.video.translations.map((t) => ({
              locale: t.locale as any,
              title: t.title,
              description: t.description ?? undefined,
            })),
            createdAt: row.video.createdAt,
            updatedAt: row.video.updatedAt,
          }
        : undefined;

      // Mapear documentos
      const documentsData = row.documents.map((doc) => ({
        id: doc.id,
        filename: doc.filename ?? undefined,
        translations: doc.translations.map((t) => ({
          locale: t.locale as any,
          title: t.title,
          description: t.description ?? undefined,
          url: t.url,
        })),
        createdAt: doc.createdAt,
      }));

      // Mapear assessments
      const assessmentsData = row.Assessment.map((assessment) => ({
        id: assessment.id,
        title: assessment.title,
        description: assessment.description ?? undefined,
        type: assessment.type,
        quizPosition: assessment.quizPosition ?? undefined,
        passingScore: assessment.passingScore,
        timeLimitInMinutes: assessment.timeLimitInMinutes ?? undefined,
        randomizeQuestions: assessment.randomizeQuestions,
        randomizeOptions: assessment.randomizeOptions,
        lessonId: assessment.lessonId ?? undefined,
        createdAt: assessment.createdAt,
        updatedAt: assessment.updatedAt,
      }));

      const lesson = Lesson.reconstruct(
        {
          slug: row.slug,
          moduleId: row.moduleId,
          order: row.order,
          imageUrl: row.imageUrl ?? undefined,
          flashcardIds: row.flashcardIds,
          commentIds: row.commentIds,
          translations: row.translations.map((t) => ({
            locale: t.locale as any,
            title: t.title,
            description: t.description ?? undefined,
          })),
          video: videoData,
          videos: [], // Mantido para compatibilidade
          documents: documentsData,
          assessments: assessmentsData,
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
            video: {
              include: {
                translations: true,
              },
            },
            documents: {
              include: {
                translations: true,
              },
            },
            Assessment: true,
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
        // Mapear o vídeo se existir (relação one-to-one)
        const videoData = row.video
          ? {
              id: row.video.id,
              slug: row.video.slug,
              imageUrl: row.video.imageUrl ?? undefined,
              providerVideoId: row.video.providerVideoId,
              durationInSeconds: row.video.durationInSeconds,
              translations: row.video.translations.map((t) => ({
                locale: t.locale as any,
                title: t.title,
                description: t.description ?? undefined,
              })),
              createdAt: row.video.createdAt,
              updatedAt: row.video.updatedAt,
            }
          : undefined;

        // Mapear documentos
        const documentsData = row.documents.map((doc) => ({
          id: doc.id,
          filename: doc.filename ?? undefined,
          translations: doc.translations.map((t) => ({
            locale: t.locale as any,
            title: t.title,
            description: t.description ?? undefined,
            url: t.url,
          })),
          createdAt: doc.createdAt,
        }));

        // Mapear assessments
        const assessmentsData = row.Assessment.map((assessment) => ({
          id: assessment.id,
          title: assessment.title,
          description: assessment.description ?? undefined,
          type: assessment.type,
          quizPosition: assessment.quizPosition ?? undefined,
          passingScore: assessment.passingScore,
          timeLimitInMinutes: assessment.timeLimitInMinutes ?? undefined,
          randomizeQuestions: assessment.randomizeQuestions,
          randomizeOptions: assessment.randomizeOptions,
          lessonId: assessment.lessonId ?? undefined,
          createdAt: assessment.createdAt,
          updatedAt: assessment.updatedAt,
        }));

        return Lesson.reconstruct(
          {
            slug: row.slug,
            moduleId: row.moduleId,
            order: row.order,
            imageUrl: row.imageUrl ?? undefined,
            flashcardIds: row.flashcardIds,
            commentIds: row.commentIds,
            translations: row.translations.map((t) => ({
              locale: t.locale as any,
              title: t.title,
              description: t.description ?? undefined,
            })),
            video: videoData,
            videos: [], // Mantido para compatibilidade
            documents: documentsData,
            assessments: assessmentsData,
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
          video: {
            include: {
              translations: true,
            },
          },
          documents: {
            include: {
              translations: true,
            },
          },
          Assessment: true,
        },
      });

      if (!lesson) {
        return left(new Error('Lesson not found'));
      }

      const dependencies: LessonDependency[] = [];

      // Adicionar vídeo como dependência (relação one-to-one)
      if (lesson.video) {
        dependencies.push({
          type: 'video',
          id: lesson.video.id,
          name: lesson.video.slug,
          relatedEntities: {
            translations: lesson.video.translations.length,
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

      // Adicionar assessments
      for (const assessment of lesson.Assessment) {
        dependencies.push({
          type: 'assessment',
          id: assessment.id,
          name: assessment.title,
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
          videos: lesson.video ? 1 : 0,
          documents: lesson.documents.length,
          flashcards: lesson.flashcardIds.length,
          assessments: lesson.Assessment.length,
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

  async update(lesson: Lesson): Promise<Either<Error, undefined>> {
    try {
      await this.prisma.$transaction(async (tx) => {
        // Update lesson
        await tx.lesson.update({
          where: { id: lesson.id.toString() },
          data: {
            order: lesson.order,
            imageUrl: lesson.imageUrl ?? null,
            flashcardIds: lesson.flashcardIds,
            commentIds: lesson.commentIds,
            updatedAt: lesson.updatedAt,
          },
        });

        // Delete existing translations
        await tx.lessonTranslation.deleteMany({
          where: { lessonId: lesson.id.toString() },
        });

        // Create new translations
        if (lesson.translations.length > 0) {
          await tx.lessonTranslation.createMany({
            data: lesson.translations.map((t) => ({
              id: new UniqueEntityID().toString(),
              lessonId: lesson.id.toString(),
              locale: t.locale,
              title: t.title,
              description: t.description ?? null,
            })),
          });
        }
      });

      return right(undefined);
    } catch (err: any) {
      return left(new Error(`Failed to update lesson: ${err.message}`));
    }
  }

  async findByModuleIdAndOrder(
    moduleId: string,
    order: number,
  ): Promise<Either<Error, Lesson | null>> {
    try {
      const row = await this.prisma.lesson.findFirst({
        where: {
          moduleId,
          order,
        },
        include: {
          translations: true,
          video: {
            include: {
              translations: true,
            },
          },
          documents: {
            include: {
              translations: true,
            },
          },
          Assessment: true,
        },
      });

      if (!row) {
        return right(null);
      }

      // Mapear o vídeo se existir (relação one-to-one)
      const videoData = row.video
        ? {
            id: row.video.id,
            slug: row.video.slug,
            imageUrl: row.video.imageUrl ?? undefined,
            providerVideoId: row.video.providerVideoId,
            durationInSeconds: row.video.durationInSeconds,
            translations: row.video.translations.map((t) => ({
              locale: t.locale as any,
              title: t.title,
              description: t.description ?? undefined,
            })),
            createdAt: row.video.createdAt,
            updatedAt: row.video.updatedAt,
          }
        : undefined;

      // Mapear documentos
      const documentsData = row.documents.map((doc) => ({
        id: doc.id,
        filename: doc.filename ?? undefined,
        translations: doc.translations.map((t) => ({
          locale: t.locale as any,
          title: t.title,
          description: t.description ?? undefined,
          url: t.url,
        })),
        createdAt: doc.createdAt,
      }));

      // Mapear assessments
      const assessmentsData = row.Assessment.map((assessment) => ({
        id: assessment.id,
        title: assessment.title,
        description: assessment.description ?? undefined,
        type: assessment.type,
        quizPosition: assessment.quizPosition ?? undefined,
        passingScore: assessment.passingScore,
        timeLimitInMinutes: assessment.timeLimitInMinutes ?? undefined,
        randomizeQuestions: assessment.randomizeQuestions,
        randomizeOptions: assessment.randomizeOptions,
        lessonId: assessment.lessonId ?? undefined,
        createdAt: assessment.createdAt,
        updatedAt: assessment.updatedAt,
      }));

      const lesson = Lesson.reconstruct(
        {
          slug: row.slug,
          moduleId: row.moduleId,
          order: row.order,
          imageUrl: row.imageUrl ?? undefined,
          flashcardIds: row.flashcardIds,
          commentIds: row.commentIds,
          translations: row.translations.map((t) => ({
            locale: t.locale as any,
            title: t.title,
            description: t.description ?? undefined,
          })),
          video: videoData,
          videos: [], // Mantido para compatibilidade
          documents: documentsData,
          assessments: assessmentsData,
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
}
