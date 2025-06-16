// src/infra/course-catalog/controllers/video.controller.ts
import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Inject,
  BadRequestException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateVideoUseCase } from '@/domain/course-catalog/application/use-cases/create-video.use-case';
import { GetVideoUseCase }    from '@/domain/course-catalog/application/use-cases/get-video.use-case';
import { GetVideosUseCase }   from '@/domain/course-catalog/application/use-cases/get-videos.use-case';
import { CreateVideoDto }     from '@/domain/course-catalog/application/dtos/create-video.dto';

import { InvalidInputError }      from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { ModuleNotFoundError }    from '@/domain/course-catalog/application/use-cases/errors/module-not-found-error';
import { DuplicateVideoError }    from '@/domain/course-catalog/application/use-cases/errors/duplicate-video-error';
import { VideoNotFoundError }     from '@/domain/course-catalog/application/use-cases/errors/video-not-found-error';

@Controller('courses/:courseId/modules/:moduleId/videos')
export class VideoController {
  constructor(
    @Inject(CreateVideoUseCase)
    private readonly createVideoUseCase: CreateVideoUseCase,

    @Inject(GetVideoUseCase)
    private readonly getVideoUseCase: GetVideoUseCase,

    @Inject(GetVideosUseCase)
    private readonly getVideosUseCase: GetVideosUseCase,

    private readonly prisma: PrismaService,           // ← new
  ) {}

  @Post()
  async create(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
    @Body() dto: CreateVideoDto,
  ) {
    // 1) verify module belongs to that course
    const module = await this.prisma.module.findUnique({ where: { id: moduleId } });
    if (!module || module.courseId !== courseId) {
      throw new NotFoundException(`Module ${moduleId} not found in course ${courseId}`);
    }

    // 2) auto-create a lesson under that module
    const lesson = await this.prisma.lesson.create({
      data: { moduleId },
    });

    // 3) hand off to your use‐case, now passing lessonId instead of moduleId
    const result = await this.createVideoUseCase.execute({
      lessonId: lesson.id,                     // ← changed
      slug: dto.slug,
      providerVideoId: dto.providerVideoId,
      translations: dto.translations,
    });

    if (result.isLeft()) {
      const err = result.value;
      if (err instanceof InvalidInputError)      throw new BadRequestException(err.details);
      if (err instanceof ModuleNotFoundError)    throw new NotFoundException(err.message);
      if (err instanceof DuplicateVideoError)    throw new ConflictException(err.message);
      throw new InternalServerErrorException(err.message);
    }

    // 4) return the new Video DTO
    return result.value.video;
  }

  @Get(':videoId')
  async findOne(
    @Param('courseId') _courseId: string,      // we could verify ownership here too
    @Param('moduleId') _moduleId: string,
    @Param('videoId', ParseUUIDPipe) videoId: string,  // ← invalid UUID → 400
  ) {
    const result = await this.getVideoUseCase.execute({ id: videoId });
    if (result.isLeft()) {
      const err = result.value;
      if (err instanceof InvalidInputError)   throw new BadRequestException(err.details);
      if (err instanceof VideoNotFoundError)  throw new NotFoundException(err.message);
      throw new InternalServerErrorException(err.message);
    }
    return result.value.video;
  }

  @Get()
  async findAll(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
  ) {
    const result = await this.getVideosUseCase.execute({ courseId, moduleId });
    if (result.isLeft()) {
      const err = result.value;
      if (err instanceof InvalidInputError) throw new BadRequestException(err.details);
      throw new InternalServerErrorException(err.message);
    }
    return result.value.videos;
  }
}