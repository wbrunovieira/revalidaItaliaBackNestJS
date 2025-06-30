// src/infra/database/prisma/repositories/prisma-track-repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Either, left, right } from '@/core/either';
import { ITrackRepository } from '@/domain/course-catalog/application/repositories/i-track-repository';
import { Track } from '@/domain/course-catalog/enterprise/entities/track.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { TrackTranslationVO } from '@/domain/course-catalog/enterprise/value-objects/track-translation.vo';
import { TrackDependencyInfo } from '@/domain/course-catalog/application/dtos/track-dependencies.dto';

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
      // Primeiro deletar as traduções e as relações com cursos
      await this.prisma.$transaction([
        this.prisma.trackTranslation.deleteMany({
          where: { trackId: id },
        }),
        this.prisma.trackCourse.deleteMany({
          where: { trackId: id },
        }),
        this.prisma.track.delete({
          where: { id },
        }),
      ]);
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
}
