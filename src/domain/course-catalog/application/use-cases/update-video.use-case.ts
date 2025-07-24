//src/domain/course-catalog/application/use-cases/update-video.use-case.ts
import { Injectable, Inject } from '@nestjs/common';
import { left, right, Either } from '@/core/either';

import { IVideoRepository } from '../repositories/i-video-repository';
import { ILessonRepository } from '../repositories/i-lesson-repository';

import { LessonNotFoundError } from './errors/lesson-not-found.error';
import {
  UpdateVideoUseCaseRequest,
  UpdateVideoUseCaseResponse,
} from '../dtos/update-video.dto';
import { updateVideoSchema } from './validations/update-video.schema';
import { VideoTranslationVO } from '../../enterprise/value-objects/video-translation.vo';
import { DuplicateVideoError } from './errors/duplicate-video-error';
import { VideoNotFoundError } from './errors/video-not-found-error';
import { InvalidInputError } from './errors/invalid-input-error';
import { RepositoryError } from './errors/repository-error';

@Injectable()
export class UpdateVideoUseCase {
  constructor(
    @Inject('VideoRepository')
    private readonly videoRepository: IVideoRepository,
    @Inject('LessonRepository')
    private readonly lessonRepository: ILessonRepository,
  ) {}

  async execute(
    input: UpdateVideoUseCaseRequest,
  ): Promise<UpdateVideoUseCaseResponse> {
    const validationResult = updateVideoSchema.safeParse(input);

    if (!validationResult.success) {
      const details = validationResult.error.issues.map((issue) => ({
        code: issue.code,
        message: issue.message,
        path: issue.path,
      }));
      return left(new InvalidInputError('Validation failed', details));
    }

    const {
      videoId,
      slug,
      imageUrl,
      providerVideoId,
      durationInSeconds,
      lessonId,
      translations,
    } = validationResult.data;

    try {
      // Check if video exists
      const videoResult = await this.videoRepository.findById(videoId);
      if (videoResult.isLeft()) {
        return left(new VideoNotFoundError());
      }

      const { video } = videoResult.value;

      // Check if new slug is already taken by another video
      if (slug && slug !== video.slug) {
        const existingVideoResult = await this.videoRepository.findBySlug(slug);
        if (existingVideoResult.isRight()) {
          return left(new DuplicateVideoError());
        }
      }

      // If lessonId is provided, verify the lesson exists
      if (lessonId !== undefined) {
        if (lessonId !== null) {
          const lessonResult = await this.lessonRepository.findById(lessonId);
          if (lessonResult.isLeft()) {
            return left(new LessonNotFoundError(lessonId));
          }
        }
        video.updateLessonId(lessonId ?? undefined);
      }

      // Update video details if provided
      if (
        slug ||
        imageUrl !== undefined ||
        providerVideoId ||
        durationInSeconds
      ) {
        const updates: any = {};
        if (slug) updates.slug = slug;
        if (imageUrl !== undefined)
          updates.imageUrl = imageUrl === null ? undefined : imageUrl;
        if (providerVideoId) updates.providerVideoId = providerVideoId;
        if (durationInSeconds) updates.durationInSeconds = durationInSeconds;

        video.updateDetails(updates);
      }

      // Update translations if provided
      if (translations) {
        const videoTranslations = translations.map(
          (t) => new VideoTranslationVO(t.locale, t.title, t.description),
        );
        video.updateTranslations(videoTranslations);
      }

      // Save the updated video
      const updateResult = await this.videoRepository.update(video);
      if (updateResult.isLeft()) {
        return left(new RepositoryError(updateResult.value.message));
      }

      return right({
        message: 'Video updated successfully',
      });
    } catch (err: any) {
      // Preserve specific error types
      if (
        err instanceof VideoNotFoundError ||
        err instanceof DuplicateVideoError ||
        err instanceof LessonNotFoundError ||
        err instanceof InvalidInputError
      ) {
        return left(err);
      }
      return left(new RepositoryError(err.message));
    }
  }
}
