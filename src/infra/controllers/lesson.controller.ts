// src/infra/course-catalog/controllers/lesson.controller.ts
import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Delete,
  ConflictException,
} from '@nestjs/common';
import { CreateLessonUseCase } from '@/domain/course-catalog/application/use-cases/create-lesson.use-case';
import { ListLessonsUseCase } from '@/domain/course-catalog/application/use-cases/list-lessons.use-case';
import { GetLessonUseCase } from '@/domain/course-catalog/application/use-cases/get-lesson.use-case';
import { DeleteLessonUseCase } from '@/domain/course-catalog/application/use-cases/delete-lesson.use-case';
import { CreateLessonRequest } from '@/domain/course-catalog/application/dtos/create-lesson-request.dto';
import { ListLessonsRequest } from '@/domain/course-catalog/application/dtos/list-lessons-request.dto';
import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { ModuleNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/module-not-found-error';
import { LessonNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/lesson-not-found-error';
import { LessonHasDependenciesError } from '@/domain/course-catalog/application/use-cases/errors/lesson-has-dependencies-error';
import { RepositoryError } from '@/domain/course-catalog/application/use-cases/errors/repository-error';
import { VideoNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/video-not-found-error';

@Controller('courses/:courseId/modules/:moduleId/lessons')
export class LessonController {
  constructor(
    private readonly createLesson: CreateLessonUseCase,
    private readonly listLessons: ListLessonsUseCase,
    private readonly getLesson: GetLessonUseCase,
    private readonly deleteLesson: DeleteLessonUseCase,
  ) {}

  @Post()
  async create(
    @Param('moduleId') moduleId: string,
    @Body() dto: Omit<CreateLessonRequest, 'moduleId'>,
  ) {
    const result = await this.createLesson.execute({
      moduleId,
      order: dto.order,
      imageUrl: dto.imageUrl,
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

    return result.value.lesson;
  }

  @Get()
  async list(
    @Param('moduleId') moduleId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('includeVideo') includeVideo = 'false',
  ) {
    const req: ListLessonsRequest = {
      moduleId,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      includeVideo: includeVideo === 'true',
    };

    const result = await this.listLessons.execute(req);
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
      if (err instanceof RepositoryError) {
        const ex = new InternalServerErrorException(err.message);
        (ex as any).response = err.message;
        throw ex;
      }
      const ex = new InternalServerErrorException('Unknown error occurred');
      (ex as any).response = 'Unknown error occurred';
      throw ex;
    }

    return result.value;
  }

  @Get(':lessonId')
  async get(@Param('lessonId') lessonId: string) {
    const result = await this.getLesson.execute({ id: lessonId });

    if (result.isLeft()) {
      const err = result.value;
      if (err instanceof InvalidInputError) {
        const ex = new BadRequestException(err.details);
        (ex as any).response = err.details;
        throw ex;
      }
      if (err instanceof LessonNotFoundError) {
        const ex = new NotFoundException(err.message);
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

    return result.value;
  }

  @Delete(':lessonId')
  async delete(@Param('lessonId') lessonId: string) {
    const result = await this.deleteLesson.execute({ id: lessonId });

    if (result.isLeft()) {
      const err = result.value;
      if (err instanceof InvalidInputError) {
        const ex = new BadRequestException(err.details);
        (ex as any).response = err.details;
        throw ex;
      }
      if (err instanceof LessonNotFoundError) {
        const ex = new NotFoundException(err.message);
        (ex as any).response = err.message;
        throw ex;
      }
      if (err instanceof LessonHasDependenciesError) {
        const errorWithInfo = err as any;
        const ex = new ConflictException({
          message: err.message,
          statusCode: 409,
          error: 'Conflict',
          dependencyInfo: errorWithInfo.dependencyInfo,
        });
        (ex as any).response = {
          message: err.message,
          statusCode: 409,
          error: 'Conflict',
          dependencyInfo: errorWithInfo.dependencyInfo,
        };
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

    return result.value;
  }
}
