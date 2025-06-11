// src/infra/course-catalog/controllers/video.controller.ts
import {
  Controller,
  Post,
  Param,
  Body,
  Inject,
  BadRequestException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  Get,
} from '@nestjs/common';

import { CreateVideoUseCase } from '@/domain/course-catalog/application/use-cases/create-video.use-case';
import { CreateVideoDto } from '@/domain/course-catalog/application/dtos/create-video.dto';

import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { ModuleNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/module-not-found-error';
import { DuplicateVideoError } from '@/domain/course-catalog/application/use-cases/errors/duplicate-video-error';
import { GetVideoUseCase } from '@/domain/course-catalog/application/use-cases/get-video.use-case';
import { VideoNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/video-not-found-error';

@Controller('courses/:courseId/modules/:moduleId/videos')
export class VideoController {
  constructor(
    @Inject(CreateVideoUseCase)
    private readonly createVideoUseCase: CreateVideoUseCase,
    @Inject(GetVideoUseCase)
    private readonly getVideoUseCase: GetVideoUseCase,
  ) {}

  @Post()
  async create(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
    @Body() dto: CreateVideoDto,
  ) {
    const request = {
      moduleId,
      slug: dto.slug,
      providerVideoId: dto.providerVideoId,
      translations: dto.translations.map((t) => ({
        locale: t.locale,
        title: t.title,
        description: t.description,
      })),
    };

    const result = await this.createVideoUseCase.execute(request);

    if (result.isLeft()) {
      const error = result.value;
      if (error instanceof InvalidInputError) {
        throw new BadRequestException(error.details);
      }
      if (error instanceof ModuleNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof DuplicateVideoError) {
        throw new ConflictException(error.message);
      }
      throw new InternalServerErrorException(error.message);
    }

    return (result.value as any).video;
  }



  @Get(':videoId')
  async findOne(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
    @Param('videoId') videoId: string,
  ) {
    const result = await this.getVideoUseCase.execute({ id: videoId });

    if (result.isLeft()) {
      const error = result.value;
      if (error instanceof InvalidInputError) {
        throw new BadRequestException(error.details);
      }
      if (error instanceof VideoNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw new InternalServerErrorException(error.message);
    }

    return result.value.video;
  }

}