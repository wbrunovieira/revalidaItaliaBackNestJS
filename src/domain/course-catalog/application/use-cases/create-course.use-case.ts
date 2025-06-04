// src/domain/course-catalog/application/use-cases/create-course.use-case.ts
import { Either, left, right } from "@/core/either";
import { Injectable, Inject } from "@nestjs/common";
import { z } from "zod";
import { Course } from "@/domain/course-catalog/enterprise/entities/course.entity";
import { Module } from "@/domain/course-catalog/enterprise/entities/module.entity";
import { ICourseRepository } from "../repositories/i-course-repository";
import { CreateCourseRequest } from "../dtos/create-course-request.dto";

import { InvalidInputError } from "./errors/invalid-input-error";
import { RepositoryError } from "./errors/repository-error";
import { DuplicateCourseError } from "./errors/duplicate-course-error";
import { CreateCourseSchema, createCourseSchema } from "./validations/create-course.schema";

type CreateCourseUseCaseResponse = Either<
  | InvalidInputError
  | DuplicateCourseError
  | RepositoryError
  | Error,
  { course: { id: string; title: string; description: string; modules: Array<{ id: string; title: string; order: number }> } }
>;

@Injectable()
export class CreateCourseUseCase {
  constructor(
    @Inject("CourseRepository")
    private readonly courseRepository: ICourseRepository
  ) {}

  async execute(
    request: CreateCourseRequest
  ): Promise<CreateCourseUseCaseResponse> {
    // 1) Validação com Zod
    const parseResult = createCourseSchema.safeParse(request);
    if (!parseResult.success) {
      // mapeamos issues para detalhes legíveis
      const details = parseResult.error.issues.map((issue) => {
        const detail: any = {
          code: issue.code,
          message: issue.message,
          path: issue.path,
        };
        if (issue.code === "invalid_type") {
          detail.expected = "string|number";
          detail.received = (issue as any).received;
        } else if ("expected" in issue) {
          detail.expected = (issue as any).expected;
        }
        if ("received" in issue && issue.code !== "invalid_type") {
          detail.received = (issue as any).received;
        }
        if ("minimum" in issue) detail.minimum = (issue as any).minimum;
        if ("inclusive" in issue) detail.inclusive = (issue as any).inclusive;
        return detail;
      });
      return left(new InvalidInputError("Validation failed", details));
    }

    const data: CreateCourseSchema = parseResult.data;
    const { title, description, modules: modulesDto } = data;

    // 2) (Opcional) Verificar se já existe um curso com o mesmo título
    try {
      const existing = await this.courseRepository.findByTitle(title);
      if (existing.isRight()) {
        return left(new DuplicateCourseError());
      }
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }

    // 3) Construir entidades: Course + módulos
    let modulesEntities: Module[] = [];
    if (Array.isArray(modulesDto) && modulesDto.length > 0) {
      modulesEntities = modulesDto.map((modDto) => {
        // Vídeos poderiam ser criados aqui, mas neste exemplo só criamos módulos
        return Module.create({
          title: modDto.title,
          order: modDto.order,
          videos: [], // iniciamos sem vídeos
        });
      });
    }

    const course = Course.create({
      title,
      description,
      modules: modulesEntities,
    });

    // 4) Persistir pelo repositório
    try {
      const createdOrError = await this.courseRepository.create(course);
      if (createdOrError.isLeft()) {
        return left(new RepositoryError(createdOrError.value.message));
      }
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }

    // 5) Montar objeto de saída (somente campos necessários)
    const responsePayload = {
      course: {
        id: course.id.toString(),
        title: course.title,
        description: course.description,
        modules: course.modules.map((mod) => ({
          id: mod.id.toString(),
          title: mod.title,
          order: mod.order,
        })),
      },
    };

    return right(responsePayload);
  }
}