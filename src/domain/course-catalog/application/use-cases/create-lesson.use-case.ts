// source: src/domain/course-catalog/application/use-cases/create-lesson.use-case.ts
import { Injectable, Inject } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { IModuleRepository } from '../repositories/i-module-repository';
import { ILessonRepository } from '../repositories/i-lesson-repository';
import { IVideoRepository } from '../repositories/i-video-repository';
import { Lesson } from '@/domain/course-catalog/enterprise/entities/lesson.entity';
import { Video } from '@/domain/course-catalog/enterprise/entities/video.entity';
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
      slug: string;
      moduleId: string;
      order: number;
      imageUrl?: string;
      flashcardIds: string[];
      commentIds: string[];
      translations: Array<{
        locale: 'pt' | 'it' | 'es';
        title: string;
        description?: string;
      }>;
      videoAssociated?: boolean; // Indica se video foi associado
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

    // 3) se vier videoId, valida existência e se está disponível
    let videoToAssociate: Video | null = null;
    if (data.videoId) {
      const foundVideo = await this.videoRepo.findById(data.videoId);
      if (foundVideo.isLeft()) {
        return left(new VideoNotFoundError());
      }

      // Verifica se o video já está associado a outra lesson
      const { video } = foundVideo.value;
      if (video.lessonId) {
        return left(
          new InvalidInputError(
            'Video is already associated with another lesson',
          ),
        );
      }

      videoToAssociate = video;
    }

    // 4) monta entidade
    const lessonEntity = Lesson.create({
      slug: data.slug,
      moduleId: data.moduleId,
      order: data.order,
      imageUrl: data.imageUrl,
      flashcardIds: data.flashcardIds || [],
      commentIds: data.commentIds || [],
      translations: data.translations,
    });

    // 5) persiste lesson
    const result = await this.lessonRepo.create(lessonEntity);
    if (result.isLeft()) {
      return left(new RepositoryError(result.value.message));
    }

    // 6) se houver video, associa à lesson
    let videoAssociated = false;
    if (videoToAssociate) {
      // Atualiza o video com o lessonId
      videoToAssociate.updateLessonId(lessonEntity.id.toString());
      const updateResult = await this.videoRepo.update(videoToAssociate);
      if (updateResult.isLeft()) {
        // Se falhar, pode optar por reverter a lesson criada ou continuar
        return left(
          new RepositoryError('Failed to associate video with lesson'),
        );
      }
      videoAssociated = true;
    }

    // 7) retorna
    return right({
      lesson: {
        id: lessonEntity.id.toString(),
        slug: lessonEntity.slug,
        moduleId: lessonEntity.moduleId,
        order: lessonEntity.order,
        imageUrl: lessonEntity.imageUrl,
        flashcardIds: lessonEntity.flashcardIds,
        commentIds: lessonEntity.commentIds,
        translations: lessonEntity.translations,
        videoAssociated,
      },
    });
  }
}
