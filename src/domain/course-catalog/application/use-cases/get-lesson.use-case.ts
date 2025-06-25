// src/domain/course-catalog/application/use-cases/get-lesson.use-case.ts
import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';
import { Lesson } from '@/domain/course-catalog/enterprise/entities/lesson.entity';
import { ILessonRepository } from '../repositories/i-lesson-repository';

import { InvalidInputError } from './errors/invalid-input-error';
import { RepositoryError } from './errors/repository-error';
import { LessonNotFoundError } from './errors/lesson-not-found-error';
import { GetLessonRequest } from '../dtos/get-lesson-request.dto';
import {
  GetLessonSchema,
  getLessonSchema,
} from './validations/get-lesson.schema';

type GetLessonUseCaseResponse = Either<
  InvalidInputError | LessonNotFoundError | RepositoryError | Error,
  {
    lesson: {
      id: string;
      moduleId: string;
      videoId?: string;
      imageUrl?: string;
      flashcardIds: string[];
      quizIds: string[];
      commentIds: string[];
      translations: Array<{
        locale: 'pt' | 'it' | 'es';
        title: string;
        description?: string;
      }>;
      video?: {
        id: string;
        slug: string;
        imageUrl?: string;
        providerVideoId: string; // ID do Panda Video
        durationInSeconds: number;
        isSeen: boolean;
        translations: Array<{
          locale: 'pt' | 'it' | 'es';
          title: string;
          description?: string;
        }>;
        createdAt: Date;
        updatedAt: Date;
      };
      createdAt: Date;
      updatedAt: Date;
    };
  }
>;

@Injectable()
export class GetLessonUseCase {
  constructor(
    @Inject('LessonRepository')
    private readonly lessonRepository: ILessonRepository,
  ) {}

  async execute(request: GetLessonRequest): Promise<GetLessonUseCaseResponse> {
    const parseResult = getLessonSchema.safeParse(request);
    if (!parseResult.success) {
      const details = parseResult.error.issues.map((issue) => ({
        code: issue.code,
        message: issue.message,
        path: issue.path,
      }));
      return left(new InvalidInputError('Validation failed', details));
    }

    const data: GetLessonSchema = parseResult.data;
    const lessonId = data.id;

    try {
      const found = await this.lessonRepository.findById(lessonId);
      if (found.isLeft()) {
        return left(new LessonNotFoundError());
      }
      const lessonEntity = found.value as Lesson;

      // Montar payload com todas as traduções e informações do vídeo
      const payload = {
        lesson: {
          id: lessonEntity.id.toString(),
          moduleId: lessonEntity.moduleId,
          videoId: lessonEntity.videoId,
          imageUrl: lessonEntity.imageUrl,
          flashcardIds: lessonEntity.flashcardIds,
          quizIds: lessonEntity.quizIds,
          commentIds: lessonEntity.commentIds,
          translations: lessonEntity.translations.map((tr) => ({
            locale: tr.locale,
            title: tr.title,
            description: tr.description,
          })),
          video: lessonEntity.video
            ? {
                id: lessonEntity.video.id,
                slug: lessonEntity.video.slug,
                imageUrl: lessonEntity.video.imageUrl,
                providerVideoId: lessonEntity.video.providerVideoId, // Este é o ID do Panda Video
                durationInSeconds: lessonEntity.video.durationInSeconds,
                isSeen: lessonEntity.video.isSeen,
                translations: lessonEntity.video.translations.map((tr) => ({
                  locale: tr.locale,
                  title: tr.title,
                  description: tr.description,
                })),
                createdAt: lessonEntity.video.createdAt,
                updatedAt: lessonEntity.video.updatedAt,
              }
            : undefined,
          createdAt: lessonEntity.createdAt,
          updatedAt: lessonEntity.updatedAt,
        },
      };
      return right(payload);
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }
  }
}
