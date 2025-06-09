// src/infra/course-catalog/database/prisma/repositories/prisma-module-repository.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { Either, left, right } from "@/core/either";
import { IModuleRepository } from "@/domain/course-catalog/application/repositories/i-module-repository";
import { Module } from "@/domain/course-catalog/enterprise/entities/module.entity";
import { UniqueEntityID } from "@/core/unique-entity-id";

@Injectable()
export class PrismaModuleRepository implements IModuleRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Finds a module by courseId and order.
   */
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
          translations: true,
        },
      });

      if (!data) {
        return left(new Error("Module not found"));
      }

      // Reconstruct entity
      const translationsVO = data.translations.map((tr) => ({
        locale: tr.locale as "pt" | "it" | "es",
        title: tr.title,
        description: tr.description,
      }));

      const moduleEntity = Module.reconstruct(
        {
          slug: data.slug,
          translations: translationsVO,
          order: data.order,
          videos: [],
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        },
        new UniqueEntityID(data.id)
      );

      return right(moduleEntity);
    } catch (err: any) {
      return left(new Error("Database error"));
    }
  }

  /**
   * Creates a new module under a given course.
   */
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
      return left(new Error("Failed to create module"));
    }
  }

  /**
   * Returns all modules for a given courseId.
   */
  async findByCourseId(courseId: string): Promise<Either<Error, Module[]>> {
    try {
      const data = await this.prisma.module.findMany({
        where: { courseId },
        include: {
          translations: true,
        },
        orderBy: { order: "asc" },
      });

      const modules = data.map((mod) => {
        const translationsVO = mod.translations.map((tr) => ({
          locale: tr.locale as "pt" | "it" | "es",
          title: tr.title,
          description: tr.description,
        }));

        return Module.reconstruct(
          {
            slug: mod.slug,
            translations: translationsVO,
            order: mod.order,
            videos: [],
            createdAt: mod.createdAt,
            updatedAt: mod.updatedAt,
          },
          new UniqueEntityID(mod.id)
        );
      });

      return right(modules);
    } catch (err: any) {
      return left(new Error("Database error"));
    }
  }
}