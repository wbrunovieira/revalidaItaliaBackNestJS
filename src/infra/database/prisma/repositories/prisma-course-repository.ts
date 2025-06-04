// src/infra/database/prisma/repositories/prisma-course-repository.ts

import { Injectable } from "@nestjs/common"
import { PrismaService } from "@/prisma/prisma.service"
import { Either, left, right } from "@/core/either"
import { ICourseRepository } from "@/domain/course-catalog/application/repositories/i-course-repository"
import { Course } from "@/domain/course-catalog/enterprise/entities/course.entity"
import { Module } from "@/domain/course-catalog/enterprise/entities/module.entity"
import { UniqueEntityID } from "@/core/unique-entity-id"

@Injectable()
export class PrismaCourseRepository implements ICourseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByTitle(title: string): Promise<Either<Error, Course>> {
    try {
      const data = await this.prisma.course.findFirst({
        where: {
          translations: {
            some: {
              locale: "pt",
              title,
            },
          },
        },
        include: {
          translations: {
            where: { locale: "pt" },
            take: 1,
          },
          modules: {
            include: {
              translations: {
                where: { locale: "pt" },
                take: 1,
              },
            },
          },
        },
      })

      if (!data) {
        return left(new Error("Course not found"))
      }

 
      const modulesEntities: Module[] = data.modules.map((mod) => {
        const modTr = mod.translations[0]
        const moduleProps = {
          translations: [
            { locale: "pt" as const, title: modTr?.title ?? "Sem título", description: modTr?.description ?? "" }
   
          ],
          order: mod.order,
          videos: [],
          createdAt: mod.createdAt,
          updatedAt: mod.updatedAt,
        }
        return Module.reconstruct(moduleProps, new UniqueEntityID(mod.id))
      })


      const courseProps = {
        translations: [
          {
            locale: data.translations[0].locale as "pt",
            title: data.translations[0].title,
            description: data.translations[0].description,
          },
        ],
        modules: modulesEntities,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      }

      const courseEntity = Course.reconstruct(
        courseProps,
        new UniqueEntityID(data.id)
      )

      return right(courseEntity)
    } catch (err: any) {
      return left(new Error("Database error"))
    }
  }

 
  async create(course: Course): Promise<Either<Error, void>> {
    try {
   
      const courseTranslations = course.translations 


      const modulesDomain = course.modules 

      await this.prisma.course.create({
        data: {
          id: course.id.toString(),
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

      
          modules: {
            create: modulesDomain.map((mod) => {
              const modTranslations = mod.translations 

              return {
                id: mod.id.toString(),
                order: mod.order,
                createdAt: mod.createdAt,
                updatedAt: mod.updatedAt,

                translations: {
                  create: modTranslations.map((mt) => ({
                    id: new UniqueEntityID().toString(),
                    locale: mt.locale,
                    title: mt.title,
                    description: mt.description,
                  })),
                },
              }
            }),
          },
        },
      })

      return right(undefined)
    } catch (err: any) {
      return left(new Error("Failed to create course"))
    }
  }
}