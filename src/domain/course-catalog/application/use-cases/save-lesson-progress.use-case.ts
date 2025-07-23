import { Injectable } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { InvalidInputError } from './errors/invalid-input-error';
import { ILessonProgressTracker, LessonProgressData } from '../services/i-lesson-progress-tracker';
import { SaveLessonProgressRequest, SaveLessonProgressResponse } from '../dtos/save-lesson-progress.dto';
import { saveLessonProgressSchema } from './validations/save-lesson-progress.schema';
import { ZodError } from 'zod';

type SaveLessonProgressUseCaseResponse = Either<
  InvalidInputError,
  SaveLessonProgressResponse
>;

@Injectable()
export class SaveLessonProgressUseCase {
  constructor(private lessonProgressTracker: ILessonProgressTracker) {}

  async execute(
    request: SaveLessonProgressRequest,
  ): Promise<SaveLessonProgressUseCaseResponse> {
    try {
      // Validate input
      const validatedData = saveLessonProgressSchema.parse(request);

      // Prepare data for storage
      const progressData: LessonProgressData = {
        lessonId: validatedData.lessonId,
        lessonTitle: validatedData.lessonTitle,
        courseId: validatedData.courseId,
        courseTitle: validatedData.courseTitle,
        courseSlug: validatedData.courseSlug,
        moduleId: validatedData.moduleId,
        moduleTitle: validatedData.moduleTitle,
        moduleSlug: validatedData.moduleSlug,
        lessonImageUrl: validatedData.lessonImageUrl,
        videoProgress: validatedData.videoProgress,
        lastUpdatedAt: new Date().toISOString(),
      };

      // Save progress
      await this.lessonProgressTracker.saveProgress(
        validatedData.userId,
        progressData,
      );

      return right({
        success: true,
        progressSaved: true,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return left(new InvalidInputError('Validation failed', error.errors));
      }
      
      // Re-throw unexpected errors
      throw error;
    }
  }
}