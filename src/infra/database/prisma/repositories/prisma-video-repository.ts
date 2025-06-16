// src/infra/course-catalog/database/prisma/repositories/prisma-video-repository.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { Prisma } from "@prisma/client";
import { Either, left, right } from "@/core/either";
import { IVideoRepository } from "@/domain/course-catalog/application/repositories/i-video-repository";
import { Video } from "@/domain/course-catalog/enterprise/entities/video.entity";
import { UniqueEntityID } from "@/core/unique-entity-id";
import { DuplicateVideoError } from "@/domain/course-catalog/application/use-cases/errors/duplicate-video-error";

@Injectable()
export class PrismaVideoRepository implements IVideoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBySlug(slug: string): Promise<Either<Error, Video>> {
    try {
      const row = await this.prisma.video.findUnique({
        where: { slug },
        include: { translations: true },
      });
      if (!row) return left(new Error("Video not found"));

      const ptTr = row.translations.find((t) => t.locale === "pt");
      if (!ptTr) return left(new Error("Portuguese translation missing"));

      const videoEntity = Video.reconstruct(
        {
          slug: row.slug,
          title: ptTr.title,
          providerVideoId: row.providerVideoId,
          durationInSeconds: row.durationInSeconds,
          isSeen: false,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        },
        new UniqueEntityID(row.id),
      );

      return right(videoEntity);
    } catch (err: any) {
      return left(new Error(`Database error: ${err.message}`));
    }
  }

  async create(
    moduleId: string,
    video: Video,
    translations: Array<{
      locale: 'pt' | 'it' | 'es';
      title: string;
      description: string;
    }>
  ): Promise<Either<Error, void>> {
    try {
      // Ensure there’s exactly one Lesson per Module (moduleId is @unique)
      const lesson = await this.prisma.lesson.upsert({
        where: { moduleId },
        update: {}, // nothing to change if it already exists
        create: {
          moduleId,
          flashcardIds: [],
          quizIds: [],
          commentIds: [],
        },
      });

      // Now attach the new Video to that Lesson
      await this.prisma.video.create({
        data: {
          id: video.id.toString(),
          slug: video.slug,
          providerVideoId: video.providerVideoId,
          durationInSeconds: video.durationInSeconds,
          lessonId: lesson.id,
          translations: {
            create: translations.map((t) => ({
              id: new UniqueEntityID().toString(),
              locale: t.locale,
              title: t.title,
              description: t.description,
            })),
          },
          createdAt: video.createdAt,
          updatedAt: video.updatedAt,
        },
      });

      return right(undefined);
    } catch (err: any) {
      // map unique‐slug violations to our domain error
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002' &&
        (err.meta?.target as string[]).includes('slug')
      ) {
        return left(new DuplicateVideoError());
      }
      return left(new Error(`Failed to create video: ${err.message}`));
    }
  }
  async findById(
    id: string,
  ): Promise<
    Either<
      Error,
      {
        video: Video;
        translations: Array<{ locale: 'pt' | 'it' | 'es'; title: string; description: string }>;
      }
    >
  > {
    try {
      const row = await this.prisma.video.findUnique({
        where: { id },
        include: { translations: true },
      });
      if (!row) return left(new Error("Video not found"));

      const videoEntity = Video.reconstruct(
        {
          slug: row.slug,
          title: row.translations.find((t) => t.locale === "pt")!.title,
          providerVideoId: row.providerVideoId,
          durationInSeconds: row.durationInSeconds,
          isSeen: false,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        },
        new UniqueEntityID(row.id),
      );

      const translations = row.translations.map((t) => ({
        locale: t.locale as 'pt' | 'it' | 'es',
        title: t.title,
        description: t.description,
      }));

      return right({ video: videoEntity, translations });
    } catch (err: any) {
      return left(new Error(`Database error: ${err.message}`));
    }
  }

  async findByLesson(
    lessonId: string,
  ): Promise<
    Either<
      Error,
      Array<{
        video: Video;
        translations: Array<{ locale: 'pt' | 'it' | 'es'; title: string; description: string }>;
      }>
    >
  > {
    try {
      const rows = await this.prisma.video.findMany({
        where: { lessonId },
        include: { translations: true },
      });

      const result = rows.map((row) => {
        const v = Video.reconstruct(
          {
            slug: row.slug,
            title: row.translations.find((t) => t.locale === 'pt')!.title,
            providerVideoId: row.providerVideoId,
            durationInSeconds: row.durationInSeconds,
            isSeen: false,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
          },
          new UniqueEntityID(row.id),
        );

        const translations = row.translations.map((t) => ({
          locale: t.locale as 'pt' | 'it' | 'es',
          title: t.title,
          description: t.description,
        }));

        return { video: v, translations };
      });

      return right(result);
    } catch (err: any) {
      return left(new Error(`Database error: ${err.message}`));
    }
  }
}