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

  /**
   * Busca um curso pelo título em português (locale = "pt").
   * Retorna a entidade Course com módulos e vídeos marcados como não carregados.
   */
  async findByTitle(
    title: string,
    locale: "pt" = "pt"
  ): Promise<Either<Error, Course>> {
    try {
      // Procuramos na tabela CourseTranslation onde locale = "pt" e title casem exatamente
      const data = await this.prisma.course.findFirst({
        where: {
          translations: {
            some: {
              locale,
              title,
            },
          },
        },
        include: {
          translations: {
            where: { locale },
            take: 1,
          },
          modules: {
            include: {
              translations: {
                where: { locale },
                take: 1,
              },
            },
          },
        },
      })

      if (!data) {
        return left(new Error("Course not found"))
      }

      // A tradução em pt já vem em data.translations[0]
      const courseTr = data.translations[0]
      if (!courseTr) {
        return left(new Error("Course translation not found"))
      }

      // Reconstituir cada módulo com título/descrição em pt
      const modulesEntities: Module[] = data.modules.map((mod) => {
        const modTr = mod.translations[0]
        if (!modTr) {
          // Se faltou tradução, usa título genérico "Sem título"
          return Module.reconstruct(
            {
              title: "Sem título",
              order: mod.order,
              videos: [],
              createdAt: mod.createdAt,
              updatedAt: mod.updatedAt,
            },
            new UniqueEntityID(mod.id)
          )
        }

        const moduleProps = {
          title: modTr.title,
          order: mod.order,
          videos: [],
          createdAt: mod.createdAt,
          updatedAt: mod.updatedAt,
        }

        return Module.reconstruct(moduleProps, new UniqueEntityID(mod.id))
      })

      // Reconstituir o Course com título/descrição em pt
      const courseProps = {
        title: courseTr.title,
        description: courseTr.description,
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

  /**
   * Cria um novo curso em português (locale = "pt"), incluindo módulos
   * com título/descrição em pt. Ignora outras línguas por enquanto.
   */
  async create(course: Course): Promise<Either<Error, void>> {
    try {
      // Extraímos do Course os valores em português
      // Assumimos que Course.toResponseObject() já traz title/description em pt
      const { title, description, modules, createdAt, updatedAt } =
        course.toResponseObject()

      await this.prisma.course.create({
        data: {
          id:        course.id.toString(),
          createdAt: createdAt,
          updatedAt: updatedAt,
          // Criar apenas tradução em pt
          translations: {
            create: {
              id:          new UniqueEntityID().toString(),
              locale:      "pt",
              title:       title,
              description: description,
            },
          },
          modules: {
            create: modules.map((modSummary) => {
              // Cada modSummary só tem id/title/order; mas precisamos recriar ModuleProps em pt
              // Para isso, esperamos que o próprio objeto Module venha com valores em pt
              const mod = course.modules.find((m) => m.id.toString() === modSummary.id)
              if (!mod) {
                throw new Error("Module entity mismatch")
              }

              return {
                id:        mod.id.toString(),
                order:     mod.order,
                createdAt: mod.createdAt,
                updatedAt: mod.updatedAt,
                translations: {
                  create: {
                    id:          new UniqueEntityID().toString(),
                    locale:      "pt",
                    title:       mod.title,
                    description: "", // se precisar, adapte para pegar descrição do módulo
                  },
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