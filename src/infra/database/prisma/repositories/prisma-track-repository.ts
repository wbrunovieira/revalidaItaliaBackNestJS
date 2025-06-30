// src/infra/database/prisma/repositories/prisma-track-repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Either, left, right } from '@/core/either';
import { ITrackRepository } from '@/domain/course-catalog/application/repositories/i-track-repository';
import { Track } from '@/domain/course-catalog/enterprise/entities/track.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { TrackTranslationVO } from '@/domain/course-catalog/enterprise/value-objects/track-translation.vo';
import { TrackDependencyInfo } from '@/domain/course-catalog/application/dtos/track-dependencies.dto';
import { RepositoryError } from '@/domain/auth/application/use-cases/errors/repository-error';

@Injectable()
export class PrismaTrackRepository implements ITrackRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBySlug(slug: string): Promise<Either<Error, Track>> {
    try {
      const data = await this.prisma.track.findUnique({
        where: { slug },
        include: {
          translations: true,
          trackCourses: { include: { course: true } },
        },
      });
      if (!data) return left(new Error('Track not found'));

      const translations = data.translations.map(
        (tr) =>
          new TrackTranslationVO(
            tr.locale as 'pt' | 'it' | 'es',
            tr.title,
            tr.description,
          ),
      );

      const courseIds = data.trackCourses.map((tc) => tc.course.id);

      const props = {
        slug: data.slug,
        imageUrl: data.imageUrl || undefined,
        courseIds,
        translations,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
      return right(Track.reconstruct(props, new UniqueEntityID(data.id)));
    } catch (err: any) {
      return left(new Error(err.message || 'Database error'));
    }
  }

  async findById(id: string): Promise<Either<Error, Track>> {
    try {
      const data = await this.prisma.track.findUnique({
        where: { id },
        include: {
          translations: true,
          trackCourses: { include: { course: true } },
        },
      });
      if (!data) return left(new Error('Track not found'));

      const translations = data.translations.map(
        (tr) =>
          new TrackTranslationVO(
            tr.locale as 'pt' | 'it' | 'es',
            tr.title,
            tr.description,
          ),
      );

      const courseIds = data.trackCourses.map((tc) => tc.course.id);

      const props = {
        slug: data.slug,
        imageUrl: data.imageUrl || undefined,
        courseIds,
        translations,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
      return right(Track.reconstruct(props, new UniqueEntityID(data.id)));
    } catch (err: any) {
      return left(new Error(err.message || 'Database error'));
    }
  }

  async create(track: Track): Promise<Either<Error, void>> {
    try {
      await this.prisma.track.create({
        data: {
          id: track.id.toString(),
          slug: track.slug,
          imageUrl: track.imageUrl,
          translations: {
            create: track.translations.map((tr) => ({
              id: new UniqueEntityID().toString(),
              locale: tr.locale,
              title: tr.title,
              description: tr.description,
            })),
          },
          trackCourses: {
            create: track.courseIds.map((courseId) => ({
              course: { connect: { id: courseId } },
            })),
          },
        },
      });
      return right(undefined);
    } catch (err: any) {
      return left(new Error(err.message || 'Failed to create track'));
    }
  }

  async findAll(): Promise<Either<Error, Track[]>> {
    try {
      const data = await this.prisma.track.findMany({
        include: {
          translations: true,
          trackCourses: { include: { course: true } },
        },
      });
      const tracks = data.map((item) => {
        const translations = item.translations.map(
          (tr) =>
            new TrackTranslationVO(
              tr.locale as 'pt' | 'it' | 'es',
              tr.title,
              tr.description,
            ),
        );
        const courseIds = item.trackCourses.map((tc) => tc.course.id);

        const props = {
          slug: item.slug,
          imageUrl: item.imageUrl || undefined,
          courseIds,
          translations,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        };
        return Track.reconstruct(props, new UniqueEntityID(item.id));
      });
      return right(tracks);
    } catch (err: any) {
      return left(new Error(err.message || 'Database error'));
    }
  }

  async delete(id: string): Promise<Either<Error, void>> {
    try {
      await this.prisma.$transaction(async (tx) => {
        // Deletar traduções
        await tx.trackTranslation.deleteMany({
          where: { trackId: id },
        });

        // Deletar relações com cursos
        await tx.trackCourse.deleteMany({
          where: { trackId: id },
        });

        // Deletar o track
        await tx.track.delete({
          where: { id },
        });
      });

      return right(undefined);
    } catch (err: any) {
      return left(new Error(err.message || 'Failed to delete track'));
    }
  }

  async checkTrackDependencies(
    id: string,
  ): Promise<Either<Error, TrackDependencyInfo>> {
    try {
      const track = await this.prisma.track.findUnique({
        where: { id },
        include: {
          trackCourses: {
            include: {
              course: {
                include: {
                  translations: {
                    where: { locale: 'pt' },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      });

      if (!track) {
        return left(new Error('Track not found'));
      }

      const dependencies = track.trackCourses.map((tc) => ({
        type: 'course' as const,
        id: tc.course.id,
        slug: tc.course.slug,
        name: tc.course.translations[0]?.title || tc.course.slug,
      }));

      return right({
        canDelete: dependencies.length === 0,
        totalDependencies: dependencies.length,
        summary: {
          courses: dependencies.length,
        },
        dependencies,
      });
    } catch (err: any) {
      return left(new Error(err.message || 'Failed to check dependencies'));
    }
  }

  async update(track: Track): Promise<Either<RepositoryError, void>> {
    try {
      await this.prisma.$transaction(async (tx) => {
        // 1. Atualizar dados básicos do track
        await tx.track.update({
          where: { id: track.id.toString() },
          data: {
            slug: track.slug,
            imageUrl: track.imageUrl,
            updatedAt: track.updatedAt,
          },
        });

        // 2. Remover associações de cursos existentes
        await tx.trackCourse.deleteMany({
          where: { trackId: track.id.toString() },
        });

        // 3. Criar novas associações de cursos (se houver)
        if (track.courseIds.length > 0) {
          await tx.trackCourse.createMany({
            data: track.courseIds.map((courseId) => ({
              trackId: track.id.toString(),
              courseId,
            })),
          });
        }

        // 4. Remover traduções existentes
        await tx.trackTranslation.deleteMany({
          where: { trackId: track.id.toString() },
        });

        // 5. Criar novas traduções
        await tx.trackTranslation.createMany({
          data: track.translations.map((translation) => ({
            trackId: track.id.toString(),
            locale: translation.locale,
            title: translation.title,
            description: translation.description,
          })),
        });
      });

      return right(undefined);
    } catch (error) {
      return left(
        new RepositoryError(`Failed to update track: ${error.message}`),
      );
    }
  }
}
