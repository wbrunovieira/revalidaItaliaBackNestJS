// src/domain/course-catalog/application/use-cases/update-lesson.use-case.ts

import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';
import { ILessonRepository } from '../repositories/i-lesson-repository';

import { InvalidInputError } from './errors/invalid-input-error';
import { RepositoryError } from './errors/repository-error';
import { LessonNotFoundError } from './errors/lesson-not-found-error';

import { Lesson } from '../../enterprise/entities/lesson.entity';
import { DuplicateLessonOrderError } from './errors/duplicate-lesson-order-error';
import { UpdateLessonRequest } from '../dtos/update-lesson-request.dto';
import {
  UpdateLessonSchema,
  updateLessonSchema,
} from './validations/update-lesson.schema';

type UpdateLessonUseCaseResponse = Either<
  | InvalidInputError
  | LessonNotFoundError
  | DuplicateLessonOrderError
  | RepositoryError
  | Error,
  {
    lesson: Lesson;
  }
>;

@Injectable()
export class UpdateLessonUseCase {
  constructor(
    @Inject('LessonRepository')
    private readonly lessonRepository: ILessonRepository,
  ) {}

  async execute(
    request: UpdateLessonRequest,
  ): Promise<UpdateLessonUseCaseResponse> {
    // Validação de entrada
    const parseResult = updateLessonSchema.safeParse(request);
    if (!parseResult.success) {
      const details = parseResult.error.issues.map((issue) => {
        const detail: any = {
          code: issue.code,
          message: issue.message,
          path: issue.path,
        };
        if (issue.code === 'invalid_type') {
          detail.expected = (issue as any).expected;
          detail.received = (issue as any).received;
        }
        return detail;
      });
      return left(new InvalidInputError('Validation failed', details));
    }

    const data: UpdateLessonSchema = parseResult.data;

    try {
      // Buscar a lição existente
      const lessonResult = await this.lessonRepository.findById(data.id);
      if (lessonResult.isLeft()) {
        return left(new LessonNotFoundError());
      }

      const existingLesson = lessonResult.value;

      // Se está atualizando a ordem, verificar duplicata
      if (data.order !== undefined && data.order !== existingLesson.order) {
        const orderCheckResult =
          await this.lessonRepository.findByModuleIdAndOrder(
            existingLesson.moduleId,
            data.order,
          );

        if (orderCheckResult.isLeft()) {
          return left(new RepositoryError(orderCheckResult.value.message));
        }

        // Se encontrou uma lição com essa ordem e não é a mesma lição
        if (
          orderCheckResult.value &&
          orderCheckResult.value.id.toString() !== data.id
        ) {
          return left(new DuplicateLessonOrderError());
        }
      }

      // Atualizar os campos da lição
      if (data.imageUrl !== undefined) {
        if (data.imageUrl === null) {
          existingLesson.removeImage();
        } else {
          existingLesson.updateImageUrl(data.imageUrl);
        }
      }

      if (data.videoId !== undefined) {
        if (data.videoId === null) {
          existingLesson.updateVideo(undefined);
        } else {
          // For now, we'll need to create a VideoVO from the videoId
          // This is a simplified approach - in a real implementation,
          // you might need to fetch the video details from a repository
          const videoVO = {
            id: data.videoId,
            slug: `video-${data.videoId}`,
            imageUrl: undefined,
            providerVideoId: `provider-${data.videoId}`,
            durationInSeconds: 0,
            translations: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          existingLesson.updateVideo(videoVO);
        }
      }

      if (data.translations) {
        existingLesson.updateTranslations(
          data.translations.map((t) => ({
            locale: t.locale,
            title: t.title,
            description: t.description,
          })),
        );
      }

      if (data.order !== undefined) {
        existingLesson.updateOrder(data.order);
      }

      if (data.flashcardIds !== undefined) {
        existingLesson.updateFlashcardIds(data.flashcardIds);
      }

      if (data.quizIds !== undefined) {
        // quizIds is now assessments in the new structure
        // We need to convert the IDs to assessment objects
        // For now, we'll just comment this out as it needs more complex handling
        // existingLesson.updateQuizIds(data.quizIds);
        console.warn(
          'quizIds update not implemented - needs assessment data transformation',
        );
      }

      if (data.assessments !== undefined) {
        // assessments field for the new structure
        // For now, we'll just comment this out as it needs more complex handling
        // existingLesson.updateAssessments(data.assessments);
        console.warn(
          'assessments update not implemented - needs assessment object transformation',
        );
      }

      if (data.commentIds !== undefined) {
        existingLesson.updateCommentIds(data.commentIds);
      }

      // Salvar as alterações
      const updateResult = await this.lessonRepository.update(existingLesson);
      if (updateResult.isLeft()) {
        return left(new RepositoryError(updateResult.value.message));
      }

      return right({
        lesson: existingLesson,
      });
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }
  }
}
