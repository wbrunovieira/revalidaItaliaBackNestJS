// src/domain/course-catalog/application/use-cases/get-course.use-case.ts
import { Either, left, right } from "@/core/either";
import { Injectable, Inject } from "@nestjs/common";
import { Course } from "@/domain/course-catalog/enterprise/entities/course.entity";
import { ICourseRepository } from "../repositories/i-course-repository";
import { GetCourseRequest } from "../dtos/get-course-request.dto";
import { InvalidInputError } from "./errors/invalid-input-error";
import { RepositoryError } from "./errors/repository-error";
import { CourseNotFoundError } from "./errors/course-not-found-error";
import { GetCourseSchema, getCourseSchema } from "./validations/get-course.schema";

type GetCourseUseCaseResponse = Either<
  | InvalidInputError
  | CourseNotFoundError
  | RepositoryError
  | Error,
  {
    course: {
      id: string;
      slug: string;
      translations: Array<{
        locale: "pt" | "it" | "es";
        title: string;
        description: string;
      }>;
    };
  }
>;

@Injectable()
export class GetCourseUseCase {
  constructor(
    @Inject("CourseRepository")
    private readonly courseRepository: ICourseRepository
  ) {}

  async execute(
    request: GetCourseRequest
  ): Promise<GetCourseUseCaseResponse> {

    const parseResult = getCourseSchema.safeParse(request);
    if (!parseResult.success) {
      const details = parseResult.error.issues.map((issue) => ({
        code: issue.code,
        message: issue.message,
        path: issue.path,
      }));
      return left(new InvalidInputError("Validation failed", details));
    }

    const data: GetCourseSchema = parseResult.data;
    const courseId = data.id;


    try {
      const found = await this.courseRepository.findById(courseId);
      if (found.isLeft()) {
        return left(new CourseNotFoundError());
      }
      const courseEntity = found.value as Course;

      // 3) Montar payload com todas as traduções
      const payload = {
        course: {
          id: courseEntity.id.toString(),
          slug: courseEntity.slug,
          translations: courseEntity.translations.map((tr) => ({
            locale: tr.locale,
            title: tr.title,
            description: tr.description,
          })),
        },
      };
      return right(payload);
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }
  }
}