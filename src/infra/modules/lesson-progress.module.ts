// src/infra/modules/lesson-progress.module.ts
import { Module } from '@nestjs/common';
import { LessonProgressController } from '../controllers/lesson-progress.controller';
import { SaveLessonProgressUseCase } from '@/domain/course-catalog/application/use-cases/save-lesson-progress.use-case';
import { GetContinueLearningUseCase } from '@/domain/course-catalog/application/use-cases/get-continue-learning.use-case';
import { RedisLessonProgressTracker } from '../database/redis/services/redis-lesson-progress-tracker';
import { ILessonProgressTracker } from '@/domain/course-catalog/application/services/i-lesson-progress-tracker';
import { RedisModule } from '../database/redis/redis.module';

@Module({
  imports: [RedisModule],
  controllers: [LessonProgressController],
  providers: [
    SaveLessonProgressUseCase,
    GetContinueLearningUseCase,
    {
      provide: ILessonProgressTracker,
      useClass: RedisLessonProgressTracker,
    },
  ],
  exports: [SaveLessonProgressUseCase, GetContinueLearningUseCase],
})
export class LessonProgressModule {}
