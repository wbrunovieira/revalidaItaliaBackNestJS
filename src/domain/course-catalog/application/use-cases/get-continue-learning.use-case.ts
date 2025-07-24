import { Injectable } from '@nestjs/common';
import { Either, right } from '@/core/either';
import { ILessonProgressTracker } from '../services/i-lesson-progress-tracker';
import {
  GetContinueLearningRequest,
  GetContinueLearningResponse,
  ContinueLearningData,
} from '../dtos/get-continue-learning.dto';

type GetContinueLearningUseCaseResponse = Either<
  never,
  GetContinueLearningResponse
>;

@Injectable()
export class GetContinueLearningUseCase {
  constructor(private lessonProgressTracker: ILessonProgressTracker) {}

  async execute(
    request: GetContinueLearningRequest,
  ): Promise<GetContinueLearningUseCaseResponse> {
    const progressData = await this.lessonProgressTracker.getContinueLearning(
      request.userId,
    );

    if (!progressData) {
      return right({
        hasProgress: false,
      });
    }

    const continuelearningData: ContinueLearningData = {
      lessonId: progressData.lessonId,
      lessonTitle: progressData.lessonTitle,
      courseTitle: progressData.courseTitle,
      moduleTitle: progressData.moduleTitle,
      lessonImageUrl: progressData.lessonImageUrl,
      videoProgress: progressData.videoProgress,
      lessonUrl: `/pt/courses/${progressData.courseSlug}/modules/${progressData.moduleSlug}/lessons/${progressData.lessonId}`,
      lastUpdatedAt: progressData.lastUpdatedAt || new Date().toISOString(),
    };

    return right({
      hasProgress: true,
      lastAccessed: continuelearningData,
    });
  }
}
