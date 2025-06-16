// src/infra/course-catalog/database/prisma/repositories/prisma-lesson-repository.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { Prisma } from "@prisma/client";
import { Either, left, right } from "@/core/either";
import { ILessonRepository } from "@/domain/course-catalog/application/repositories/i-lesson-repository";
import { Lesson } from "@/domain/course-catalog/enterprise/entities/lesson.entity";
import { UniqueEntityID } from "@/core/unique-entity-id";

@Injectable()
export class PrismaLessonRepository implements ILessonRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(lesson: Lesson): Promise<Either<Error, void>> {
    try {
      await this.prisma.lesson.create({
        data: {
        
          id: lesson.id.toString(),

        
          moduleId: lesson.moduleId,
          videoId: lesson.videoId ?? null,

          flashcardIds: lesson.flashcardIds,
          quizIds:      lesson.quizIds,
          commentIds:   lesson.commentIds,

        
          createdAt: lesson.createdAt,
          updatedAt: lesson.updatedAt,

          translations: {
            create: lesson.translations.map((t) => ({
              id:          new UniqueEntityID().toString(),
              locale:      t.locale,
              title:       t.title,
        
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
        where:  { id },
        include: { translations: true },
      });
      if (!row) return left(new Error("Lesson not found"));

      const lesson = Lesson.reconstruct(
        {
          moduleId:    row.moduleId,
          videoId:     row.videoId ?? undefined,
          flashcardIds: row.flashcardIds,
          quizIds:      row.quizIds,
          commentIds:   row.commentIds,
          translations: row.translations.map((t) => ({
            locale:      t.locale as any,
            title:       t.title,
            description: t.description ?? undefined,
          })),
          createdAt:  row.createdAt,
          updatedAt:  row.updatedAt,
        },
        new UniqueEntityID(row.id),
      );

      return right(lesson);
    } catch (err: any) {
      return left(new Error(err.message));
    }
  }
}