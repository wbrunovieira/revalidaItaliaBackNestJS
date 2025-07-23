import { describe, it, expect, beforeEach } from 'vitest';
import { SaveLessonProgressUseCase } from './save-lesson-progress.use-case';
import { ILessonProgressTracker, LessonProgressData } from '../services/i-lesson-progress-tracker';
import { SaveLessonProgressRequest } from '../dtos/save-lesson-progress.dto';
import { InvalidInputError } from './errors/invalid-input-error';

class MockLessonProgressTracker implements ILessonProgressTracker {
  public savedData: Map<string, LessonProgressData> = new Map();

  async saveProgress(userId: string, data: LessonProgressData): Promise<void> {
    this.savedData.set(userId, data);
  }

  async getContinueLearning(userId: string): Promise<LessonProgressData | null> {
    return this.savedData.get(userId) || null;
  }
}

describe('SaveLessonProgressUseCase', () => {
  let useCase: SaveLessonProgressUseCase;
  let mockTracker: MockLessonProgressTracker;

  beforeEach(() => {
    mockTracker = new MockLessonProgressTracker();
    useCase = new SaveLessonProgressUseCase(mockTracker);
  });

  it('should save lesson progress successfully', async () => {
    const request: SaveLessonProgressRequest = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
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
    };

    const result = await useCase.execute(request);

    expect(result.isRight()).toBe(true);
    expect(result.value).toEqual({
      success: true,
      progressSaved: true,
    });

    // Verify data was saved
    const savedData = mockTracker.savedData.get(request.userId);
    expect(savedData).toBeDefined();
    expect(savedData?.lessonId).toBe(request.lessonId);
    expect(savedData?.videoProgress).toEqual(request.videoProgress);
    expect(savedData?.lastUpdatedAt).toBeDefined();
  });

  it('should return error for invalid userId', async () => {
    const request: SaveLessonProgressRequest = {
      userId: 'invalid-uuid',
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
    };

    const result = await useCase.execute(request);

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidInputError);
    expect((result.value as InvalidInputError).message).toBe('Validation failed');
  });

  it('should return error for empty lesson title', async () => {
    const request: SaveLessonProgressRequest = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      lessonId: '456e7890-e89b-12d3-a456-426614174001',
      lessonTitle: '',
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
    };

    const result = await useCase.execute(request);

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidInputError);
  });

  it('should return error for invalid URL', async () => {
    const request: SaveLessonProgressRequest = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      lessonId: '456e7890-e89b-12d3-a456-426614174001',
      lessonTitle: 'Introduction to Anatomy',
      courseId: '789e0123-e89b-12d3-a456-426614174002',
      courseTitle: 'Medical Course',
      courseSlug: 'medical-course',
      moduleId: '012e3456-e89b-12d3-a456-426614174003',
      moduleTitle: 'Basic Anatomy',
      moduleSlug: 'basic-anatomy',
      lessonImageUrl: 'invalid-url',
      videoProgress: {
        currentTime: 245.7,
        duration: 600,
        percentage: 40.95,
      },
    };

    const result = await useCase.execute(request);

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidInputError);
  });

  it('should return error for negative current time', async () => {
    const request: SaveLessonProgressRequest = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
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
        currentTime: -10,
        duration: 600,
        percentage: 40.95,
      },
    };

    const result = await useCase.execute(request);

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidInputError);
  });

  it('should return error for negative duration', async () => {
    const request: SaveLessonProgressRequest = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
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
        duration: -100,
        percentage: 40.95,
      },
    };

    const result = await useCase.execute(request);

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidInputError);
  });

  it('should return error for percentage above 100', async () => {
    const request: SaveLessonProgressRequest = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
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
        currentTime: 700,
        duration: 600,
        percentage: 116.67,
      },
    };

    const result = await useCase.execute(request);

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidInputError);
  });

  it('should return error for percentage below 0', async () => {
    const request: SaveLessonProgressRequest = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
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
        currentTime: 0,
        duration: 600,
        percentage: -5,
      },
    };

    const result = await useCase.execute(request);

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidInputError);
  });
});