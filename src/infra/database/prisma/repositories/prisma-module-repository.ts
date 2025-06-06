// src/infra/course-catalog/repositories/prisma-module-repository.ts
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
    order: number
  ): Promise<Either<Error, Module>> {
    try {
      const data = await this.prisma.module.findFirst({
        where: {
          courseId,
          order,
        },
        include: {
          translations: {
            where: { locale: 'pt' },
            take: 1,
          },
        },
      });

      if (!data) {
        return left(new Error('Module not found'));
      }

      const modTr = data.translations[0];
      const moduleProps = {
        slug: data.slug,
        translations: [
          {
            locale: modTr.locale as 'pt',
            title: modTr.title,
            description: modTr.description,
          },
        ],
        order: data.order,
        videos: [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
      const moduleEntity = Module.reconstruct(
        moduleProps,
        new UniqueEntityID(data.id)
      );
      return right(moduleEntity);
    } catch (err: any) {
      return left(new Error('Database error'));
    }
  }

  async create(
    courseId: string,
    module: Module
  ): Promise<Either<Error, void>> {
    try {
      const modTranslations = module.translations;
      await this.prisma.module.create({
        data: {
          id: module.id.toString(),
          slug: module.slug,
          order: module.order,
          course: { connect: { id: courseId } },
          createdAt: module.createdAt,
          updatedAt: module.updatedAt,
          translations: {
            create: modTranslations.map((t) => ({
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
      return left(new Error('Failed to create module'));
    }
  }
}