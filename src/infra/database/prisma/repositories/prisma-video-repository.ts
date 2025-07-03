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

      const ptTr = row.translations.find((t) => t.locale === 'pt');
      if (!ptTr) return left(new Error('Portuguese translation missing'));

      const videoEntity = Video.reconstruct(
        {
          slug: row.slug,
          title: ptTr.title,
          providerVideoId: row.providerVideoId,
          durationInSeconds: row.durationInSeconds,
          isSeen: row.isSeen,
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
          isSeen: video.isSeen,
          lessonId, // ← use the real lessonId
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
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002' &&
        Array.isArray(err.meta?.target) &&
        err.meta.target.includes('slug')
      ) {
        return left(new DuplicateVideoError());
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
          title: row.translations.find((t) => t.locale === 'pt')!.title,
          providerVideoId: row.providerVideoId,
          durationInSeconds: row.durationInSeconds,
          isSeen: row.isSeen,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        },
        new UniqueEntityID(row.id),
      );

      const translationsData = row.translations.map((t) => ({
        locale: t.locale as 'pt' | 'it' | 'es',
        title: t.title,
        description: t.description,
      }));

      return right({ video: videoEntity, translations: translationsData });
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
        const videoEntity = Video.reconstruct(
          {
            slug: row.slug,
            title: row.translations.find((t) => t.locale === 'pt')!.title,
            providerVideoId: row.providerVideoId,
            durationInSeconds: row.durationInSeconds,
            isSeen: row.isSeen,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
          },
          new UniqueEntityID(row.id),
        );

        const translationsData = row.translations.map((t) => ({
          locale: t.locale as 'pt' | 'it' | 'es',
          title: t.title,
          description: t.description,
        }));

        return { video: videoEntity, translations: translationsData };
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
      // Buscar APENAS as dependências que realmente impedem a exclusão
      const videosSeen = await this.prisma.videoSeen.findMany({
        where: { videoId: id },
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      });

      // Contar dependências que podem ser deletadas (para info apenas)
      const [translations, videoLinks] = await Promise.all([
        this.prisma.videoTranslation.count({ where: { videoId: id } }),
        this.prisma.videoLink.count({ where: { videoId: id } }),
      ]);

      const dependencies: VideoDependencyInfo['dependencies'] = [];

      // APENAS VideoSeen impede a exclusão (dados de progresso do usuário)
      videosSeen.forEach((seen) => {
        dependencies.push({
          type: 'video_seen',
          id: seen.id,
          name: `Viewed by ${seen.user.name}`,
          relatedEntities: {
            userId: seen.userId,
            userName: seen.user.name,
          },
        });
      });

      const info: VideoDependencyInfo = {
        canDelete: videosSeen.length === 0, // Só videosSeen impede
        totalDependencies: videosSeen.length,
        summary: {
          videosSeen: videosSeen.length,
          translations: translations, // Info apenas
          videoLinks: videoLinks, // Info apenas
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
      // Use transaction para garantir integridade
      await this.prisma.$transaction(async (tx) => {
        // Verificar se o vídeo existe
        const existingVideo = await tx.video.findUnique({
          where: { id },
        });

        if (!existingVideo) {
          throw new Error('Video not found');
        }

        // Deletar todas as entidades relacionadas primeiro
        await Promise.all([
          // Deletar VideoSeen
          tx.videoSeen.deleteMany({
            where: { videoId: id },
          }),

          // Deletar VideoTranslation
          tx.videoTranslation.deleteMany({
            where: { videoId: id },
          }),

          // Deletar VideoLink
          tx.videoLink.deleteMany({
            where: { videoId: id },
          }),
        ]);

        // Por último, deletar o próprio vídeo
        await tx.video.delete({
          where: { id },
        });
      });

      return right(undefined);
    } catch (err: any) {
      if (err.message === 'Video not found') {
        return left(new Error('Video not found'));
      }
      return left(new Error(`Failed to delete video: ${err.message}`));
    }
  }
}
