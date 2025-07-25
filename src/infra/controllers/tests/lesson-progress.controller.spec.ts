// src/infra/controllers/tests/lesson-progress.controller.spec.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { LessonProgressController } from '../lesson-progress.controller';
import { SaveLessonProgressUseCase } from '@/domain/course-catalog/application/use-cases/save-lesson-progress.use-case';
import { GetContinueLearningUseCase } from '@/domain/course-catalog/application/use-cases/get-continue-learning.use-case';
import { JwtAuthGuard } from '@/infra/auth/guards/jwt-auth.guard';
import { ExecutionContext } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { InvalidInputError } from '@/domain/course-catalog/application/use-cases/errors/invalid-input-error';

describe('LessonProgressController', () => {
  let app: INestApplication;
  let controller: LessonProgressController;
  let saveLessonProgressUseCase: SaveLessonProgressUseCase;
  let getContinueLearningUseCase: GetContinueLearningUseCase;

  const mockUser = {
    sub: '123e4567-e89b-12d3-a456-426614174000',
    email: 'user@example.com',
    role: 'student',
  };

  const mockJwtAuthGuard = {
    canActivate: (context: ExecutionContext) => {
      const request = context.switchToHttp().getRequest();
      request.user = mockUser;
      return true;
    },
  };

  const mockSaveLessonProgressUseCase = {
    execute: vi.fn(),
  };

  const mockGetContinueLearningUseCase = {
    execute: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LessonProgressController],
      providers: [
        {
          provide: SaveLessonProgressUseCase,
          useValue: mockSaveLessonProgressUseCase,
        },
        {
          provide: GetContinueLearningUseCase,
          useValue: mockGetContinueLearningUseCase,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    controller = module.get<LessonProgressController>(LessonProgressController);
    saveLessonProgressUseCase = module.get<SaveLessonProgressUseCase>(
      SaveLessonProgressUseCase,
    );
    getContinueLearningUseCase = module.get<GetContinueLearningUseCase>(
      GetContinueLearningUseCase,
    );
  });

  afterEach(async () => {
    await app.close();
    vi.clearAllMocks();
  });

  describe('POST /users/me/lesson-progress', () => {
    const validProgressData = {
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

    it('should save lesson progress successfully', async () => {
      mockSaveLessonProgressUseCase.execute.mockResolvedValueOnce(
        right({
          success: true,
          progressSaved: true,
        }),
      );

      const response = await request(app.getHttpServer())
        .post('/users/me/lesson-progress')
        .send(validProgressData)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({
        success: true,
        progressSaved: true,
      });

      expect(mockSaveLessonProgressUseCase.execute).toHaveBeenCalledWith({
        userId: mockUser.sub,
        ...validProgressData,
      });
    });

    it('should return 400 for invalid UUID', async () => {
      const invalidData = {
        ...validProgressData,
        lessonId: 'invalid-uuid',
      };

      const response = await request(app.getHttpServer())
        .post('/users/me/lesson-progress')
        .send(invalidData)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message[0]).toBe('lessonId must be a UUID');
    });

    it('should return 400 for missing required fields', async () => {
      const incompleteData = {
        lessonId: '456e7890-e89b-12d3-a456-426614174001',
        // missing other required fields
      };

      await request(app.getHttpServer())
        .post('/users/me/lesson-progress')
        .send(incompleteData)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 for invalid URL', async () => {
      const invalidData = {
        ...validProgressData,
        lessonImageUrl: 'not-a-valid-url',
      };

      mockSaveLessonProgressUseCase.execute.mockResolvedValueOnce(
        left(
          new InvalidInputError('Validation failed', [
            'Lesson image URL must be a valid URL',
          ]),
        ),
      );

      const response = await request(app.getHttpServer())
        .post('/users/me/lesson-progress')
        .send(invalidData)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toContain(
        'Lesson image URL must be a valid URL',
      );
    });

    it('should return 400 for negative currentTime', async () => {
      const invalidData = {
        ...validProgressData,
        videoProgress: {
          ...validProgressData.videoProgress,
          currentTime: -10,
        },
      };

      await request(app.getHttpServer())
        .post('/users/me/lesson-progress')
        .send(invalidData)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 for percentage above 100', async () => {
      const invalidData = {
        ...validProgressData,
        videoProgress: {
          ...validProgressData.videoProgress,
          percentage: 150,
        },
      };

      await request(app.getHttpServer())
        .post('/users/me/lesson-progress')
        .send(invalidData)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 when use case returns InvalidInputError', async () => {
      mockSaveLessonProgressUseCase.execute.mockResolvedValueOnce(
        left(new InvalidInputError('Validation failed', { field: 'error' })),
      );

      const response = await request(app.getHttpServer())
        .post('/users/me/lesson-progress')
        .send(validProgressData)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toEqual({
        message: 'Validation failed',
        errors: { field: 'error' },
      });
    });

    it('should return 500 for unexpected errors', async () => {
      mockSaveLessonProgressUseCase.execute.mockResolvedValueOnce(
        left(new Error('Unexpected error')),
      );

      const response = await request(app.getHttpServer())
        .post('/users/me/lesson-progress')
        .send(validProgressData)
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);

      expect(response.body.message).toBe('Failed to save progress');
    });

    it('should return 401 when not authenticated', async () => {
      // Override guard to return false
      const moduleRef = await Test.createTestingModule({
        controllers: [LessonProgressController],
        providers: [
          {
            provide: SaveLessonProgressUseCase,
            useValue: mockSaveLessonProgressUseCase,
          },
          {
            provide: GetContinueLearningUseCase,
            useValue: mockGetContinueLearningUseCase,
          },
        ],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue({ canActivate: () => false })
        .compile();

      const unauthorizedApp = moduleRef.createNestApplication();
      unauthorizedApp.useGlobalPipes(new ValidationPipe());
      await unauthorizedApp.init();

      await request(unauthorizedApp.getHttpServer())
        .post('/users/me/lesson-progress')
        .send(validProgressData)
        .expect(HttpStatus.FORBIDDEN);

      await unauthorizedApp.close();
    });

    it('should return 500 for repository error', async () => {
      mockSaveLessonProgressUseCase.execute.mockResolvedValueOnce(
        left(new Error('Repository connection failed')),
      );

      const response = await request(app.getHttpServer())
        .post('/users/me/lesson-progress')
        .send(validProgressData)
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);

      expect(response.body.message).toBe('Failed to save progress');
    });

    it('should return 400 for empty string values', async () => {
      const invalidData = {
        ...validProgressData,
        lessonTitle: '',
      };

      await request(app.getHttpServer())
        .post('/users/me/lesson-progress')
        .send(invalidData)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 for null values', async () => {
      const invalidData = {
        ...validProgressData,
        courseTitle: null,
      };

      await request(app.getHttpServer())
        .post('/users/me/lesson-progress')
        .send(invalidData)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 for missing video progress', async () => {
      const invalidData = {
        ...validProgressData,
        videoProgress: undefined,
      };

      await request(app.getHttpServer())
        .post('/users/me/lesson-progress')
        .send(invalidData)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 for invalid video progress structure', async () => {
      const invalidData = {
        ...validProgressData,
        videoProgress: {
          currentTime: 'invalid',
          duration: 600,
          percentage: 40.95,
        },
      };

      await request(app.getHttpServer())
        .post('/users/me/lesson-progress')
        .send(invalidData)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should handle edge case with zero duration', async () => {
      const invalidData = {
        ...validProgressData,
        videoProgress: {
          ...validProgressData.videoProgress,
          duration: 0,
        },
      };

      await request(app.getHttpServer())
        .post('/users/me/lesson-progress')
        .send(invalidData)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should handle edge case with negative duration', async () => {
      const invalidData = {
        ...validProgressData,
        videoProgress: {
          ...validProgressData.videoProgress,
          duration: -100,
        },
      };

      await request(app.getHttpServer())
        .post('/users/me/lesson-progress')
        .send(invalidData)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should handle progress with maximum values', async () => {
      mockSaveLessonProgressUseCase.execute.mockResolvedValueOnce(
        right({
          success: true,
          progressSaved: true,
        }),
      );

      const maxProgressData = {
        ...validProgressData,
        videoProgress: {
          currentTime: 600,
          duration: 600,
          percentage: 100,
        },
      };

      const response = await request(app.getHttpServer())
        .post('/users/me/lesson-progress')
        .send(maxProgressData)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({
        success: true,
        progressSaved: true,
      });
    });

    it('should handle progress with zero values', async () => {
      mockSaveLessonProgressUseCase.execute.mockResolvedValueOnce(
        right({
          success: true,
          progressSaved: true,
        }),
      );

      const zeroProgressData = {
        ...validProgressData,
        videoProgress: {
          currentTime: 0,
          duration: 600,
          percentage: 0,
        },
      };

      const response = await request(app.getHttpServer())
        .post('/users/me/lesson-progress')
        .send(zeroProgressData)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({
        success: true,
        progressSaved: true,
      });
    });

    it('should validate UUID formats correctly', async () => {
      const testCases = [
        { field: 'lessonId', value: '123' },
        { field: 'courseId', value: 'abc-def-ghi' },
        { field: 'moduleId', value: '12345678-1234-1234-1234-12345678901' }, // too short
      ];

      for (const testCase of testCases) {
        const invalidData = {
          ...validProgressData,
          [testCase.field]: testCase.value,
        };

        await request(app.getHttpServer())
          .post('/users/me/lesson-progress')
          .send(invalidData)
          .expect(HttpStatus.BAD_REQUEST);
      }
    });

    it('should pass userId correctly to use case', async () => {
      mockSaveLessonProgressUseCase.execute.mockResolvedValueOnce(
        right({
          success: true,
          progressSaved: true,
        }),
      );

      await request(app.getHttpServer())
        .post('/users/me/lesson-progress')
        .send(validProgressData)
        .expect(HttpStatus.OK);

      expect(mockSaveLessonProgressUseCase.execute).toHaveBeenCalledWith({
        userId: mockUser.sub,
        ...validProgressData,
      });
    });
  });

  describe('GET /users/me/continue-learning', () => {
    it('should return hasProgress false when no progress exists', async () => {
      mockGetContinueLearningUseCase.execute.mockResolvedValueOnce(
        right({
          hasProgress: false,
        }),
      );

      const response = await request(app.getHttpServer())
        .get('/users/me/continue-learning')
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({
        hasProgress: false,
      });

      expect(mockGetContinueLearningUseCase.execute).toHaveBeenCalledWith({
        userId: mockUser.sub,
      });
    });

    it('should return continue learning data when progress exists', async () => {
      const continuelearningData = {
        lessonId: '456e7890-e89b-12d3-a456-426614174001',
        lessonTitle: 'Introduction to Anatomy',
        courseTitle: 'Medical Course',
        moduleTitle: 'Basic Anatomy',
        lessonImageUrl: 'https://example.com/lesson-image.jpg',
        videoProgress: {
          currentTime: 245.7,
          duration: 600,
          percentage: 40.95,
        },
        lessonUrl:
          '/pt/courses/medical-course/modules/basic-anatomy/lessons/456e7890-e89b-12d3-a456-426614174001',
        lastUpdatedAt: '2024-01-23T10:30:00Z',
      };

      mockGetContinueLearningUseCase.execute.mockResolvedValueOnce(
        right({
          hasProgress: true,
          lastAccessed: continuelearningData,
        }),
      );

      const response = await request(app.getHttpServer())
        .get('/users/me/continue-learning')
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({
        hasProgress: true,
        lastAccessed: continuelearningData,
      });
    });

    it('should return 401 when not authenticated', async () => {
      // Override guard to return false
      const moduleRef = await Test.createTestingModule({
        controllers: [LessonProgressController],
        providers: [
          {
            provide: SaveLessonProgressUseCase,
            useValue: mockSaveLessonProgressUseCase,
          },
          {
            provide: GetContinueLearningUseCase,
            useValue: mockGetContinueLearningUseCase,
          },
        ],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue({ canActivate: () => false })
        .compile();

      const unauthorizedApp = moduleRef.createNestApplication();
      unauthorizedApp.useGlobalPipes(new ValidationPipe());
      await unauthorizedApp.init();

      await request(unauthorizedApp.getHttpServer())
        .get('/users/me/continue-learning')
        .expect(HttpStatus.FORBIDDEN);

      await unauthorizedApp.close();
    });

    it('should handle internal server errors gracefully', async () => {
      mockGetContinueLearningUseCase.execute.mockResolvedValueOnce(
        left(new Error('Database connection failed')),
      );

      const response = await request(app.getHttpServer())
        .get('/users/me/continue-learning')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);

      expect(response.body.message).toBe('Failed to retrieve progress');
    });

    it('should pass userId correctly to continue learning use case', async () => {
      mockGetContinueLearningUseCase.execute.mockResolvedValueOnce(
        right({
          hasProgress: false,
        }),
      );

      await request(app.getHttpServer())
        .get('/users/me/continue-learning')
        .expect(HttpStatus.OK);

      expect(mockGetContinueLearningUseCase.execute).toHaveBeenCalledWith({
        userId: mockUser.sub,
      });
    });

    it('should return progress with complete video data', async () => {
      const completeProgressData = {
        lessonId: '456e7890-e89b-12d3-a456-426614174001',
        lessonTitle: 'Advanced Anatomy',
        courseTitle: 'Complete Medical Course',
        moduleTitle: 'Advanced Modules',
        lessonImageUrl: 'https://example.com/advanced-lesson.jpg',
        videoProgress: {
          currentTime: 1200.5,
          duration: 1800,
          percentage: 66.69,
        },
        lessonUrl:
          '/pt/courses/complete-medical/modules/advanced/lessons/456e7890-e89b-12d3-a456-426614174001',
        lastUpdatedAt: '2024-01-24T14:45:00Z',
      };

      mockGetContinueLearningUseCase.execute.mockResolvedValueOnce(
        right({
          hasProgress: true,
          lastAccessed: completeProgressData,
        }),
      );

      const response = await request(app.getHttpServer())
        .get('/users/me/continue-learning')
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({
        hasProgress: true,
        lastAccessed: completeProgressData,
      });
      expect(response.body.lastAccessed.videoProgress.currentTime).toBe(1200.5);
      expect(response.body.lastAccessed.videoProgress.percentage).toBe(66.69);
    });

    it('should handle edge case with minimal progress data', async () => {
      const minimalProgressData = {
        lessonId: '456e7890-e89b-12d3-a456-426614174001',
        lessonTitle: 'Quick Lesson',
        courseTitle: 'Mini Course',
        moduleTitle: 'Short Module',
        lessonImageUrl: 'https://example.com/mini.jpg',
        videoProgress: {
          currentTime: 0.1,
          duration: 30,
          percentage: 0.33,
        },
        lessonUrl:
          '/pt/courses/mini/modules/short/lessons/456e7890-e89b-12d3-a456-426614174001',
        lastUpdatedAt: '2024-01-23T08:00:00Z',
      };

      mockGetContinueLearningUseCase.execute.mockResolvedValueOnce(
        right({
          hasProgress: true,
          lastAccessed: minimalProgressData,
        }),
      );

      const response = await request(app.getHttpServer())
        .get('/users/me/continue-learning')
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({
        hasProgress: true,
        lastAccessed: minimalProgressData,
      });
      expect(response.body.lastAccessed.videoProgress.currentTime).toBe(0.1);
    });
  });
});
