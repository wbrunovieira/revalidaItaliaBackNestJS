// src/infra/database/prisma/repositories/prisma-video.repository.ts

import {
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { Either, left, right } from '@/core/either';
import { IVideoRepository } from '@/domain/course-catalog/application/repositories/i-video-repository';
import { Video } from '@/domain/course-catalog/enterprise/entities/video.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { DuplicateVideoError } from '@/domain/course-catalog/application/use-cases/errors/duplicate-video-error';
import { VideoDependencyInfo } from '@/domain/course-catalog/application/dtos/video-dependencies.dto';

@Injectable()
export class PrismaVideoRepository implements IVideoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBySlug(slug: string): Promise<Either<Error, Video>> {
    try {
      const row = await this.prisma.video.findUnique({
        where: { slug },
        include: { translations: true },
      });
      if (!row) return left(new Error('Video not found'));

      const videoEntity = Video.reconstruct(
        {
          slug: row.slug,
          imageUrl: row.imageUrl ?? undefined,
          providerVideoId: row.providerVideoId,
          durationInSeconds: row.durationInSeconds,
          lessonId: row.lessonId ?? undefined,
          translations: row.translations.map((t) => ({
            locale: t.locale as 'pt' | 'it' | 'es',
            title: t.title,
            description: t.description,
          })),
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
    lessonId: string,
    video: Video,
    translations: Array<{
      locale: 'pt' | 'it' | 'es';
      title: string;
      description: string;
    }>,
  ): Promise<Either<Error, void>> {
    try {
      await this.prisma.video.create({
        data: {
          id: video.id.toString(),
          slug: video.slug,
          providerVideoId: video.providerVideoId,
          durationInSeconds: video.durationInSeconds,
          lessonId,
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
      if (err.code === 'P2002' && Array.isArray(err.meta?.target)) {
        if (err.meta.target.includes('slug')) {
          return left(new DuplicateVideoError());
        }
        if (err.meta.target.includes('lessonId')) {
          return left(new DuplicateVideoError());
        }
      }
      return left(new Error(`Failed to create video: ${err.message}`));
    }
  }

  async findById(id: string): Promise<
    Either<
      Error,
      {
        video: Video;
        translations: Array<{
          locale: 'pt' | 'it' | 'es';
          title: string;
          description: string;
        }>;
      }
    >
  > {
    try {
      const row = await this.prisma.video.findUnique({
        where: { id },
        include: { translations: true },
      });
      if (!row) return left(new Error('Video not found'));

      const videoEntity = Video.reconstruct(
        {
          slug: row.slug,
          imageUrl: row.imageUrl ?? undefined,
          providerVideoId: row.providerVideoId,
          durationInSeconds: row.durationInSeconds,
          lessonId: row.lessonId ?? undefined,
          translations: row.translations.map((t) => ({
            locale: t.locale as 'pt' | 'it' | 'es',
            title: t.title,
            description: t.description,
          })),
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        },
        new UniqueEntityID(row.id),
      );

      return right({
        video: videoEntity,
        translations: videoEntity.translations,
      });
    } catch (err: any) {
      return left(new Error(`Database error: ${err.message}`));
    }
  }

  async findByLesson(lessonId: string): Promise<
    Either<
      Error,
      Array<{
        video: Video;
        translations: Array<{
          locale: 'pt' | 'it' | 'es';
          title: string;
          description: string;
        }>;
      }>
    >
  > {
    try {
      const rows = await this.prisma.video.findMany({
        where: { lessonId },
        include: { translations: true },
      });

      const result = rows.map((row) => {
        const video = Video.reconstruct(
          {
            slug: row.slug,
            imageUrl: row.imageUrl ?? undefined,
            providerVideoId: row.providerVideoId,
            durationInSeconds: row.durationInSeconds,
            lessonId: row.lessonId ?? undefined,
            translations: row.translations.map((t) => ({
              locale: t.locale as 'pt' | 'it' | 'es',
              title: t.title,
              description: t.description,
            })),
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
          },
          new UniqueEntityID(row.id),
        );

        return {
          video,
          translations: video.translations,
        };
      });

      return right(result);
    } catch (err: any) {
      return left(new Error(`Database error: ${err.message}`));
    }
  }

  async checkVideoDependencies(
    id: string,
  ): Promise<Either<Error, VideoDependencyInfo>> {
    try {
      const videosSeen = await this.prisma.videoSeen.findMany({
        where: { videoId: id },
        include: {
          identity: {
            select: {
              id: true,
              email: true,
              profile: {
                select: { fullName: true },
              },
            },
          },
        },
      });

      const [translations, videoLinks] = await Promise.all([
        this.prisma.videoTranslation.count({ where: { videoId: id } }),
        this.prisma.videoLink.count({ where: { videoId: id } }),
      ]);

      const dependencies: VideoDependencyInfo['dependencies'] = videosSeen.map(
        (seen) => ({
          type: 'video_seen',
          id: seen.id,
          name: `Viewed by ${seen.identity.profile?.fullName || seen.identity.email}`,
          relatedEntities: {
            identityId: seen.identityId,
            userName: seen.identity.profile?.fullName || seen.identity.email,
          },
        }),
      );

      const info: VideoDependencyInfo = {
        canDelete: videosSeen.length === 0,
        totalDependencies: videosSeen.length,
        summary: {
          videosSeen: videosSeen.length,
          translations,
          videoLinks,
        },
        dependencies,
      };

      return right(info);
    } catch (err: any) {
      return left(
        new Error(`Failed to check video dependencies: ${err.message}`),
      );
    }
  }

  async delete(id: string): Promise<Either<Error, void>> {
    try {
      await this.prisma.$transaction(async (tx) => {
        const existingVideo = await tx.video.findUnique({ where: { id } });
        if (!existingVideo) throw new Error('Video not found');

        await Promise.all([
          tx.videoSeen.deleteMany({ where: { videoId: id } }),
          tx.videoTranslation.deleteMany({ where: { videoId: id } }),
          tx.videoLink.deleteMany({ where: { videoId: id } }),
        ]);

        await tx.video.delete({ where: { id } });
      });

      return right(undefined);
    } catch (err: any) {
      return left(new Error(`Failed to delete video: ${err.message}`));
    }
  }

  async update(video: Video): Promise<Either<Error, void>> {
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.video.update({
          where: { id: video.id.toString() },
          data: {
            slug: video.slug,
            imageUrl: video.imageUrl,
            providerVideoId: video.providerVideoId,
            durationInSeconds: video.durationInSeconds,
            lessonId: video.lessonId,
            updatedAt: video.updatedAt,
          },
        });

        await tx.videoTranslation.deleteMany({
          where: { videoId: video.id.toString() },
        });

        await tx.videoTranslation.createMany({
          data: video.translations.map((t) => ({
            id: new UniqueEntityID().toString(),
            videoId: video.id.toString(),
            locale: t.locale,
            title: t.title,
            description: t.description,
          })),
        });
      });

      return right(undefined);
    } catch (err: any) {
      return left(new Error(`Failed to update video: ${err.message}`));
    }
  }
}
