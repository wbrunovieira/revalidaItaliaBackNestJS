//src/infra/controllers/video.controller.ts

import {
  Controller,
  Post,
  Get,
  Put,
  Param,
  Body,
  BadRequestException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
  Delete,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateVideoUseCase } from '@/domain/course-catalog/application/use-cases/create-video.use-case';
import { GetVideoUseCase } from '@/domain/course-catalog/application/use-cases/get-video.use-case';
import { UpdateVideoUseCase } from '@/domain/course-catalog/application/use-cases/update-video.use-case';

import { CreateVideoRequest } from '@/domain/course-catalog/application/dtos/create-video-request.dto';
import { UpdateVideoDto } from './dtos/update-video.dto';
import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { LessonNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/lesson-not-found-error';
import { LessonNotFoundError as UpdateLessonNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/lesson-not-found.error';
import { DuplicateVideoError } from '@/domain/course-catalog/application/use-cases/errors/duplicate-video-error';
import { VideoNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/video-not-found-error';
import { ListVideosUseCase } from '@/domain/course-catalog/application/use-cases/list-videos.use-case';
import { DeleteVideoUseCase } from '@/domain/course-catalog/application/use-cases/delete-video.use-case';
import { VideoHasDependenciesError } from '@/domain/course-catalog/application/use-cases/errors/video-has-dependencies-error';

@Controller('courses/:courseId/lessons/:lessonId/videos')
export class VideoController {
  constructor(
    private readonly createVideo: CreateVideoUseCase,
    private readonly getVideo: GetVideoUseCase,
    private readonly updateVideo: UpdateVideoUseCase,
    private readonly listVideos: ListVideosUseCase,
    private readonly deleteVideo: DeleteVideoUseCase,
    private readonly prisma: PrismaService,
  ) {}

  private async validateLesson(courseId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { select: { courseId: true } } },
    });
    if (!lesson || lesson.module.courseId !== courseId) {
      throw new NotFoundException('Lesson not found');
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() body: Omit<CreateVideoRequest, 'lessonId'>,
  ) {
    // Verify lesson exists and belongs to course
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { select: { courseId: true } } },
    });
    if (!lesson || lesson.module.courseId !== courseId) {
      throw new NotFoundException('Lesson not found');
    }

    const result = await this.createVideo.execute({ ...body, lessonId });
    if (result.isLeft()) {
      const err = result.value;
      if (err instanceof InvalidInputError) {
        throw new BadRequestException(err.details);
      }
      if (err instanceof LessonNotFoundError) {
        throw new NotFoundException(err.message);
      }
      if (err instanceof DuplicateVideoError) {
        throw new ConflictException(err.message);
      }
      throw new InternalServerErrorException(err.message);
    }

    // Return created video with translations
    const { video, translations } = result.value;
    return {
      id: video.id,
      slug: video.slug,
      providerVideoId: video.providerVideoId,
      durationInSeconds: video.durationInSeconds,
      isSeen: video.isSeen,
      translations,
    };
  }

  // List all videos for a lesson
  @Get()
  async findAll(
    @Param('courseId') courseId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
  ) {
    const result = await this.listVideos.execute({ lessonId });
    if (result.isLeft()) {
      const err = result.value;
      if (err instanceof InvalidInputError) {
        throw new BadRequestException(err.details);
      }
      throw new InternalServerErrorException(err.message);
    }
    return result.value.videos;
  }

  // Get a single video by ID
  @Get(':videoId')
  async findOne(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Param('videoId', ParseUUIDPipe) videoId: string,
  ) {
    console.log('entrada do get video by id videoId', videoId);
    console.log('entrada do get video by id courseId', courseId);
    console.log('entrada do get video by id lessonId', lessonId);

    // garante que o vídeo pertence àquela lesson
    const rec = await this.prisma.video.findUnique({ where: { id: videoId } });
    if (!rec || rec.lessonId !== lessonId) {
      throw new NotFoundException('Video not found in this lesson');
    }

    const result = await this.getVideo.execute({ id: videoId });
    if (result.isLeft()) {
      const err = result.value;
      if (err instanceof InvalidInputError)
        throw new BadRequestException(err.details);
      if (err instanceof VideoNotFoundError)
        throw new NotFoundException(err.message);
      throw new InternalServerErrorException(err.message);
    }

    return result.value.video;
  }

  @Put(':videoId')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Param('videoId', ParseUUIDPipe) videoId: string,
    @Body() body: UpdateVideoDto,
  ) {
    // 1. Validar se lesson existe e pertence ao course
    await this.validateLesson(courseId, lessonId);

    // 2. Validar se video pertence à lesson
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
    });
    if (!video || video.lessonId !== lessonId) {
      throw new NotFoundException('Video not found in this lesson');
    }

    // 3. Se está atualizando para uma nova lesson, validar se ela existe e pertence ao course
    if (body.lessonId !== undefined && body.lessonId !== null) {
      await this.validateLesson(courseId, body.lessonId);
    }

    // 4. Executar use-case
    const result = await this.updateVideo.execute({
      videoId,
      ...body,
    });

    // 5. Tratar erros
    if (result.isLeft()) {
      const err = result.value;

      if (err instanceof InvalidInputError) {
        throw new BadRequestException(err.details);
      }

      if (err instanceof VideoNotFoundError) {
        throw new NotFoundException(err.message);
      }

      if (err instanceof UpdateLessonNotFoundError) {
        throw new NotFoundException(err.message);
      }

      if (err instanceof DuplicateVideoError) {
        throw new ConflictException(err.message);
      }

      throw new InternalServerErrorException(err.message);
    }

    // 6. Retornar sucesso
    return result.value.video;
  }

  @Delete(':videoId')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Param('videoId', ParseUUIDPipe) videoId: string,
  ) {
    // 1. Validar se lesson existe e pertence ao course
    await this.validateLesson(courseId, lessonId);

    // 2. Validar se video pertence à lesson
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
    });
    if (!video || video.lessonId !== lessonId) {
      throw new NotFoundException('Video not found in this lesson');
    }

    // 3. Executar use-case (todas as validações estão lá)
    const result = await this.deleteVideo.execute({ id: videoId });

    // 4. Tratar erros
    if (result.isLeft()) {
      const err = result.value;

      if (err instanceof InvalidInputError) {
        throw new BadRequestException(err.details);
      }

      if (err instanceof VideoNotFoundError) {
        throw new NotFoundException(err.message);
      }

      if (err instanceof VideoHasDependenciesError) {
        throw new ConflictException({
          message: err.message,
          dependencyInfo: err.dependencyInfo,
        });
      }

      throw new InternalServerErrorException(err.message);
    }

    // 5. Retornar sucesso
    return result.value;
  }
}
