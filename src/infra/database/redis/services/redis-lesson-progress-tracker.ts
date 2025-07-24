import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import {
  ILessonProgressTracker,
  LessonProgressData,
} from '@/domain/course-catalog/application/services/i-lesson-progress-tracker';
import { REDIS_CLIENT, REDIS_PREFIXES } from '../redis.constants';

@Injectable()
export class RedisLessonProgressTracker implements ILessonProgressTracker {
  private readonly prefix = 'lesson_progress:user:';

  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
  ) {}

  async saveProgress(userId: string, data: LessonProgressData): Promise<void> {
    const key = `${this.prefix}${userId}`;
    const serializedData = JSON.stringify({
      ...data,
      lastUpdatedAt: data.lastUpdatedAt || new Date().toISOString(),
    });

    await this.redis.set(key, serializedData);
  }

  async getContinueLearning(
    userId: string,
  ): Promise<LessonProgressData | null> {
    const key = `${this.prefix}${userId}`;
    const data = await this.redis.get(key);

    if (!data) {
      return null;
    }

    try {
      return JSON.parse(data);
    } catch (error) {
      // Log error and return null if data is corrupted
      console.error(
        `Failed to parse lesson progress for user ${userId}:`,
        error,
      );
      return null;
    }
  }
}
