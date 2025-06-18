// src/infra/course-catalog/controllers/video.controller.ts

import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  BadRequestException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  ParseUUIDPipe,
} from "@nestjs/common";
import { CreateVideoUseCase } from "@/domain/course-catalog/application/use-cases/create-video.use-case";
import { GetVideoUseCase }    from "@/domain/course-catalog/application/use-cases/get-video.use-case";
import { GetVideosUseCase }   from "@/domain/course-catalog/application/use-cases/get-videos.use-case";
import { PrismaService }      from "@/prisma/prisma.service";
import { CreateVideoDto }     from "@/domain/course-catalog/application/dtos/create-video.dto";

import { InvalidInputError }   from "@/domain/course-catalog/application/use-cases/errors/invalid-input-error";
import { LessonNotFoundError } from "@/domain/course-catalog/application/use-cases/errors/lesson-not-found-error";
import { DuplicateVideoError } from "@/domain/course-catalog/application/use-cases/errors/duplicate-video-error";
import { VideoNotFoundError }  from "@/domain/course-catalog/application/use-cases/errors/video-not-found-error";

@Controller("courses/:courseId/modules/:moduleId/videos")
export class VideoController {
  constructor(
    private readonly createUseCase: CreateVideoUseCase,
    private readonly getUseCase:    GetVideoUseCase,
    private readonly listUseCase:   GetVideosUseCase,
    private readonly prisma:        PrismaService,
  ) {}

  @Post()
  async create(
    @Param("courseId") courseId: string,
    @Param("moduleId") moduleId: string,
    @Body() dto: CreateVideoDto,
  ) {
    // 1) verifica se o módulo existe e pertence ao curso
    const mod = await this.prisma.module.findUnique({ where: { id: moduleId } });
    if (!mod || mod.courseId !== courseId) {
      throw new NotFoundException(`Module ${moduleId} not found in course ${courseId}`);
    }

    // 2) auto‐cria ou busca a lesson associada
    const lesson = await this.prisma.lesson.create({ data: { moduleId } });

    // 3) dispara o use‐case passando lessonId
    const result = await this.createUseCase.execute({
      lessonId: lesson.id,
      slug: dto.slug,
      providerVideoId: dto.providerVideoId,
      translations: dto.translations,
    });

    if (result.isLeft()) {
      const err = result.value;
      if (err instanceof InvalidInputError)   throw new BadRequestException(err.details);
      if (err instanceof LessonNotFoundError) throw new NotFoundException(err.message);
      if (err instanceof DuplicateVideoError) throw new ConflictException(err.message);
      throw new InternalServerErrorException(err.message);
    }

    return result.value.video;
  }

  @Get(":videoId")
  async findOne(
    @Param("courseId") _courseId: string,
    @Param("moduleId") _moduleId: string,
    @Param("videoId", ParseUUIDPipe) videoId: string,
  ) {
    const result = await this.getUseCase.execute({ id: videoId });
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
    @Param("courseId") courseId: string,
    @Param("moduleId") moduleId: string,
  ) {
    const result = await this.listUseCase.execute({ courseId, moduleId });
    if (result.isLeft()) {
      const err = result.value;
      if (err instanceof InvalidInputError) throw new BadRequestException(err.details);
      throw new InternalServerErrorException(err.message);
    }
    return result.value.videos;
  }
}