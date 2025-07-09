// src/domain/course-catalog/application/use-cases/list-lessons.use-case.ts
import { Injectable, Inject } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { IModuleRepository } from '../repositories/i-module-repository';
import { ILessonRepository } from '../repositories/i-lesson-repository';
import { IVideoRepository } from '../repositories/i-video-repository';
import { InvalidInputError } from './errors/invalid-input-error';
import { ModuleNotFoundError } from './errors/module-not-found-error';
import { RepositoryError } from './errors/repository-error';
import {
  listLessonsSchema,
  ListLessonsSchema,
} from './validations/list-lessons.schema';
import {
  ListLessonsResponse,
  LessonDto,
} from '../dtos/list-lessons-response.dto';
import { ListLessonsRequest } from '../dtos/list-lessons-request.dto';
import { UniqueEntityID } from '@/core/unique-entity-id';

// Tipo intermediário para lição com dados de vídeo opcionais
interface LessonWithOptionalVideo {
  id: UniqueEntityID;
  moduleId: string;
  videoId?: string;
  order: number;
  translations: Array<{
    locale: 'pt' | 'it' | 'es';
    title: string;
    description?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
  video?: {
    id: string;
    slug: string;
    title: string;
    providerVideoId: string;
    durationInSeconds: number;
    isSeen: boolean;
  };
}

export type ListLessonsUseCaseResponse = Either<
  InvalidInputError | ModuleNotFoundError | RepositoryError,
  ListLessonsResponse
>;

@Injectable()
export class ListLessonsUseCase {
  constructor(
    @Inject('ModuleRepository')
    private readonly moduleRepo: IModuleRepository,
    @Inject('LessonRepository')
    private readonly lessonRepo: ILessonRepository,
    @Inject('VideoRepository')
    private readonly videoRepo: IVideoRepository,
  ) {}

  async execute(
    request: ListLessonsRequest,
  ): Promise<ListLessonsUseCaseResponse> {
    // 1) Validate input
    const parsed = listLessonsSchema.safeParse(request);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        code: issue.code,
        message: issue.message,
        path: issue.path,
      }));
      return left(new InvalidInputError('Validation failed', details));
    }
    const data: ListLessonsSchema = parsed.data;

    // 2) Check if module exists
    const foundModule = await this.moduleRepo.findById(data.moduleId);
    if (foundModule.isLeft()) {
      return left(new ModuleNotFoundError());
    }

    // 3) Get lessons with pagination
    const offset = (data.page - 1) * data.limit;
    const lessonsResult = await this.lessonRepo.findByModuleId(
      data.moduleId,
      data.limit,
      offset,
    );

    if (lessonsResult.isLeft()) {
      return left(new RepositoryError(lessonsResult.value.message));
    }

    const { lessons, total } = lessonsResult.value;

    // 4) If includeVideo is true, fetch video data for lessons that have video
    let lessonsWithVideos: LessonWithOptionalVideo[] = lessons.map(
      (lesson, index): LessonWithOptionalVideo => ({
        id: lesson.id,
        moduleId: lesson.moduleId,
        videoId: lesson.video?.id,
        order: lesson.order,
        translations: lesson.translations,
        createdAt: lesson.createdAt,
        updatedAt: lesson.updatedAt,
        video: undefined,
      }),
    );

    if (data.includeVideo) {
      lessonsWithVideos = lessons.map(
        (lesson, index): LessonWithOptionalVideo => ({
          id: lesson.id,
          moduleId: lesson.moduleId,
          videoId: lesson.video?.id,
          order: lesson.order,
          translations: lesson.translations,
          createdAt: lesson.createdAt,
          updatedAt: lesson.updatedAt,
          video: lesson.video
            ? {
                id: lesson.video.id,
                slug: lesson.video.slug,
                title:
                  lesson.video.translations?.[0]?.title || 'Untitled Video',
                providerVideoId: lesson.video.providerVideoId,
                durationInSeconds: lesson.video.durationInSeconds,
                isSeen: false, // This would need to be determined from user context
              }
            : undefined,
        }),
      );
    }

    // 5) Build response with pagination
    const totalPages = Math.ceil(total / data.limit);
    const hasNext = data.page < totalPages;
    const hasPrevious = data.page > 1;

    const response: ListLessonsResponse = {
      lessons: lessonsWithVideos.map(
        (lesson): LessonDto => ({
          id: lesson.id.toString(),
          moduleId: lesson.moduleId,
          videoId: lesson.videoId,
          order: lesson.order,
          translations: lesson.translations,
          createdAt: lesson.createdAt,
          updatedAt: lesson.updatedAt,
          video: lesson.video,
        }),
      ),
      pagination: {
        page: data.page,
        limit: data.limit,
        total,
        totalPages,
        hasNext,
        hasPrevious,
      },
    };

    return right(response);
  }
}
