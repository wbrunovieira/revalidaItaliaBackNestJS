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
        where: { translations: { some: { locale: 'pt', title } } },
        include: { translations: { where: { locale: 'pt' }, take: 1 } },
      });
      if (!data) return left(new Error('Course not found'));

      const tr = data.translations[0];
      const props = {
        slug: data.slug,
        imageUrl: data.imageUrl ?? undefined,
        translations: [
          {
            locale: tr.locale as 'pt',
            title: tr.title,
            description: tr.description,
          },
        ],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };

      return right(Course.reconstruct(props, new UniqueEntityID(data.id)));
    } catch (err: any) {
      return left(new Error(`Database error: ${err.message}`));
    }
  }

  async findBySlug(slug: string): Promise<Either<Error, Course>> {
    try {
      const data = await this.prisma.course.findUnique({
        where: { slug },
        include: { translations: true },
      });
      if (!data) return left(new Error('Course not found'));

      const props = {
        slug: data.slug,
        imageUrl: data.imageUrl ?? undefined,
        translations: data.translations.map((tr) => ({
          locale: tr.locale as 'pt' | 'it' | 'es',
          title: tr.title,
          description: tr.description,
        })),
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };

      return right(Course.reconstruct(props, new UniqueEntityID(data.id)));
    } catch (err: any) {
      return left(new Error(`Database error: ${err.message}`));
    }
  }

  async create(course: Course): Promise<Either<Error, void>> {
    try {
      await this.prisma.course.create({
        data: {
          id: course.id.toString(),
          slug: course.slug,
          imageUrl: course.imageUrl,
          createdAt: course.createdAt,
          updatedAt: course.updatedAt,
          translations: {
            create: course.translations.map((t) => ({
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
      return left(new Error(`Failed to create course: ${err.message}`));
    }
  }

  async findAll(): Promise<Either<Error, Course[]>> {
    try {
      const data = await this.prisma.course.findMany({
        include: { translations: true },
      });
      const courses = data.map((item) => {
        const props = {
          slug: item.slug,
          imageUrl: item.imageUrl ?? undefined,
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
      return left(new Error(`Database error: ${err.message}`));
    }
  }

  async findById(id: string): Promise<Either<Error, Course>> {
    try {
      const data = await this.prisma.course.findUnique({
        where: { id },
        include: {
          translations: true,
          modules: { include: { translations: true } },
        },
      });
      if (!data) return left(new Error('Course not found'));

      const modules = data.modules.map((mod) => {
        const props = {
          slug: mod.slug,
          imageUrl: mod.imageUrl ?? undefined,
          translations: mod.translations.map((mt) => ({
            locale: mt.locale as 'pt' | 'it' | 'es',
            title: mt.title,
            description: mt.description,
          })),
          order: mod.order,
          videos: [],
          createdAt: mod.createdAt,
          updatedAt: mod.updatedAt,
        };
        return Module.reconstruct(props, new UniqueEntityID(mod.id));
      });

      const props = {
        slug: data.slug,
        imageUrl: data.imageUrl ?? undefined,
        translations: data.translations.map((tr) => ({
          locale: tr.locale as 'pt' | 'it' | 'es',
          title: tr.title,
          description: tr.description,
        })),
        modules,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
      return right(Course.reconstruct(props, new UniqueEntityID(data.id)));
    } catch (err: any) {
      return left(new Error(`Database error: ${err.message}`));
    }
  }

  async delete(id: string): Promise<Either<Error, void>> {
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.courseTranslation.deleteMany({ where: { courseId: id } });
        await tx.courseVideoLink.deleteMany({ where: { courseId: id } });
        await tx.trackCourse.deleteMany({ where: { courseId: id } });
        await tx.course.delete({ where: { id } });
      });
      return right(undefined);
    } catch (err: any) {
      if (err.code === 'P2025') return left(new Error('Course not found'));
      if (err.code === 'P2003')
        return left(new Error('Cannot delete course due to dependencies'));
      return left(new Error(`Failed to delete course: ${err.message}`));
    }
  }

  async checkCourseDependencies(
    courseId: string,
  ): Promise<Either<Error, CourseDependencyInfo>> {
    try {
      const [modules, trackCourses, lessonsCount, videosCount] =
        await Promise.all([
          this.prisma.module.findMany({
            where: { courseId },
            include: {
              translations: { where: { locale: 'pt' }, take: 1 },
              lessons: { include: { video: true } },
            },
          }),
          this.prisma.trackCourse.findMany({
            where: { courseId },
            include: {
              track: {
                include: { translations: { where: { locale: 'pt' }, take: 1 } },
              },
            },
          }),
          this.prisma.lesson.count({ where: { module: { courseId } } }),
          this.prisma.video.count({
            where: { lesson: { module: { courseId } } },
          }),
        ]);

      const dependencies: CourseDependency[] = [];

      modules.forEach((mod) => {
        const mt = mod.translations[0];
        const lessonCount = mod.lessons.length;
        const videoCount = mod.lessons.reduce(
          (sum, l) => sum + (l.video ? 1 : 0),
          0,
        );

        dependencies.push({
          type: 'module',
          id: mod.id,
          name: mt?.title ?? mod.slug,
          description: mt?.description,
          actionRequired: `Delete module "${mt?.title ?? mod.slug}" and its content first`,
          relatedEntities: { lessons: lessonCount, videos: videoCount },
        });
      });

      trackCourses.forEach((tc) => {
        const tt = tc.track.translations[0];
        dependencies.push({
          type: 'track',
          id: tc.track.id,
          name: tt?.title ?? tc.track.slug,
          description: tt?.description,
          actionRequired: `Remove course from track "${tt?.title ?? tc.track.slug}" first`,
        });
      });

      const info: CourseDependencyInfo = {
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

      return right(info);
    } catch (err: any) {
      return left(
        new Error(`Failed to check course dependencies: ${err.message}`),
      );
    }
  }

  async update(course: Course): Promise<Either<Error, void>> {
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.course.update({
          where: { id: course.id.toString() },
          data: {
            slug: course.slug,
            imageUrl: course.imageUrl,
            updatedAt: course.updatedAt,
          },
        });
        await tx.courseTranslation.deleteMany({
          where: { courseId: course.id.toString() },
        });
        await tx.courseTranslation.createMany({
          data: course.translations.map((t) => ({
            id: new UniqueEntityID().toString(),
            courseId: course.id.toString(),
            locale: t.locale,
            title: t.title,
            description: t.description,
          })),
        });
      });
      return right(undefined);
    } catch (err: any) {
      if (err.code === 'P2025') return left(new Error('Course not found'));
      if (err.code === 'P2002') return left(new Error('Duplicate course data'));
      return left(new Error(`Failed to update course: ${err.message}`));
    }
  }

  async findBySlugExcludingId(
    slug: string,
    excludeId: string,
  ): Promise<Either<Error, Course>> {
    try {
      const data = await this.prisma.course.findFirst({
        where: { slug, id: { not: excludeId } },
        include: { translations: true },
      });
      if (!data) return left(new Error('Course not found'));
      const props = {
        slug: data.slug,
        imageUrl: data.imageUrl ?? undefined,
        translations: data.translations.map((tr) => ({
          locale: tr.locale as 'pt' | 'it' | 'es',
          title: tr.title,
          description: tr.description,
        })),
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
      return right(Course.reconstruct(props, new UniqueEntityID(data.id)));
    } catch (err: any) {
      return left(new Error(`Database error: ${err.message}`));
    }
  }

  async findByTitleExcludingId(
    title: string,
    excludeId: string,
  ): Promise<Either<Error, Course>> {
    try {
      const data = await this.prisma.course.findFirst({
        where: {
          translations: { some: { locale: 'pt', title } },
          id: { not: excludeId },
        },
        include: { translations: true },
      });
      if (!data) return left(new Error('Course not found'));
      const props = {
        slug: data.slug,
        imageUrl: data.imageUrl ?? undefined,
        translations: data.translations.map((tr) => ({
          locale: tr.locale as 'pt' | 'it' | 'es',
          title: tr.title,
          description: tr.description,
        })),
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
      return right(Course.reconstruct(props, new UniqueEntityID(data.id)));
    } catch (err: any) {
      return left(new Error(`Database error: ${err.message}`));
    }
  }
}
