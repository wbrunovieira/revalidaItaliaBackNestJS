import 'dotenv/config';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { AppModule } from '../../src/app.module';
import { E2ETestModule } from './test-helpers/e2e-test-module';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../src/infra/database/redis/redis.constants';

describe('Lesson Progress (E2E)', () => {
  let app: INestApplication;
  let redis: Redis;

  // Test user IDs (valid UUIDs)
  const user1Id = '11111111-1111-1111-1111-111111111111';
  const user2Id = '22222222-2222-2222-2222-222222222222';

  // Create test tokens with proper JWT format
  const createTestToken = (userId: string) => {
    const header = Buffer.from(
      JSON.stringify({ alg: 'RS256', typ: 'JWT' }),
    ).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({ sub: userId, role: 'student' }),
    ).toString('base64url');
    return `${header}.${payload}.fake-signature`;
  };

  const user1Token = createTestToken(user1Id);
  const user2Token = createTestToken(user2Id);

  beforeAll(async () => {
    const { app: testApp, moduleRef } = await E2ETestModule.create([AppModule]);
    app = testApp;
    redis = moduleRef.get(REDIS_CLIENT);

    // Clean Redis before tests
    const keys = await redis.keys('lesson_progress:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  });

  afterAll(async () => {
    // Clean up Redis
    const keys = await redis.keys('lesson_progress:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }

    await app.close();
  });

  describe('POST /users/me/lesson-progress', () => {
    const validProgressData = {
      lessonId: 'd50f6fb6-c282-402e-b8e1-00fd902dc0da',
      lessonTitle: 'Introdução à Anatomia',
      courseId: 'a50f6fb6-c282-402e-b8e1-00fd902dc0da',
      courseTitle: 'Revalida Medicina',
      courseSlug: 'curso-teste-pt',
      moduleId: 'b50f6fb6-c282-402e-b8e1-00fd902dc0da',
      moduleTitle: 'Anatomia Básica',
      moduleSlug: 'modulo-1',
      lessonImageUrl: 'https://example.com/images/lesson-anatomy.jpg',
      videoProgress: {
        currentTime: 245.7,
        duration: 600,
        percentage: 40.95,
      },
    };

    it('should save lesson progress for authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/me/lesson-progress')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(validProgressData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        progressSaved: true,
      });

      // Verify data was saved in Redis
      const savedData = await redis.get(`lesson_progress:user:${user1Id}`);
      expect(savedData).toBeTruthy();

      const parsedData = JSON.parse(savedData!);
      expect(parsedData.lessonId).toBe(validProgressData.lessonId);
      expect(parsedData.videoProgress).toEqual(validProgressData.videoProgress);
      expect(parsedData.lastUpdatedAt).toBeDefined();
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/users/me/lesson-progress')
        .send(validProgressData)
        .expect(401);
    });

    it('should return 401 with invalid token', async () => {
      await request(app.getHttpServer())
        .post('/users/me/lesson-progress')
        .set('Authorization', 'Bearer invalid-token')
        .send(validProgressData)
        .expect(401);
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        ...validProgressData,
        lessonId: 'invalid-uuid',
      };

      const response = await request(app.getHttpServer())
        .post('/users/me/lesson-progress')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.detail).toContain('must be a UUID');
    });

    it('should return 400 for missing required fields', async () => {
      const incompleteData = {
        lessonId: 'd50f6fb6-c282-402e-b8e1-00fd902dc0da',
        // missing other required fields
      };

      await request(app.getHttpServer())
        .post('/users/me/lesson-progress')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(incompleteData)
        .expect(400);
    });
  });

  describe('GET /users/me/continue-learning', () => {
    it('should return hasProgress false when no progress exists', async () => {
      // Clear any existing progress for user2
      await redis.del(`lesson_progress:user:${user2Id}`);

      const response = await request(app.getHttpServer())
        .get('/users/me/continue-learning')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(response.body).toEqual({
        hasProgress: false,
      });
    });

    it('should return continue learning data when progress exists', async () => {
      // First save progress for user1
      const progressData = {
        lessonId: 'd50f6fb6-c282-402e-b8e1-00fd902dc0da',
        lessonTitle: 'Introdução à Anatomia',
        courseId: 'a50f6fb6-c282-402e-b8e1-00fd902dc0da',
        courseTitle: 'Revalida Medicina',
        courseSlug: 'curso-teste-pt',
        moduleId: 'b50f6fb6-c282-402e-b8e1-00fd902dc0da',
        moduleTitle: 'Anatomia Básica',
        moduleSlug: 'modulo-1',
        lessonImageUrl: 'https://example.com/images/lesson-anatomy.jpg',
        videoProgress: {
          currentTime: 245.7,
          duration: 600,
          percentage: 40.95,
        },
      };

      await request(app.getHttpServer())
        .post('/users/me/lesson-progress')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(progressData)
        .expect(200);

      // Then get continue learning
      const response = await request(app.getHttpServer())
        .get('/users/me/continue-learning')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.hasProgress).toBe(true);
      expect(response.body.lastAccessed).toBeDefined();
      expect(response.body.lastAccessed.lessonId).toBe(progressData.lessonId);
      expect(response.body.lastAccessed.lessonTitle).toBe(
        progressData.lessonTitle,
      );
      expect(response.body.lastAccessed.videoProgress).toEqual(
        progressData.videoProgress,
      );
      expect(response.body.lastAccessed.lessonUrl).toBe(
        '/pt/courses/curso-teste-pt/modules/modulo-1/lessons/d50f6fb6-c282-402e-b8e1-00fd902dc0da',
      );
      expect(response.body.lastAccessed.lastUpdatedAt).toBeDefined();
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/users/me/continue-learning')
        .expect(401);
    });

    it('should return 401 with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/users/me/continue-learning')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('User isolation', () => {
    it('should isolate progress between different users', async () => {
      // User 1 saves progress - use same data that works
      const user1Progress = {
        lessonId: 'd50f6fb6-c282-402e-b8e1-00fd902dc0da',
        lessonTitle: 'User 1 Lesson',
        courseId: 'a50f6fb6-c282-402e-b8e1-00fd902dc0da',
        courseTitle: 'User 1 Course',
        courseSlug: 'user1-course',
        moduleId: 'b50f6fb6-c282-402e-b8e1-00fd902dc0da',
        moduleTitle: 'User 1 Module',
        moduleSlug: 'user1-module',
        lessonImageUrl: 'https://example.com/user1.jpg',
        videoProgress: {
          currentTime: 100,
          duration: 1000,
          percentage: 10,
        },
      };

      await request(app.getHttpServer())
        .post('/users/me/lesson-progress')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(user1Progress)
        .expect(200);

      // User 2 saves different progress
      const user2Progress = {
        lessonId: 'e50f6fb6-c282-402e-b8e1-00fd902dc0da',
        lessonTitle: 'User 2 Lesson',
        courseId: 'c50f6fb6-c282-402e-b8e1-00fd902dc0da',
        courseTitle: 'User 2 Course',
        courseSlug: 'user2-course',
        moduleId: 'd50f6fb6-c282-402e-b8e1-00fd902dc0da',
        moduleTitle: 'User 2 Module',
        moduleSlug: 'user2-module',
        lessonImageUrl: 'https://example.com/user2.jpg',
        videoProgress: {
          currentTime: 500,
          duration: 1000,
          percentage: 50,
        },
      };

      await request(app.getHttpServer())
        .post('/users/me/lesson-progress')
        .set('Authorization', `Bearer ${user2Token}`)
        .send(user2Progress)
        .expect(200);

      // Verify each user sees only their own progress
      const user1Response = await request(app.getHttpServer())
        .get('/users/me/continue-learning')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(user1Response.body.lastAccessed.lessonId).toBe(
        user1Progress.lessonId,
      );
      expect(user1Response.body.lastAccessed.lessonTitle).toBe('User 1 Lesson');

      const user2Response = await request(app.getHttpServer())
        .get('/users/me/continue-learning')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(user2Response.body.lastAccessed.lessonId).toBe(
        user2Progress.lessonId,
      );
      expect(user2Response.body.lastAccessed.lessonTitle).toBe('User 2 Lesson');
    });
  });

  describe('Progress update', () => {
    it('should update existing progress when saving new progress', async () => {
      const testUserId = '33333333-3333-3333-3333-333333333333';
      const testToken = createTestToken(testUserId);

      // Clear any existing progress
      await redis.del(`lesson_progress:user:${testUserId}`);

      // Save initial progress
      const initialProgress = {
        lessonId: 'f50f6fb6-c282-402e-b8e1-00fd902dc0da',
        lessonTitle: 'Initial Lesson',
        courseId: 'a50f6fb6-c282-402e-b8e1-00fd902dc0da',
        courseTitle: 'Test Course',
        courseSlug: 'test-course',
        moduleId: 'b50f6fb6-c282-402e-b8e1-00fd902dc0da',
        moduleTitle: 'Test Module',
        moduleSlug: 'test-module',
        lessonImageUrl: 'https://example.com/initial.jpg',
        videoProgress: {
          currentTime: 100,
          duration: 1000,
          percentage: 10,
        },
      };

      await request(app.getHttpServer())
        .post('/users/me/lesson-progress')
        .set('Authorization', `Bearer ${testToken}`)
        .send(initialProgress)
        .expect(200);

      // Update with new progress
      const updatedProgress = {
        lessonId: 'e60f6fb6-c282-402e-b8e1-00fd902dc0da',
        lessonTitle: 'Updated Lesson',
        courseId: 'a50f6fb6-c282-402e-b8e1-00fd902dc0da',
        courseTitle: 'Test Course',
        courseSlug: 'test-course',
        moduleId: 'b50f6fb6-c282-402e-b8e1-00fd902dc0da',
        moduleTitle: 'Test Module',
        moduleSlug: 'test-module',
        lessonImageUrl: 'https://example.com/updated.jpg',
        videoProgress: {
          currentTime: 800,
          duration: 1000,
          percentage: 80,
        },
      };

      await request(app.getHttpServer())
        .post('/users/me/lesson-progress')
        .set('Authorization', `Bearer ${testToken}`)
        .send(updatedProgress)
        .expect(200);

      // Verify it returns the updated progress
      const response = await request(app.getHttpServer())
        .get('/users/me/continue-learning')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.lastAccessed.lessonId).toBe(
        updatedProgress.lessonId,
      );
      expect(response.body.lastAccessed.lessonTitle).toBe('Updated Lesson');
      expect(response.body.lastAccessed.videoProgress.percentage).toBe(80);
    });
  });
});
