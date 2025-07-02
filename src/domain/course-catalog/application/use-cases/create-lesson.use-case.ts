// source: src/domain/course-catalog/application/use-cases/create-lesson.use-case.ts
import { Injectable, Inject } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { IModuleRepository } from '../repositories/i-module-repository';
import { ILessonRepository } from '../repositories/i-lesson-repository';
import { IVideoRepository } from '../repositories/i-video-repository';
import { Lesson } from '@/domain/course-catalog/enterprise/entities/lesson.entity';
import { InvalidInputError } from './errors/invalid-input-error';
import { ModuleNotFoundError } from './errors/module-not-found-error';
import { RepositoryError } from './errors/repository-error';
import { VideoNotFoundError } from './errors/video-not-found-error';
import {
  createLessonSchema,
  CreateLessonSchema,
} from './validations/create-lesson.schema';
import { CreateLessonRequest } from '../dtos/create-lesson-request.dto';

export type CreateLessonUseCaseResponse = Either<
  | InvalidInputError
  | ModuleNotFoundError
  | VideoNotFoundError
  | RepositoryError,
  {
    lesson: {
      id: string;
      moduleId: string;
      order: number;
      videoId?: string;
      imageUrl?: string;
      translations: Array<{
        locale: 'pt' | 'it' | 'es';
        title: string;
        description?: string;
      }>;
    };
  }
>;

@Injectable()
export class CreateLessonUseCase {
  constructor(
    @Inject('ModuleRepository')
    private readonly moduleRepo: IModuleRepository,
    @Inject('LessonRepository')
    private readonly lessonRepo: ILessonRepository,
    @Inject('VideoRepository')
    private readonly videoRepo: IVideoRepository, // novo
  ) {}

  async execute(
    request: CreateLessonRequest,
  ): Promise<CreateLessonUseCaseResponse> {
    // 1) valida input
    const parsed = createLessonSchema.safeParse(request);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        code: issue.code,
        message: issue.message,
        path: issue.path,
      }));
      return left(new InvalidInputError('Validation failed', details));
    }
    const data: CreateLessonSchema = parsed.data;

    // 2) módulo existe?
    const foundModule = await this.moduleRepo.findById(data.moduleId);
    if (foundModule.isLeft()) {
      return left(new ModuleNotFoundError());
    }

    // 3) se vier videoId, valida existência
    if (data.videoId) {
      const foundVideo = await this.videoRepo.findById(data.videoId);
      if (foundVideo.isLeft()) {
        // se for erro de não encontrado, propaga VideoNotFoundError
        if (foundVideo.value instanceof VideoNotFoundError) {
          return left(new VideoNotFoundError());
        }
        // qualquer outro => RepositoryError
        return left(new RepositoryError(foundVideo.value.message));
      }
    }

    // 4) monta entidade
    const lessonEntity = Lesson.create({
      moduleId: data.moduleId,
      order: data.order,
      videoId: data.videoId,
      imageUrl: data.imageUrl,
      flashcardIds: [],
      quizIds: [],
      commentIds: [],
      translations: data.translations,
    });

    // 5) persiste
    const result = await this.lessonRepo.create(lessonEntity);
    if (result.isLeft()) {
      return left(new RepositoryError(result.value.message));
    }

    // 6) retorna
    return right({
      lesson: {
        id: lessonEntity.id.toString(),
        moduleId: lessonEntity.moduleId,
        order: lessonEntity.order,
        imageUrl: lessonEntity.imageUrl,

        videoId: lessonEntity.videoId,
        translations: lessonEntity.translations,
      },
    });
  }
}
