// ─────────────────────────────────────────────────────────────────
// src/infra/database/prisma/repositories/prisma-course-repository.ts
// ─────────────────────────────────────────────────────────────────
import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { Either, left, right } from "@/core/either";
import { ICourseRepository } from "@/domain/course-catalog/application/repositories/i-course-repository";
import { Course } from "@/domain/course-catalog/enterprise/entities/course.entity";
import { UniqueEntityID } from "@/core/unique-entity-id";

@Injectable()
export class PrismaCourseRepository implements ICourseRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Busca um curso pelo título em português (para verificar duplicidade).
   * Agora traz também o slug para reconstruir a entidade.
   */
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
        },
      });

      if (!data) {
        return left(new Error("Course not found"));
      }

      const courseTr = data.translations[0];
      const courseProps = {
        slug: data.slug,
        translations: [
          {
            locale: courseTr.locale as "pt",
            title: courseTr.title,
            description: courseTr.description,
          },
        ],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };

      const courseEntity = Course.reconstruct(
        courseProps,
        new UniqueEntityID(data.id)
      );

      return right(courseEntity);
    } catch (err: any) {
      return left(new Error("Database error"));
    }
  }

  /**
   * Cria um curso simples, apenas com slug e traduções.
   */
  async create(course: Course): Promise<Either<Error, void>> {
    try {
      const courseTranslations = course.translations;

      await this.prisma.course.create({
        data: {
          id: course.id.toString(),
          slug: course.slug,
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
      return left(new Error("Failed to create course"));
    }
  }

  async findAll(): Promise<Either<Error, Course[]>> {
    try {
      const data = await this.prisma.course.findMany({
        include: {
          translations: { where: { locale: "pt" }, take: 1 },
        
        },
      });

      const courses = data.map((item) => {
        const tr = item.translations[0];
        const props = {
          slug: item.slug,
          translations: [
            { locale: tr.locale as "pt", title: tr.title, description: tr.description },
          ],
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        };
        return Course.reconstruct(props, new UniqueEntityID(item.id));
      });
      return right(courses);
    } catch (err: any) {
      return left(new Error("Database error"));
    }
  }
}