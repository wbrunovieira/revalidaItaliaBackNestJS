// src/domain/course-catalog/application/use-cases/create-course.use-case.ts
import { Either, left, right } from "@/core/either"
import { Injectable, Inject } from "@nestjs/common"
import { Course } from "@/domain/course-catalog/enterprise/entities/course.entity"
import { Module } from "@/domain/course-catalog/enterprise/entities/module.entity"
import { ICourseRepository } from "../repositories/i-course-repository"
import { CreateCourseRequest } from "../dtos/create-course-request.dto"
import { InvalidInputError } from "./errors/invalid-input-error"
import { RepositoryError } from "./errors/repository-error"
import { DuplicateCourseError } from "./errors/duplicate-course-error"
import {
  createCourseSchema,
  CreateCourseSchema,
} from "./validations/create-course.schema"

type CreateCourseUseCaseResponse = Either<
  InvalidInputError | DuplicateCourseError | RepositoryError | Error,
  {
    course: {
      id: string
      title: string
      description: string
      modules: Array<{ id: string; title: string; order: number }>
    }
  }
>

@Injectable()
export class CreateCourseUseCase {
  constructor(
    @Inject("CourseRepository")
    private readonly courseRepository: ICourseRepository
  ) {}

  async execute(
    request: CreateCourseRequest
  ): Promise<CreateCourseUseCaseResponse> {

    const parseResult = createCourseSchema.safeParse(request)
    if (!parseResult.success) {
      const details = parseResult.error.issues.map((issue) => {
        const detail: any = {
          code: issue.code,
          message: issue.message,
          path: issue.path,
        }
        if (issue.code === "invalid_type") {
          detail.expected = "string|number"
          detail.received = (issue as any).received
        } else if ("expected" in issue) {
          detail.expected = (issue as any).expected
        }
        if ("received" in issue && issue.code !== "invalid_type") {
          detail.received = (issue as any).received
        }
        if ("minimum" in issue) detail.minimum = (issue as any).minimum
        return detail
      })
      return left(new InvalidInputError("Validation failed", details))
    }

    const data: CreateCourseSchema = parseResult.data

  
    try {
      const ptCourse = data.translations.find((t) => t.locale === "pt")!
      const existing = await this.courseRepository.findByTitle(ptCourse.title)
      if (existing.isRight()) {
        return left(new DuplicateCourseError())
      }
    } catch (err: any) {
      return left(new RepositoryError(err.message))
    }

  
    const modulesEntities: Module[] = (data.modules ?? []).map((modDto) => {
      return Module.create(
        {
          translations: modDto.translations, 
          order: modDto.order,
          videos: [],
        }
      )
    })

   
    const course = Course.create({
      translations: data.translations, 
      modules: modulesEntities,
    })

    try {
      const createdOrError = await this.courseRepository.create(course)
      if (createdOrError.isLeft()) {
        return left(new RepositoryError(createdOrError.value.message))
      }
    } catch (err: any) {
      return left(new RepositoryError(err.message))
    }


    const responsePayload = {
      course: {
        id: course.id.toString(),
        title: course.title,            
        description: course.description,  
        modules: modulesEntities.map((mod) => ({
          id: mod.id.toString(),
          title: mod.title,               
          order: mod.order,
        })),
      },
    }

    return right(responsePayload)
  }
}