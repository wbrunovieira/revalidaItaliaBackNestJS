// src/infra/course-catalog/database/prisma/repositories/prisma-module-repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Either, left, right } from '@/core/either';
import { IModuleRepository } from '@/domain/course-catalog/application/repositories/i-module-repository';
import { Module } from '@/domain/course-catalog/enterprise/entities/module.entity';
import {
  ModuleDependencyInfo,
  ModuleDependency,
} from '@/domain/course-catalog/application/dtos/module-dependencies.dto';
import { UniqueEntityID } from '@/core/unique-entity-id';

@Injectable()
export class PrismaModuleRepository implements IModuleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByCourseIdAndOrder(
    courseId: string,
    order: number,
  ): Promise<Either<Error, Module>> {
    try {
      const data = await this.prisma.module.findFirst({
        where: {
          courseId,
          order,
        },
        include: {
          translations: true,
        },
      });

      if (!data) {
        return left(new Error('Module not found'));
      }

      const translationsVO = data.translations.map((tr) => ({
        locale: tr.locale as 'pt' | 'it' | 'es',
        title: tr.title,
        description: tr.description,
      }));

      const moduleEntity = Module.reconstruct(
        {
          slug: data.slug,
          imageUrl: data.imageUrl || undefined,
          translations: translationsVO,
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
      const modTranslations = module.translations;

      await this.prisma.module.create({
        data: {
          id: module.id.toString(),
          slug: module.slug,
          imageUrl: module.imageUrl || null,
          order: module.order,
          courseId,
          createdAt: module.createdAt,
          updatedAt: module.updatedAt,
          translations: {
            create: modTranslations.map((mt) => ({
              id: new UniqueEntityID().toString(),
              locale: mt.locale,
              title: mt.title,
              description: mt.description,
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
        include: {
          translations: true,
        },
        orderBy: { order: 'asc' },
      });

      const modules = data.map((mod) => {
        const translationsVO = mod.translations.map((tr) => ({
          locale: tr.locale as 'pt' | 'it' | 'es',
          title: tr.title,
          description: tr.description,
        }));

        return Module.reconstruct(
          {
            slug: mod.slug,
            imageUrl: mod.imageUrl || undefined,
            translations: translationsVO,
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

      if (!mod) {
        return left(new Error('Module not found'));
      }

      const translationsVO = mod.translations.map((tr) => ({
        locale: tr.locale as 'pt' | 'it' | 'es',
        title: tr.title,
        description: tr.description,
      }));

      return right(
        Module.reconstruct(
          {
            slug: mod.slug,
            imageUrl: mod.imageUrl || undefined,
            translations: translationsVO,
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
      // Verificar se o módulo existe e buscar suas dependências
      const module = await this.prisma.module.findUnique({
        where: { id: moduleId },
        include: {
          lessons: {
            include: {
              translations: true,
              Video: true,
              documents: true,
            },
          },
        },
      });

      if (!module) {
        return left(new Error('Module not found'));
      }

      const dependencies: ModuleDependency[] = [];

      // Adicionar lições como dependências
      for (const lesson of module.lessons) {
        const ptTranslation = lesson.translations.find(
          (t) => t.locale === 'pt',
        );
        const lessonName = ptTranslation?.title || `Lesson ${lesson.id}`;

        dependencies.push({
          type: 'lesson',
          id: lesson.id,
          name: lessonName,
          relatedEntities: {
            videos: lesson.Video.length,
            documents: lesson.documents.length,
            flashcards: lesson.flashcardIds.length,
            quizzes: lesson.quizIds.length,
          },
        });
      }

      // Contar vídeos totais (através das lições)
      const totalVideos = module.lessons.reduce(
        (sum, lesson) => sum + lesson.Video.length,
        0,
      );

      const canDelete = dependencies.length === 0;

      return right({
        canDelete,
        totalDependencies: dependencies.length,
        summary: {
          lessons: module.lessons.length,
          videos: totalVideos,
        },
        dependencies,
      });
    } catch (err: any) {
      return left(new Error(`Failed to check dependencies: ${err.message}`));
    }
  }

  async delete(moduleId: string): Promise<Either<Error, void>> {
    try {
      // Usar transação para garantir atomicidade
      await this.prisma.$transaction(async (tx) => {
        // Verificar se o módulo existe
        const moduleExists = await tx.module.findUnique({
          where: { id: moduleId },
        });

        if (!moduleExists) {
          throw new Error('Module not found');
        }

        // Deletar traduções do módulo
        await tx.moduleTranslation.deleteMany({
          where: { moduleId },
        });

        // Deletar video links do módulo
        await tx.moduleVideoLink.deleteMany({
          where: { moduleId },
        });

        // Deletar o módulo
        await tx.module.delete({
          where: { id: moduleId },
        });
      });

      return right(undefined);
    } catch (err: any) {
      if (err.message === 'Module not found') {
        return left(new Error('Module not found'));
      }
      return left(new Error(`Failed to delete module: ${err.message}`));
    }
  }

  async findBySlug(slug: string): Promise<Either<Error, Module | null>> {
    try {
      const module = await this.prisma.module.findUnique({
        where: { slug },
        include: { translations: true },
      });

      if (!module) {
        return right(null);
      }

      const translationsVO = module.translations.map((tr) => ({
        locale: tr.locale as 'pt' | 'it' | 'es',
        title: tr.title,
        description: tr.description,
      }));

      return right(
        Module.reconstruct(
          {
            slug: module.slug,
            imageUrl: module.imageUrl || undefined,
            translations: translationsVO,
            order: module.order,
            videos: [],
            createdAt: module.createdAt,
            updatedAt: module.updatedAt,
          },
          new UniqueEntityID(module.id),
        ),
      );
    } catch (err: any) {
      return left(new Error(`Database error: ${err.message}`));
    }
  }

  async update(module: Module): Promise<Either<Error, void>> {
    try {
      await this.prisma.$transaction(async (tx) => {
        // Atualizar o módulo principal
        await tx.module.update({
          where: { id: module.id.toString() },
          data: {
            slug: module.slug,
            imageUrl: module.imageUrl || null,
            order: module.order,
            updatedAt: module.updatedAt,
          },
        });

        // Deletar traduções existentes
        await tx.moduleTranslation.deleteMany({
          where: { moduleId: module.id.toString() },
        });

        // Criar novas traduções
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
      const module = await this.prisma.module.findUnique({
        where: { id: moduleId },
        select: { courseId: true },
      });

      if (!module) {
        return left(new Error('Module not found'));
      }

      return right(module.courseId);
    } catch (err: any) {
      return left(new Error(`Database error: ${err.message}`));
    }
  }
}
