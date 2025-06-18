// src/infra/course-catalog/controllers/lesson.controller.ts
import {
  Controller,
  Post,
  Param,
  Body,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateLessonUseCase } from '@/domain/course-catalog/application/use-cases/create-lesson.use-case';
import { CreateLessonRequest } from '@/domain/course-catalog/application/dtos/create-lesson-request.dto';
import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { ModuleNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/module-not-found-error';
import { RepositoryError } from '@/domain/course-catalog/application/use-cases/errors/repository-error';

@Controller('courses/:courseId/modules/:moduleId/lessons')
export class LessonController {
  constructor(private readonly createLesson: CreateLessonUseCase) {}

  @Post()
  async create(
    @Param('moduleId') moduleId: string,
    @Body() dto: Omit<CreateLessonRequest, 'moduleId'>,
  ) {
    const result = await this.createLesson.execute({
      moduleId,
      translations: dto.translations,
    });

    if (result.isLeft()) {
      const err = result.value;

      if (err instanceof InvalidInputError) {
        // Throw with the raw details array as the response
        const ex = new BadRequestException(err.details);
        (ex as any).response = err.details;
        throw ex;
      }

      if (err instanceof ModuleNotFoundError) {
        // Throw with the raw message string as the response
        const ex = new NotFoundException(err.message);
        (ex as any).response = err.message;
        throw ex;
      }

      if (err instanceof RepositoryError) {
        // Throw with the raw message string as the response
        const ex = new InternalServerErrorException(err.message);
        (ex as any).response = err.message;
        throw ex;
      }
    }

    // At this point it's a Right, so we know value has a .lesson
    const { lesson } = result.value as { lesson: { id: string; moduleId: string; translations: any[] } };
    return lesson;
  }
}