// src/infra/database/prisma/repositories/prisma-course-repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Either, left, right } from '@/core/either';
import { ICourseRepository } from '@/domain/course-catalog/application/repositories/i-course-repository';
import { Course } from '@/domain/course-catalog/enterprise/entities/course.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { Module } from '@/domain/course-catalog/enterprise/entities/module.entity';
import {
  CourseDependency,
  CourseDependencyInfo,
} from '@/domain/course-catalog/application/dtos/course-dependencies.dto';

@Injectable()
export class PrismaCourseRepository implements ICourseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByTitle(title: string): Promise<Either<Error, Course>> {
    try {
      const data = await this.prisma.course.findFirst({
        where: {
          translations: {
            some: {
              locale: 'pt',
              title,
            },
          },
        },
        include: {
          translations: {
            where: { locale: 'pt' },
            take: 1,
          },
        },
      });

      if (!data) {
        return left(new Error('Course not found'));
      }

      const courseTr = data.translations[0];
      const courseProps = {
        slug: data.slug,
        imageUrl: data.imageUrl || undefined, // Converter null para undefined
        translations: [
          {
            locale: courseTr.locale as 'pt',
            title: courseTr.title,
            description: courseTr.description,
          },
        ],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };

      const courseEntity = Course.reconstruct(
        courseProps,
        new UniqueEntityID(data.id),
      );

      return right(courseEntity);
    } catch (err: any) {
      return left(new Error('Database error'));
    }
  }

  async findBySlug(slug: string): Promise<Either<Error, Course>> {
    try {
      const data = await this.prisma.course.findUnique({
        where: { slug },
        include: {
          translations: true,
        },
      });

      if (!data) {
        return left(new Error('Course not found'));
      }

      const courseProps = {
        slug: data.slug,
        imageUrl: data.imageUrl || undefined, // Converter null para undefined
        translations: data.translations.map((tr) => ({
          locale: tr.locale as 'pt' | 'it' | 'es',
          title: tr.title,
          description: tr.description,
        })),
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };

      const courseEntity = Course.reconstruct(
        courseProps,
        new UniqueEntityID(data.id),
      );

      return right(courseEntity);
    } catch (err: any) {
      return left(new Error('Database error'));
    }
  }

  async create(course: Course): Promise<Either<Error, void>> {
    try {
      const courseTranslations = course.translations;

      await this.prisma.course.create({
        data: {
          id: course.id.toString(),
          slug: course.slug,
          imageUrl: course.imageUrl,
          createdAt: course.createdAt,
          updatedAt: course.updatedAt,

          translations: {
            create: courseTranslations.map((t) => ({
              id: new UniqueEntityID().toString(),
              locale: t.locale,
              title: t.title,
              description: t.description,
            })),
          },
        },
      });

      return right(undefined);
    } catch (err: any) {
      return left(new Error('Failed to create course'));
    }
  }

  async findAll(): Promise<Either<Error, Course[]>> {
    try {
      const data = await this.prisma.course.findMany({
        include: {
          translations: true,
        },
      });

      const courses = data.map((item) => {
        const props = {
          slug: item.slug,
          imageUrl: item.imageUrl || undefined,

          translations: item.translations.map((tr) => ({
            locale: tr.locale as 'pt' | 'it' | 'es',
            title: tr.title,
            description: tr.description,
          })),
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        };
        return Course.reconstruct(props, new UniqueEntityID(item.id));
      });

      return right(courses);
    } catch (err: any) {
      return left(new Error('Database error'));
    }
  }

  async findById(id: string): Promise<Either<Error, Course>> {
    try {
      const data = await this.prisma.course.findUnique({
        where: { id },
        include: {
          translations: true,
          modules: {
            include: {
              translations: true,
            },
          },
        },
      });

      if (!data) {
        return left(new Error('Course not found'));
      }

      const modulesEntities: Module[] = data.modules.map((mod) => {
        const moduleProps = {
          slug: mod.slug,
          imageUrl: mod.imageUrl || undefined, // Converter null para undefined
          translations: mod.translations.map((modTr) => ({
            locale: modTr.locale as 'pt' | 'it' | 'es',
            title: modTr.title,
            description: modTr.description,
          })),
          order: mod.order,
          videos: [],
          createdAt: mod.createdAt,
          updatedAt: mod.updatedAt,
        };
        return Module.reconstruct(moduleProps, new UniqueEntityID(mod.id));
      });

      const courseProps = {
        slug: data.slug,
        imageUrl: data.imageUrl || undefined, // Converter null para undefined
        translations: data.translations.map((ctr) => ({
          locale: ctr.locale as 'pt' | 'it' | 'es',
          title: ctr.title,
          description: ctr.description,
        })),
        modules: modulesEntities,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };

      const courseEntity = Course.reconstruct(
        courseProps,
        new UniqueEntityID(data.id),
      );
      return right(courseEntity);
    } catch {
      return left(new Error('Database error'));
    }
  }

  async delete(id: string): Promise<Either<Error, void>> {
    try {
      await this.prisma.$transaction(async (tx) => {
        // 1. Deletar CourseTranslation primeiro
        await tx.courseTranslation.deleteMany({
          where: { courseId: id },
        });

        // 2. Deletar CourseVideoLink
        await tx.courseVideoLink.deleteMany({
          where: { courseId: id },
        });

        // 3. Deletar TrackCourse (relacionamentos N:N)
        await tx.trackCourse.deleteMany({
          where: { courseId: id },
        });

        // 4. Deletar o curso por último
        await tx.course.delete({
          where: { id },
        });
      });

      return right(undefined);
    } catch (err: any) {
      if (err.code === 'P2025') {
        return left(new Error('Course not found'));
      }
      if (err.code === 'P2003') {
        return left(
          new Error('Cannot delete course due to existing dependencies'),
        );
      }
      return left(new Error('Failed to delete course'));
    }
  }

  async checkCourseDependencies(
    courseId: string,
  ): Promise<Either<Error, CourseDependencyInfo>> {
    try {
      // Buscar todas as dependências em paralelo para performance
      const [modules, trackCourses, lessonsCount, videosCount] =
        await Promise.all([
          // Modules com contagem de lessons e videos
          this.prisma.module.findMany({
            where: { courseId },
            include: {
              translations: {
                where: { locale: 'pt' },
                take: 1,
                select: { title: true, description: true },
              },
              lessons: {
                include: {
                  Video: true, // Contar videos por lesson
                },
              },
            },
          }),

          // Track associations
          this.prisma.trackCourse.findMany({
            where: { courseId },
            include: {
              track: {
                include: {
                  translations: {
                    where: { locale: 'pt' },
                    take: 1,
                    select: { title: true, description: true },
                  },
                },
              },
            },
          }),

          // Total lessons count
          this.prisma.lesson.count({
            where: {
              module: {
                courseId,
              },
            },
          }),

          // Total videos count
          this.prisma.video.count({
            where: {
              lesson: {
                module: {
                  courseId,
                },
              },
            },
          }),
        ]);

      const dependencies: CourseDependency[] = [];

      // Processar módulos
      modules.forEach((module) => {
        const moduleTranslation = module.translations[0];
        const lessonsInModule = module.lessons.length;
        const videosInModule = module.lessons.reduce(
          (acc, lesson) => acc + lesson.Video.length,
          0,
        );

        dependencies.push({
          type: 'module',
          id: module.id,
          name: moduleTranslation?.title || module.slug,
          description: moduleTranslation?.description,
          actionRequired: `Delete module "${moduleTranslation?.title || module.slug}" and all its content first`,
          relatedEntities: {
            lessons: lessonsInModule,
            videos: videosInModule,
          },
        });
      });

      // Processar track associations
      trackCourses.forEach((trackCourse) => {
        const trackTranslation = trackCourse.track.translations[0];

        dependencies.push({
          type: 'track',
          id: trackCourse.track.id,
          name: trackTranslation?.title || trackCourse.track.slug,
          description: trackTranslation?.description,
          actionRequired: `Remove course from track "${trackTranslation?.title || trackCourse.track.slug}" first`,
        });
      });

      const result: CourseDependencyInfo = {
        canDelete: dependencies.length === 0,
        dependencies,
        totalDependencies: dependencies.length,
        summary: {
          modules: modules.length,
          tracks: trackCourses.length,
          lessons: lessonsCount,
          videos: videosCount,
        },
      };

      return right(result);
    } catch (err: any) {
      return left(new Error('Failed to check course dependencies'));
    }
  }
}
