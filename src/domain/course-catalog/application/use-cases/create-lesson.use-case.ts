// src/domain/course-catalog/application/use-cases/create-lesson.use-case.ts
import { Injectable, Inject } from "@nestjs/common";
import { Either, left, right } from "@/core/either";
import { IModuleRepository } from "../repositories/i-module-repository";
import { ILessonRepository } from "../repositories/i-lesson-repository";
import { Lesson } from "@/domain/course-catalog/enterprise/entities/lesson.entity";
import { InvalidInputError } from "./errors/invalid-input-error";
import { ModuleNotFoundError } from "./errors/module-not-found-error";
import { RepositoryError } from "./errors/repository-error";
import {
  createLessonSchema,
  CreateLessonSchema,
} from "./validations/create-lesson.schema";
import { CreateLessonRequest } from "../dtos/create-lesson-request.dto";

export type CreateLessonUseCaseResponse = Either<
  InvalidInputError | ModuleNotFoundError | RepositoryError,
  {
    lesson: {
      id: string;
      moduleId: string;
      translations: Array<{
        locale: "pt" | "it" | "es";
        title: string;
        description?: string;
      }>;
    };
  }
>;

@Injectable()
export class CreateLessonUseCase {
  constructor(
    @Inject("ModuleRepository")
    private readonly moduleRepo: IModuleRepository,
    @Inject("LessonRepository")
    private readonly lessonRepo: ILessonRepository,
  ) {}

  async execute(
    request: CreateLessonRequest,
  ): Promise<CreateLessonUseCaseResponse> {
    // 1) validate input
    const parsed = createLessonSchema.safeParse(request);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        code: issue.code,
        message: issue.message,
        path: issue.path,
      }));
      return left(new InvalidInputError("Validation failed", details));
    }
    const data = parsed.data as CreateLessonSchema;

    // 2) ensure module exists
    const foundModule = await this.moduleRepo.findById(data.moduleId);
    if (foundModule.isLeft()) {
      return left(new ModuleNotFoundError());
    }

    // 3) build our domain entity — supply defaults for the other arrays:
    const lessonEntity = Lesson.create({
      moduleId:      data.moduleId,
      videoId:       undefined,
      flashcardIds:  [],
      quizIds:       [],
      commentIds:    [],
      translations:  data.translations,
    });

    // 4) persist
    const result = await this.lessonRepo.create(lessonEntity);
    if (result.isLeft()) {
      return left(new RepositoryError(result.value.message));
    }

    // 5) return
    return right({
      lesson: {
        id:           lessonEntity.id.toString(),
        moduleId:     lessonEntity.moduleId,
        translations: lessonEntity.translations,
      },
    });
  }
}