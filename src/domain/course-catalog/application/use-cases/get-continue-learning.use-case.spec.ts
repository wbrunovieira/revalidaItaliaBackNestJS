import { describe, it, expect, beforeEach } from 'vitest';
import { GetContinueLearningUseCase } from './get-continue-learning.use-case';
import {
  ILessonProgressTracker,
  LessonProgressData,
} from '../services/i-lesson-progress-tracker';

class MockLessonProgressTracker implements ILessonProgressTracker {
  public savedData: Map<string, LessonProgressData> = new Map();

  async saveProgress(userId: string, data: LessonProgressData): Promise<void> {
    this.savedData.set(userId, data);
  }

  async getContinueLearning(
    userId: string,
  ): Promise<LessonProgressData | null> {
    return this.savedData.get(userId) || null;
  }
}

describe('GetContinueLearningUseCase', () => {
  let useCase: GetContinueLearningUseCase;
  let mockTracker: MockLessonProgressTracker;

  beforeEach(() => {
    mockTracker = new MockLessonProgressTracker();
    useCase = new GetContinueLearningUseCase(mockTracker);
  });

  it('should return hasProgress false when no progress exists', async () => {
    const result = await useCase.execute({ userId: 'user-without-progress' });

    expect(result.isRight()).toBe(true);
    expect(result.value).toEqual({
      hasProgress: false,
    });
  });

  it('should return progress data when it exists', async () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    const progressData: LessonProgressData = {
      lessonId: '456e7890-e89b-12d3-a456-426614174001',
      lessonTitle: 'Introduction to Anatomy',
      courseId: '789e0123-e89b-12d3-a456-426614174002',
      courseTitle: 'Medical Course',
      courseSlug: 'medical-course',
      moduleId: '012e3456-e89b-12d3-a456-426614174003',
      moduleTitle: 'Basic Anatomy',
      moduleSlug: 'basic-anatomy',
      lessonImageUrl: 'https://example.com/lesson-image.jpg',
      videoProgress: {
        currentTime: 245.7,
        duration: 600,
        percentage: 40.95,
      },
      lastUpdatedAt: '2024-01-23T10:30:00Z',
    };

    // Save progress first
    await mockTracker.saveProgress(userId, progressData);

    // Get continue learning
    const result = await useCase.execute({ userId });

    expect(result.isRight()).toBe(true);
    expect(result.value).toEqual({
      hasProgress: true,
      lastAccessed: {
        lessonId: progressData.lessonId,
        lessonTitle: progressData.lessonTitle,
        courseTitle: progressData.courseTitle,
        moduleTitle: progressData.moduleTitle,
        lessonImageUrl: progressData.lessonImageUrl,
        videoProgress: progressData.videoProgress,
        lessonUrl:
          '/pt/courses/medical-course/modules/basic-anatomy/lessons/456e7890-e89b-12d3-a456-426614174001',
        lastUpdatedAt: '2024-01-23T10:30:00Z',
      },
    });
  });

  it('should generate correct lesson URL', async () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    const progressData: LessonProgressData = {
      lessonId: 'lesson-123',
      lessonTitle: 'Test Lesson',
      courseId: 'course-123',
      courseTitle: 'Test Course',
      courseSlug: 'test-course-slug',
      moduleId: 'module-123',
      moduleTitle: 'Test Module',
      moduleSlug: 'test-module-slug',
      lessonImageUrl: 'https://example.com/image.jpg',
      videoProgress: {
        currentTime: 100,
        duration: 200,
        percentage: 50,
      },
      lastUpdatedAt: '2024-01-23T10:30:00Z',
    };

    await mockTracker.saveProgress(userId, progressData);
    const result = await useCase.execute({ userId });

    expect(result.isRight()).toBe(true);
    expect(result.value.lastAccessed?.lessonUrl).toBe(
      '/pt/courses/test-course-slug/modules/test-module-slug/lessons/lesson-123',
    );
  });

  it('should handle progress without lastUpdatedAt', async () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    const progressData: LessonProgressData = {
      lessonId: 'lesson-123',
      lessonTitle: 'Test Lesson',
      courseId: 'course-123',
      courseTitle: 'Test Course',
      courseSlug: 'test-course',
      moduleId: 'module-123',
      moduleTitle: 'Test Module',
      moduleSlug: 'test-module',
      lessonImageUrl: 'https://example.com/image.jpg',
      videoProgress: {
        currentTime: 100,
        duration: 200,
        percentage: 50,
      },
      // No lastUpdatedAt
    };

    await mockTracker.saveProgress(userId, progressData);
    const result = await useCase.execute({ userId });

    expect(result.isRight()).toBe(true);
    expect(result.value.hasProgress).toBe(true);
    expect(result.value.lastAccessed?.lastUpdatedAt).toBeDefined();
    // Should be a valid ISO date string
    expect(
      new Date(result.value.lastAccessed!.lastUpdatedAt).toISOString(),
    ).toBe(result.value.lastAccessed!.lastUpdatedAt);
  });

  it('should return data for multiple users independently', async () => {
    const user1Id = 'user-1';
    const user2Id = 'user-2';

    const user1Progress: LessonProgressData = {
      lessonId: 'lesson-1',
      lessonTitle: 'User 1 Lesson',
      courseId: 'course-1',
      courseTitle: 'Course 1',
      courseSlug: 'course-1',
      moduleId: 'module-1',
      moduleTitle: 'Module 1',
      moduleSlug: 'module-1',
      lessonImageUrl: 'https://example.com/1.jpg',
      videoProgress: { currentTime: 10, duration: 100, percentage: 10 },
    };

    const user2Progress: LessonProgressData = {
      lessonId: 'lesson-2',
      lessonTitle: 'User 2 Lesson',
      courseId: 'course-2',
      courseTitle: 'Course 2',
      courseSlug: 'course-2',
      moduleId: 'module-2',
      moduleTitle: 'Module 2',
      moduleSlug: 'module-2',
      lessonImageUrl: 'https://example.com/2.jpg',
      videoProgress: { currentTime: 50, duration: 100, percentage: 50 },
    };

    await mockTracker.saveProgress(user1Id, user1Progress);
    await mockTracker.saveProgress(user2Id, user2Progress);

    const result1 = await useCase.execute({ userId: user1Id });
    const result2 = await useCase.execute({ userId: user2Id });

    expect(result1.value.lastAccessed?.lessonTitle).toBe('User 1 Lesson');
    expect(result2.value.lastAccessed?.lessonTitle).toBe('User 2 Lesson');
  });
});
