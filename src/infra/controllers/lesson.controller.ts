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
import { VideoNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/video-not-found-error';

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
      videoId: dto.videoId,
    });

    if (result.isLeft()) {
      const err = result.value;

      if (err instanceof InvalidInputError) {
        const ex = new BadRequestException(err.details);
        (ex as any).response = err.details;
        throw ex;
      }

      if (err instanceof ModuleNotFoundError) {
        const ex = new NotFoundException(err.message);
        (ex as any).response = err.message;
        throw ex;
      }

      if (err instanceof VideoNotFoundError) {
        const ex = new BadRequestException(err.message);
        (ex as any).response = err.message;
        throw ex;
      }

      if (err instanceof RepositoryError) {
        const ex = new InternalServerErrorException(err.message);
        (ex as any).response = err.message;
        throw ex;
      }

      const ex = new InternalServerErrorException('Unknown error occurred');
      (ex as any).response = 'Unknown error occurred';
      throw ex;
    }

    const { lesson } = result.value as {
      lesson: {
        id: string;
        moduleId: string;
        videoId?: string;
        translations: any[];
      };
    };
    return lesson;
  }
}
