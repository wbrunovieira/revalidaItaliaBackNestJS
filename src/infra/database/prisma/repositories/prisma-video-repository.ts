// src/infra/course-catalog/database/prisma/repositories/prisma-video-repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Either, left, right } from '@/core/either';
import { IVideoRepository } from '@/domain/course-catalog/application/repositories/i-video-repository';
import { Video } from '@/domain/course-catalog/enterprise/entities/video.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';

@Injectable()
export class PrismaVideoRepository implements IVideoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBySlug(slug: string): Promise<Either<Error, Video>> {
    try {
      const row = await this.prisma.video.findUnique({
        where: { slug },
        include: { translations: true },
      });
      if (!row) {
        return left(new Error('Video not found'));
      }

      const ptTr = row.translations.find((t) => t.locale === 'pt');
      if (!ptTr) {
        return left(new Error('Portuguese translation missing'));
      }

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
  ): Promise<Either<Error, void>> {
    try {
      await this.prisma.video.create({
        data: {
          id: video.id.toString(),
          slug: video.slug,
          providerVideoId: video.providerVideoId,
          durationInSeconds: video.durationInSeconds,
          module: { connect: { id: moduleId } },
          translations: {
            create: [
              {
                id: new UniqueEntityID().toString(),
                locale: 'pt',
                title: video.title,
                description: '',
              },
            ],
          },
          createdAt: video.createdAt,
          updatedAt: video.updatedAt,
        },
      });
      return right(undefined);
    } catch (err: any) {
      return left(new Error(`Failed to create video: ${err.message}`));
    }
  }

  async findById(id: string): Promise<Either<Error, Video>> {
    try {
      const row = await this.prisma.video.findUnique({
        where: { id },
        include: { translations: true },
      });
      if (!row) {
        return left(new Error('Video not found'));
      }

      const ptTr = row.translations.find(t => t.locale === 'pt');
      if (!ptTr) {
        return left(new Error('Portuguese translation missing'));
      }

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

}