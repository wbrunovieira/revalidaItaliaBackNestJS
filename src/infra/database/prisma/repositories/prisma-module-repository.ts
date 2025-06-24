// src/infra/course-catalog/database/prisma/repositories/prisma-module-repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Either, left, right } from '@/core/either';
import { IModuleRepository } from '@/domain/course-catalog/application/repositories/i-module-repository';
import { Module } from '@/domain/course-catalog/enterprise/entities/module.entity';
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
      return left(new Error('Database error'));
    }
  }

  async create(courseId: string, module: Module): Promise<Either<Error, void>> {
    try {
      const modTranslations = module.translations;

      console.log('🔍 DEBUG - Module entity:');
      console.log('ID:', module.id.toString());
      console.log('Slug:', module.slug);
      console.log('ImageURL:', module.imageUrl); // ← Verificar este valor
      console.log('Order:', module.order);

      await this.prisma.module.create({
        data: {
          id: module.id.toString(),
          slug: module.slug,
          imageUrl: module.imageUrl || undefined,
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
      return left(new Error('Failed to create module'));
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
      return left(new Error('Database error'));
    }
  }

  async findById(moduleId: string): Promise<Either<Error, Module>> {
    try {
      const mod = await this.prisma.module.findUnique({
        where: { id: moduleId },
        include: { translations: true },
      });
      if (!mod) return left(new Error('Module not found'));
      const vos = mod.translations.map((tr) => ({
        locale: tr.locale as 'pt' | 'it' | 'es',
        title: tr.title,
        description: tr.description,
      }));
      return right(
        Module.reconstruct(
          {
            slug: mod.slug,
            imageUrl: mod.imageUrl || undefined,
            translations: vos,
            order: mod.order,
            videos: [],
            createdAt: mod.createdAt,
            updatedAt: mod.updatedAt,
          },
          new UniqueEntityID(mod.id),
        ),
      );
    } catch {
      return left(new Error('Database error'));
    }
  }
}
