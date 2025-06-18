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
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateVideoUseCase } from '@/domain/course-catalog/application/use-cases/create-video.use-case';
import { GetVideoUseCase } from '@/domain/course-catalog/application/use-cases/get-video.use-case';
import { GetVideosUseCase } from '@/domain/course-catalog/application/use-cases/get-videos.use-case';
import { CreateVideoRequest } from '@/domain/course-catalog/application/dtos/create-video-request.dto';
import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';
import { LessonNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/lesson-not-found-error';
import { DuplicateVideoError } from '@/domain/course-catalog/application/use-cases/errors/duplicate-video-error';
import { VideoNotFoundError } from '@/domain/course-catalog/application/use-cases/errors/video-not-found-error';

@Controller('courses/:courseId/lessons/:lessonId/videos')
export class VideoController {
  constructor(
    private readonly createVideo: CreateVideoUseCase,
    private readonly getVideo: GetVideoUseCase,
    private readonly listVideos: GetVideosUseCase,
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
    // 1) verify that lesson exists under this course
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { select: { courseId: true } } },
    });
    if (!lesson || lesson.module.courseId !== courseId) {
      throw new NotFoundException('Lesson not found');
    }

    // 2) fetch videos for that lesson
    const result = await this.listVideos.execute({ lessonId });
    if (result.isLeft()) {
      const err = result.value;
      if (err instanceof InvalidInputError) {
        throw new BadRequestException(err.details);
      }
      throw new InternalServerErrorException(err.message);
    }

    // 3) return the array of videos directly
    return result.value.videos;
  }

  // Get a single video by ID
  @Get(':videoId')
  async findOne(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Param('videoId', ParseUUIDPipe) videoId: string,
  ) {
    await this.validateLesson(courseId, lessonId);

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
}
