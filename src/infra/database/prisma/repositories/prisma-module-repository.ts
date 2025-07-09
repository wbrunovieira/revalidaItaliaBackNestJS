// src/infra/course-catalog/database/prisma/repositories/prisma-module-repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Either, left, right } from '@/core/either';
import { IModuleRepository } from '@/domain/course-catalog/application/repositories/i-module-repository';
import { Module } from '@/domain/course-catalog/enterprise/entities/module.entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import {
  ModuleDependencyInfo,
  ModuleDependency,
} from '@/domain/course-catalog/application/dtos/module-dependencies.dto';

@Injectable()
export class PrismaModuleRepository implements IModuleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByCourseIdAndOrder(
    courseId: string,
    order: number,
  ): Promise<Either<Error, Module>> {
    try {
      const data = await this.prisma.module.findFirst({
        where: { courseId, order },
        include: { translations: true },
      });

      if (!data) return left(new Error('Module not found'));

      const translations = data.translations.map((tr) => ({
        locale: tr.locale as 'pt' | 'it' | 'es',
        title: tr.title,
        description: tr.description,
      }));

      const moduleEntity = Module.reconstruct(
        {
          slug: data.slug,
          imageUrl: data.imageUrl ?? undefined,
          translations,
          order: data.order,
          videos: [],
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        },
        new UniqueEntityID(data.id),
      );

      return right(moduleEntity);
    } catch (err: any) {
      return left(new Error(`Database error: ${err.message}`));
    }
  }

  async create(courseId: string, module: Module): Promise<Either<Error, void>> {
    try {
      await this.prisma.module.create({
        data: {
          id: module.id.toString(),
          slug: module.slug,
          imageUrl: module.imageUrl ?? null,
          order: module.order,
          courseId,
          createdAt: module.createdAt,
          updatedAt: module.updatedAt,
          translations: {
            create: module.translations.map((tr) => ({
              id: new UniqueEntityID().toString(),
              locale: tr.locale,
              title: tr.title,
              description: tr.description,
            })),
          },
        },
      });
      return right(undefined);
    } catch (err: any) {
      return left(new Error(`Failed to create module: ${err.message}`));
    }
  }

  async findByCourseId(courseId: string): Promise<Either<Error, Module[]>> {
    try {
      const data = await this.prisma.module.findMany({
        where: { courseId },
        include: { translations: true },
        orderBy: { order: 'asc' },
      });

      const modules = data.map((mod) => {
        const translations = mod.translations.map((tr) => ({
          locale: tr.locale as 'pt' | 'it' | 'es',
          title: tr.title,
          description: tr.description,
        }));

        return Module.reconstruct(
          {
            slug: mod.slug,
            imageUrl: mod.imageUrl ?? undefined,
            translations,
            order: mod.order,
            videos: [],
            createdAt: mod.createdAt,
            updatedAt: mod.updatedAt,
          },
          new UniqueEntityID(mod.id),
        );
      });

      return right(modules);
    } catch (err: any) {
      return left(new Error(`Database error: ${err.message}`));
    }
  }

  async findById(moduleId: string): Promise<Either<Error, Module>> {
    try {
      const mod = await this.prisma.module.findUnique({
        where: { id: moduleId },
        include: { translations: true },
      });

      if (!mod) return left(new Error('Module not found'));

      const translations = mod.translations.map((tr) => ({
        locale: tr.locale as 'pt' | 'it' | 'es',
        title: tr.title,
        description: tr.description,
      }));

      return right(
        Module.reconstruct(
          {
            slug: mod.slug,
            imageUrl: mod.imageUrl ?? undefined,
            translations,
            order: mod.order,
            videos: [],
            createdAt: mod.createdAt,
            updatedAt: mod.updatedAt,
          },
          new UniqueEntityID(mod.id),
        ),
      );
    } catch (err: any) {
      return left(new Error(`Database error: ${err.message}`));
    }
  }

  async checkModuleDependencies(
    moduleId: string,
  ): Promise<Either<Error, ModuleDependencyInfo>> {
    try {
      const mod = await this.prisma.module.findUnique({
        where: { id: moduleId },
        include: {
          lessons: {
            include: {
              translations: true,
              video: true,
              documents: true,
              Assessment: true,
            },
          },
        },
      });

      if (!mod) return left(new Error('Module not found'));

      const dependencies: ModuleDependency[] = [];
      let totalVideos = 0;

      mod.lessons.forEach((lesson) => {
        const pt = lesson.translations.find((t) => t.locale === 'pt');
        const name = pt?.title || `Lesson ${lesson.id}`;
        const videosCount = lesson.video ? 1 : 0;
        totalVideos += videosCount;

        dependencies.push({
          type: 'lesson',
          id: lesson.id,
          name,
          relatedEntities: {
            videos: videosCount,
            documents: lesson.documents.length,
            flashcards: lesson.flashcardIds.length,
            quizzes: lesson.Assessment.length,
          },
        });
      });

      const info: ModuleDependencyInfo = {
        canDelete: dependencies.length === 0,
        totalDependencies: dependencies.length,
        summary: {
          lessons: mod.lessons.length,
          videos: totalVideos,
        },
        dependencies,
      };

      return right(info);
    } catch (err: any) {
      return left(new Error(`Failed to check dependencies: ${err.message}`));
    }
  }

  async delete(moduleId: string): Promise<Either<Error, void>> {
    try {
      await this.prisma.$transaction(async (tx) => {
        const exists = await tx.module.findUnique({ where: { id: moduleId } });
        if (!exists) throw new Error('Module not found');

        await tx.moduleTranslation.deleteMany({ where: { moduleId } });
        await tx.moduleVideoLink.deleteMany({ where: { moduleId } });
        await tx.module.delete({ where: { id: moduleId } });
      });
      return right(undefined);
    } catch (err: any) {
      if (err.message === 'Module not found')
        return left(new Error('Module not found'));
      return left(new Error(`Failed to delete module: ${err.message}`));
    }
  }

  async findBySlug(slug: string): Promise<Either<Error, Module | null>> {
    try {
      const mod = await this.prisma.module.findUnique({
        where: { slug },
        include: { translations: true },
      });
      if (!mod) return right(null);

      const translations = mod.translations.map((tr) => ({
        locale: tr.locale as 'pt' | 'it' | 'es',
        title: tr.title,
        description: tr.description,
      }));

      return right(
        Module.reconstruct(
          {
            slug: mod.slug,
            imageUrl: mod.imageUrl ?? undefined,
            translations,
            order: mod.order,
            videos: [],
            createdAt: mod.createdAt,
            updatedAt: mod.updatedAt,
          },
          new UniqueEntityID(mod.id),
        ),
      );
    } catch (err: any) {
      return left(new Error(`Database error: ${err.message}`));
    }
  }

  async update(module: Module): Promise<Either<Error, void>> {
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.module.update({
          where: { id: module.id.toString() },
          data: {
            slug: module.slug,
            imageUrl: module.imageUrl ?? null,
            order: module.order,
            updatedAt: module.updatedAt,
          },
        });
        await tx.moduleTranslation.deleteMany({
          where: { moduleId: module.id.toString() },
        });
        await tx.moduleTranslation.createMany({
          data: module.translations.map((tr) => ({
            id: new UniqueEntityID().toString(),
            moduleId: module.id.toString(),
            locale: tr.locale,
            title: tr.title,
            description: tr.description,
          })),
        });
      });

      return right(undefined);
    } catch (err: any) {
      return left(new Error(`Failed to update module: ${err.message}`));
    }
  }

  async findCourseIdByModuleId(
    moduleId: string,
  ): Promise<Either<Error, string>> {
    try {
      const mod = await this.prisma.module.findUnique({
        where: { id: moduleId },
        select: { courseId: true },
      });
      if (!mod) return left(new Error('Module not found'));
      return right(mod.courseId);
    } catch (err: any) {
      return left(new Error(`Database error: ${err.message}`));
    }
  }
}
