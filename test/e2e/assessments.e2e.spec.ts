// test/e2e/assessments.e2e.spec.ts
import request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../src/prisma/prisma.service';

// Create a minimal module for testing just the assessment controller
import { CreateAssessmentUseCase } from '../../src/domain/assessment/application/use-cases/create-assessment.use-case';
import { AssessmentController } from '../../src/infra/controllers/assessment.controller';
import { PrismaAssessmentRepository } from '../../src/infra/database/prisma/repositories/prisma-assessment-repository';
import { PrismaLessonRepository } from '../../src/infra/database/prisma/repositories/prisma-lesson-repository';
import { Module } from '@nestjs/common';

@Module({
  controllers: [AssessmentController],
  providers: [
    CreateAssessmentUseCase,
    PrismaService,
    {
      provide: 'AssessmentRepository',
      useClass: PrismaAssessmentRepository,
    },
    {
      provide: 'LessonRepository',
      useClass: PrismaLessonRepository,
    },
  ],
})
class TestAssessmentModule {}

describe('Assessments Controller (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let courseId: string;
  let moduleId: string;
  let lessonId: string;

  // Função helper para limpeza completa respeitando foreign keys
  const cleanupDatabase = async () => {
    if (!prisma) return;

    try {
      // Only clean up the tables we need for assessment tests
      await prisma.assessment.deleteMany({});
      await prisma.lessonTranslation.deleteMany({});
      await prisma.lesson.deleteMany({});
      await prisma.moduleTranslation.deleteMany({});
      await prisma.module.deleteMany({});
      await prisma.courseTranslation.deleteMany({});
      await prisma.course.deleteMany({});
    } catch (error) {
      console.warn('Cleanup warning:', error);
    }
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TestAssessmentModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );

    await app.init();
    prisma = app.get(PrismaService);

    await cleanupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
    if (app) {
      await app.close();
    }
  });

  beforeEach(async () => {
    // Limpeza antes de cada teste para isolamento
    await cleanupDatabase();

    // Criar estrutura base: Course > Module > Lesson
    const course = await prisma.course.create({
      data: {
        slug: 'test-course',
        translations: {
          create: [
            { locale: 'pt', title: 'Curso de Teste', description: 'Desc PT' },
            { locale: 'it', title: 'Corso di Test', description: 'Desc IT' },
            { locale: 'es', title: 'Curso de Prueba', description: 'Desc ES' },
          ],
        },
      },
    });
    courseId = course.id;

    const module = await prisma.module.create({
      data: {
        slug: 'test-module',
        order: 1,
        courseId,
        translations: {
          create: [
            { locale: 'pt', title: 'Módulo de Teste', description: 'Desc PT' },
            { locale: 'it', title: 'Modulo di Test', description: 'Desc IT' },
            { locale: 'es', title: 'Módulo de Prueba', description: 'Desc ES' },
          ],
        },
      },
    });
    moduleId = module.id;

    const lesson = await prisma.lesson.create({
      data: {
        slug: 'test-lesson',
        moduleId,
        order: 1,
        translations: {
          create: [
            { locale: 'pt', title: 'Aula de Teste', description: 'Desc PT' },
            { locale: 'it', title: 'Lezione di Test', description: 'Desc IT' },
            {
              locale: 'es',
              title: 'Lección de Prueba',
              description: 'Desc ES',
            },
          ],
        },
      },
    });
    lessonId = lesson.id;
  });

  describe('[POST] /assessments - Create Assessment', () => {
    describe('✅ Success Cases', () => {
      it('should create QUIZ assessment with lessonId successfully', async () => {
        const payload = {
          title: 'JavaScript Fundamentals Quiz',
          description: 'Test your knowledge of JavaScript basics',
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
          lessonId: lessonId,
        };

        const res = await request(app.getHttpServer())
          .post('/assessments')
          .send(payload);

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('assessment');
        expect(res.body.assessment).toMatchObject({
          id: expect.any(String),
          slug: 'javascript-fundamentals-quiz',
          title: 'JavaScript Fundamentals Quiz',
          description: 'Test your knowledge of JavaScript basics',
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
          lessonId: lessonId,
        });

        // Verificar que foi salvo no banco de dados
        const savedAssessment = await prisma.assessment.findUnique({
          where: { id: res.body.assessment.id },
        });
        expect(savedAssessment).toBeDefined();
        expect(savedAssessment?.title).toBe('JavaScript Fundamentals Quiz');
      });

      it('should create QUIZ assessment without lessonId', async () => {
        const payload = {
          title: 'Generic JavaScript Quiz',
          description: 'Generic quiz not tied to a specific lesson',
          type: 'QUIZ',
          quizPosition: 'BEFORE_LESSON',
          passingScore: 75,
          randomizeQuestions: true,
          randomizeOptions: true,
        };

        const res = await request(app.getHttpServer())
          .post('/assessments')
          .send(payload);

        expect(res.status).toBe(201);
        expect(res.body.assessment).toMatchObject({
          title: 'Generic JavaScript Quiz',
          type: 'QUIZ',
          quizPosition: 'BEFORE_LESSON',
          passingScore: 75,
          randomizeQuestions: true,
          randomizeOptions: true,
        });
        expect(res.body.assessment.lessonId).toBeUndefined();
      });

      it('should create SIMULADO assessment with time limit', async () => {
        const payload = {
          title: 'Programming Simulation Exam',
          description: 'Comprehensive programming simulation',
          type: 'SIMULADO',
          passingScore: 80,
          timeLimitInMinutes: 120,
          randomizeQuestions: true,
          randomizeOptions: true,
          lessonId: lessonId,
        };

        const res = await request(app.getHttpServer())
          .post('/assessments')
          .send(payload);

        expect(res.status).toBe(201);
        expect(res.body.assessment).toMatchObject({
          title: 'Programming Simulation Exam',
          type: 'SIMULADO',
          passingScore: 80,
          timeLimitInMinutes: 120,
          randomizeQuestions: true,
          randomizeOptions: true,
          lessonId: lessonId,
        });
        expect(res.body.assessment.quizPosition).toBeUndefined();
      });

      it('should create PROVA_ABERTA assessment', async () => {
        const payload = {
          title: 'Advanced Programming Essay',
          description: 'Open-ended programming assessment',
          type: 'PROVA_ABERTA',
          passingScore: 75,
          randomizeQuestions: false,
          randomizeOptions: false,
        };

        const res = await request(app.getHttpServer())
          .post('/assessments')
          .send(payload);

        expect(res.status).toBe(201);
        expect(res.body.assessment).toMatchObject({
          title: 'Advanced Programming Essay',
          type: 'PROVA_ABERTA',
          passingScore: 75,
          randomizeQuestions: false,
          randomizeOptions: false,
        });
        expect(res.body.assessment.quizPosition).toBeUndefined();
        expect(res.body.assessment.timeLimitInMinutes).toBeUndefined();
      });

      it('should create assessment without description', async () => {
        const payload = {
          title: 'Simple Quiz',
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          passingScore: 60,
          randomizeQuestions: false,
          randomizeOptions: false,
        };

        const res = await request(app.getHttpServer())
          .post('/assessments')
          .send(payload);

        expect(res.status).toBe(201);
        expect(res.body.assessment.title).toBe('Simple Quiz');
        expect(res.body.assessment.description).toBeUndefined();
      });

      it('should generate correct slug from title with special characters', async () => {
        const payload = {
          title: 'Avaliação de Programação & Lógica!',
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
        };

        const res = await request(app.getHttpServer())
          .post('/assessments')
          .send(payload);

        expect(res.status).toBe(201);
        expect(res.body.assessment.slug).toBe(
          'avaliacao-de-programacao-logica',
        );
      });

      it('should handle minimum and maximum passing scores', async () => {
        // Test minimum score
        const minPayload = {
          title: 'Minimum Score Test',
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          passingScore: 0,
          randomizeQuestions: false,
          randomizeOptions: false,
        };

        const minRes = await request(app.getHttpServer())
          .post('/assessments')
          .send(minPayload);

        expect(minRes.status).toBe(201);
        expect(minRes.body.assessment.passingScore).toBe(0);

        // Test maximum score
        const maxPayload = {
          title: 'Maximum Score Test',
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          passingScore: 100,
          randomizeQuestions: false,
          randomizeOptions: false,
        };

        const maxRes = await request(app.getHttpServer())
          .post('/assessments')
          .send(maxPayload);

        expect(maxRes.status).toBe(201);
        expect(maxRes.body.assessment.passingScore).toBe(100);
      });

      it('should handle minimum time limit for SIMULADO', async () => {
        const payload = {
          title: 'Quick Simulation',
          type: 'SIMULADO',
          passingScore: 70,
          timeLimitInMinutes: 1,
          randomizeQuestions: false,
          randomizeOptions: false,
        };

        const res = await request(app.getHttpServer())
          .post('/assessments')
          .send(payload);

        expect(res.status).toBe(201);
        expect(res.body.assessment.timeLimitInMinutes).toBe(1);
      });
    });

    describe('⚠️ Validation Errors (400)', () => {
      it('should return 400 when title is too short', async () => {
        const payload = {
          title: 'AB',
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
        };

        const res = await request(app.getHttpServer())
          .post('/assessments')
          .send(payload);

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('statusCode', 400);
        expect(Array.isArray(res.body.message)).toBe(true);
      });

      it('should return 400 when type is invalid', async () => {
        const payload = {
          title: 'Valid Title',
          type: 'INVALID_TYPE',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
        };

        const res = await request(app.getHttpServer())
          .post('/assessments')
          .send(payload);

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('statusCode', 400);
        expect(Array.isArray(res.body.message)).toBe(true);
      });

      it('should return 400 when passingScore is below 0', async () => {
        const payload = {
          title: 'Valid Title',
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          passingScore: -10,
          randomizeQuestions: false,
          randomizeOptions: false,
        };

        const res = await request(app.getHttpServer())
          .post('/assessments')
          .send(payload);

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('statusCode', 400);
        expect(Array.isArray(res.body.message)).toBe(true);
      });

      it('should return 400 when passingScore is above 100', async () => {
        const payload = {
          title: 'Valid Title',
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          passingScore: 150,
          randomizeQuestions: false,
          randomizeOptions: false,
        };

        const res = await request(app.getHttpServer())
          .post('/assessments')
          .send(payload);

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('statusCode', 400);
        expect(Array.isArray(res.body.message)).toBe(true);
      });

      it('should return 400 when lessonId is invalid UUID format', async () => {
        const payload = {
          title: 'Quiz With Invalid Lesson',
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
          lessonId: 'invalid-uuid',
        };

        const res = await request(app.getHttpServer())
          .post('/assessments')
          .send(payload);

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('statusCode', 400);
        expect(Array.isArray(res.body.message)).toBe(true);
      });

      it('should return 400 when required fields are missing', async () => {
        const payload = {
          // Missing title, type, passingScore, randomizeQuestions, randomizeOptions
        };

        const res = await request(app.getHttpServer())
          .post('/assessments')
          .send(payload);

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('statusCode', 400);
        expect(Array.isArray(res.body.message)).toBe(true);
        expect(res.body.message.length).toBeGreaterThan(0);
      });

      it('should return 400 with multiple validation errors', async () => {
        const payload = {
          title: 'AB', // Too short
          type: 'INVALID', // Invalid type
          passingScore: -5, // Invalid score
          randomizeQuestions: 'not-boolean', // Invalid type
          randomizeOptions: 'not-boolean', // Invalid type
          lessonId: 'invalid-uuid', // Invalid UUID
        };

        const res = await request(app.getHttpServer())
          .post('/assessments')
          .send(payload);

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('statusCode', 400);
        expect(Array.isArray(res.body.message)).toBe(true);
        expect(res.body.message.length).toBeGreaterThan(0);
      });
    });

    describe('🔄 Business Logic Errors', () => {
      it('should return 409 when assessment title already exists', async () => {
        // Create first assessment
        const firstPayload = {
          title: 'Duplicate Title Test',
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
        };

        const firstRes = await request(app.getHttpServer())
          .post('/assessments')
          .send(firstPayload);

        expect(firstRes.status).toBe(201);

        // Try to create second assessment with same title
        const secondPayload = {
          title: 'Duplicate Title Test',
          type: 'SIMULADO',
          passingScore: 80,
          timeLimitInMinutes: 60,
          randomizeQuestions: true,
          randomizeOptions: true,
        };

        const secondRes = await request(app.getHttpServer())
          .post('/assessments')
          .send(secondPayload);

        expect(secondRes.status).toBe(409);
        expect(secondRes.body).toHaveProperty('error', 'DUPLICATE_ASSESSMENT');
        expect(secondRes.body).toHaveProperty(
          'message',
          'Assessment with this title already exists',
        );
      });

      it('should return 500 when lessonId does not exist', async () => {
        const nonExistentLessonId = '00000000-0000-0000-0000-000000000000';
        const payload = {
          title: 'Quiz With Non-Existent Lesson',
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
          lessonId: nonExistentLessonId,
        };

        const res = await request(app.getHttpServer())
          .post('/assessments')
          .send(payload);

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('error', 'INTERNAL_ERROR');
        expect(res.body).toHaveProperty('message', 'Lesson not found');
      });
    });

    describe('🔍 Edge Cases', () => {
      it('should handle very long but valid title', async () => {
        const longTitle = 'A'.repeat(255); // Assuming max length is around 255
        const payload = {
          title: longTitle,
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
        };

        const res = await request(app.getHttpServer())
          .post('/assessments')
          .send(payload);

        expect(res.status).toBe(201);
        expect(res.body.assessment.title).toBe(longTitle);
      });

      it('should handle very long but valid description', async () => {
        const longDescription = 'B'.repeat(1000);
        const payload = {
          title: 'Assessment With Long Description',
          description: longDescription,
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
        };

        const res = await request(app.getHttpServer())
          .post('/assessments')
          .send(payload);

        expect(res.status).toBe(201);
        expect(res.body.assessment.description).toBe(longDescription);
      });

      it('should handle unicode characters in title', async () => {
        const unicodeTitle = 'Avaliação 中文 العربية русский 🎯';
        const payload = {
          title: unicodeTitle,
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
        };

        const res = await request(app.getHttpServer())
          .post('/assessments')
          .send(payload);

        expect(res.status).toBe(201);
        expect(res.body.assessment.title).toBe(unicodeTitle);
        // Slug should handle unicode properly
        expect(res.body.assessment.slug).toMatch(/^[a-z0-9-]+$/);
      });

      it('should handle very high time limit', async () => {
        const payload = {
          title: 'Long Duration Exam',
          type: 'SIMULADO',
          passingScore: 70,
          timeLimitInMinutes: 9999,
          randomizeQuestions: false,
          randomizeOptions: false,
        };

        const res = await request(app.getHttpServer())
          .post('/assessments')
          .send(payload);

        expect(res.status).toBe(201);
        expect(res.body.assessment.timeLimitInMinutes).toBe(9999);
      });

      it('should maintain data integrity after creation', async () => {
        const payload = {
          title: 'Integrity Test Assessment',
          description: 'Testing data integrity',
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          passingScore: 85,
          randomizeQuestions: true,
          randomizeOptions: false,
          lessonId: lessonId,
        };

        const res = await request(app.getHttpServer())
          .post('/assessments')
          .send(payload);

        expect(res.status).toBe(201);
        const assessmentId = res.body.assessment.id;

        // Verify data was saved correctly in database
        const savedAssessment = await prisma.assessment.findUnique({
          where: { id: assessmentId },
        });

        expect(savedAssessment).toMatchObject({
          title: 'Integrity Test Assessment',
          description: 'Testing data integrity',
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          passingScore: 85,
          randomizeQuestions: true,
          randomizeOptions: false,
          lessonId: lessonId,
        });

        // Verify lesson relationship
        expect(savedAssessment?.lessonId).toBe(lessonId);
      });

      it('should handle concurrent assessment creation', async () => {
        const payload1 = {
          title: 'Concurrent Test 1',
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
        };

        const payload2 = {
          title: 'Concurrent Test 2',
          type: 'SIMULADO',
          passingScore: 80,
          timeLimitInMinutes: 60,
          randomizeQuestions: true,
          randomizeOptions: true,
        };

        // Send requests concurrently
        const [res1, res2] = await Promise.all([
          request(app.getHttpServer()).post('/assessments').send(payload1),
          request(app.getHttpServer()).post('/assessments').send(payload2),
        ]);

        expect(res1.status).toBe(201);
        expect(res2.status).toBe(201);
        expect(res1.body.assessment.title).toBe('Concurrent Test 1');
        expect(res2.body.assessment.title).toBe('Concurrent Test 2');

        // Verify both were saved
        const count = await prisma.assessment.count();
        expect(count).toBe(2);
      });

      it('should preserve assessment relationships after lesson deletion simulation', async () => {
        // Create assessment with lesson
        const payload = {
          title: 'Assessment With Lesson Relationship',
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
          lessonId: lessonId,
        };

        const res = await request(app.getHttpServer())
          .post('/assessments')
          .send(payload);

        expect(res.status).toBe(201);
        const assessmentId = res.body.assessment.id;

        // Verify assessment exists with correct lesson relationship
        const assessment = await prisma.assessment.findUnique({
          where: { id: assessmentId },
          include: { lesson: true },
        });

        expect(assessment).toBeDefined();
        expect(assessment?.lesson).toBeDefined();
        expect(assessment?.lesson?.id).toBe(lessonId);
      });
    });

    describe('🔧 Response Format Validation', () => {
      it('should return correctly structured success response', async () => {
        const payload = {
          title: 'Response Format Test',
          description: 'Testing response structure',
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          passingScore: 75,
          randomizeQuestions: true,
          randomizeOptions: false,
          lessonId: lessonId,
        };

        const res = await request(app.getHttpServer())
          .post('/assessments')
          .send(payload);

        expect(res.status).toBe(201);

        // Verify response structure
        expect(res.body).toEqual({
          success: true,
          assessment: {
            id: expect.any(String),
            slug: expect.any(String),
            title: 'Response Format Test',
            description: 'Testing response structure',
            type: 'QUIZ',
            quizPosition: 'AFTER_LESSON',
            passingScore: 75,
            randomizeQuestions: true,
            randomizeOptions: false,
            lessonId: lessonId,
          },
        });

        // Verify UUID format
        expect(res.body.assessment.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        );

        // Verify slug format
        expect(res.body.assessment.slug).toMatch(/^[a-z0-9-]+$/);
        expect(res.body.assessment.slug).toBe('response-format-test');
      });

      it('should not include undefined fields in response', async () => {
        const payload = {
          title: 'Minimal Response Test',
          type: 'PROVA_ABERTA',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
          // No description, quizPosition, timeLimitInMinutes, lessonId
        };

        const res = await request(app.getHttpServer())
          .post('/assessments')
          .send(payload);

        expect(res.status).toBe(201);

        const assessment = res.body.assessment;
        expect(assessment).not.toHaveProperty('description');
        expect(assessment).not.toHaveProperty('quizPosition');
        expect(assessment).not.toHaveProperty('timeLimitInMinutes');
        expect(assessment).not.toHaveProperty('lessonId');

        // These should still be present
        expect(assessment).toHaveProperty('id');
        expect(assessment).toHaveProperty('slug');
        expect(assessment).toHaveProperty('title');
        expect(assessment).toHaveProperty('type');
        expect(assessment).toHaveProperty('passingScore');
        expect(assessment).toHaveProperty('randomizeQuestions');
        expect(assessment).toHaveProperty('randomizeOptions');
      });
    });

    describe('⚡ Performance and Reliability', () => {
      it('should handle large payload efficiently', async () => {
        const payload = {
          title:
            'Performance Test Assessment with Very Long Title ' +
            'A'.repeat(200),
          description:
            'Performance test description with detailed content and comprehensive explanation of the assessment objectives, methodology, and expected outcomes. ' +
            'B'.repeat(800),
          type: 'SIMULADO',
          passingScore: 85,
          timeLimitInMinutes: 180,
          randomizeQuestions: true,
          randomizeOptions: true,
          lessonId: lessonId,
        };

        const startTime = Date.now();
        const res = await request(app.getHttpServer())
          .post('/assessments')
          .send(payload);
        const endTime = Date.now();

        expect(res.status).toBe(201);
        expect(endTime - startTime).toBeLessThan(3000); // Should complete within 3 seconds

        // Verify data was processed correctly
        expect(res.body.assessment.title).toContain(
          'Performance Test Assessment',
        );
        expect(res.body.assessment.description).toContain(
          'Performance test description',
        );
      });

      it('should handle rapid sequential requests', async () => {
        const requests: Promise<any>[] = [];
        for (let i = 1; i <= 5; i++) {
          const payload = {
            title: `Sequential Test ${i}`,
            type: 'QUIZ',
            quizPosition: 'AFTER_LESSON',
            passingScore: 70,

            randomizeQuestions: false,
            randomizeOptions: false,
          };
          requests.push(
            request(app.getHttpServer()).post('/assessments').send(payload),
          );
        }

        const responses = await Promise.all(requests);

        responses.forEach((res, index) => {
          expect(res.status).toBe(201);
          expect(res.body.assessment.title).toBe(
            `Sequential Test ${index + 1}`,
          );
        });

        // Verify all were saved
        const count = await prisma.assessment.count();
        expect(count).toBe(5);
      });

      it('should maintain consistency under load', async () => {
        const assessmentCount = 10;
        const requests: Promise<any>[] = [];

        for (let i = 1; i <= assessmentCount; i++) {
          const payload = {
            title: `Load Test Assessment ${i}`,
            type: i % 2 === 0 ? 'SIMULADO' : 'QUIZ',
            ...(i % 2 === 0
              ? { passingScore: 80, timeLimitInMinutes: 60 }
              : { passingScore: 70, quizPosition: 'AFTER_LESSON' }),
            randomizeQuestions: i % 2 === 0,
            randomizeOptions: i % 3 === 0,
          };

          requests.push(
            request(app.getHttpServer()).post('/assessments').send(payload),
          );
        }

        const responses = await Promise.all(requests);

        // All should succeed
        responses.forEach((res, index) => {
          expect(res.status).toBe(201);
          expect(res.body.assessment.title).toBe(
            `Load Test Assessment ${index + 1}`,
          );
        });

        // Verify database consistency
        const savedAssessments = await prisma.assessment.findMany({
          where: { title: { startsWith: 'Load Test Assessment' } },
          orderBy: { createdAt: 'asc' }, // Use createdAt instead of title for consistent ordering
        });

        expect(savedAssessments).toHaveLength(assessmentCount);

        // Verify data integrity - match by title number, not array index
        savedAssessments.forEach((assessment) => {
          const titleMatch = assessment.title.match(
            /Load Test Assessment (\d+)/,
          );
          expect(titleMatch).toBeTruthy();

          const assessmentNumber = parseInt(titleMatch![1]);
          const expectedType = assessmentNumber % 2 === 0 ? 'SIMULADO' : 'QUIZ';
          expect(assessment.type).toBe(expectedType);
        });
      });
    });
  });
});
