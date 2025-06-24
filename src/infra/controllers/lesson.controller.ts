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
} from '@nestjs/common';
import { CreateLessonUseCase } from '@/domain/course-catalog/application/use-cases/create-lesson.use-case';
import { ListLessonsUseCase } from '@/domain/course-catalog/application/use-cases/list-lessons.use-case';
import { CreateLessonRequest } from '@/domain/course-catalog/application/dtos/create-lesson-request.dto';
import { ListLessonsRequest } from '@/domain/course-catalog/application/dtos/list-lessons-request.dto';
import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { ModuleNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/module-not-found-error';
import { RepositoryError } from '@/domain/course-catalog/application/use-cases/errors/repository-error';
import { VideoNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/video-not-found-error';

@Controller('courses/:courseId/modules/:moduleId/lessons')
export class LessonController {
  constructor(
    private readonly createLesson: CreateLessonUseCase,
    private readonly listLessons: ListLessonsUseCase,
  ) {}

  @Post()
  async create(
    @Param('moduleId') moduleId: string,
    @Body() dto: Omit<CreateLessonRequest, 'moduleId'>,
  ) {
    const result = await this.createLesson.execute({
      moduleId,
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

    const { lesson } = result.value;
    return lesson;
  }

  @Get()
  async list(
    @Param('moduleId') moduleId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('includeVideo') includeVideo = 'false',
  ) {
    // Build request DTO
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

    // On success, return full response
    return result.value;
  }
}
