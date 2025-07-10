// test/e2e/assessments.e2e.spec.ts
import request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../src/prisma/prisma.service';

// Create a minimal module for testing just the assessment controller
import { CreateAssessmentUseCase } from '../../src/domain/assessment/application/use-cases/create-assessment.use-case';
import { ListAssessmentsUseCase } from '../../src/domain/assessment/application/use-cases/list-assessments.use-case';
import { GetAssessmentUseCase } from '../../src/domain/assessment/application/use-cases/get-assessment.use-case';
import { DeleteAssessmentUseCase } from '../../src/domain/assessment/application/use-cases/delete-assessment.use-case';
import { AssessmentController } from '../../src/infra/controllers/assessment.controller';
import { PrismaAssessmentRepository } from '../../src/infra/database/prisma/repositories/prisma-assessment-repository';
import { PrismaLessonRepository } from '../../src/infra/database/prisma/repositories/prisma-lesson-repository';
import { Module } from '@nestjs/common';

@Module({
  controllers: [AssessmentController],
  providers: [
    CreateAssessmentUseCase,
    ListAssessmentsUseCase,
    GetAssessmentUseCase,
    DeleteAssessmentUseCase,
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

  describe('[GET] /assessments - List Assessments', () => {
    beforeEach(async () => {
      // Create some test assessments for listing
      await prisma.assessment.createMany({
        data: [
          {
            id: '11111111-1111-1111-1111-111111111111',
            slug: 'quiz-javascript-basics',
            title: 'Quiz JavaScript Basics',
            description: 'Basic JavaScript quiz',
            type: 'QUIZ',
            quizPosition: 'AFTER_LESSON',
            passingScore: 70,
            randomizeQuestions: true,
            randomizeOptions: false,
            lessonId: lessonId,
          },
          {
            id: '22222222-2222-2222-2222-222222222222',
            slug: 'simulado-programming',
            title: 'Simulado Programming',
            description: 'Programming simulation exam',
            type: 'SIMULADO',
            passingScore: 80,
            timeLimitInMinutes: 120,
            randomizeQuestions: true,
            randomizeOptions: true,
          },
          {
            id: '33333333-3333-3333-3333-333333333333',
            slug: 'prova-aberta-advanced',
            title: 'Prova Aberta Advanced',
            description: 'Advanced open exam',
            type: 'PROVA_ABERTA',
            passingScore: 75,
            randomizeQuestions: false,
            randomizeOptions: false,
          },
          {
            id: '44444444-4444-4444-4444-444444444444',
            slug: 'quiz-lesson-specific',
            title: 'Quiz Lesson Specific',
            type: 'QUIZ',
            quizPosition: 'BEFORE_LESSON',
            passingScore: 65,
            randomizeQuestions: false,
            randomizeOptions: true,
            lessonId: lessonId,
          },
        ],
      });
    });

    describe('✅ Success Cases', () => {
      it('should list all assessments with default pagination', async () => {
        const res = await request(app.getHttpServer()).get('/assessments');

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('assessments');
        expect(res.body).toHaveProperty('pagination');
        expect(Array.isArray(res.body.assessments)).toBe(true);
        expect(res.body.assessments).toHaveLength(4);
        expect(res.body.pagination).toMatchObject({
          page: 1,
          limit: 10,
          total: 4,
          totalPages: 1,
        });
      });

      it('should list assessments with custom pagination', async () => {
        const res = await request(app.getHttpServer())
          .get('/assessments')
          .query({ page: 1, limit: 2 });

        expect(res.status).toBe(200);
        expect(res.body.assessments).toHaveLength(2);
        expect(res.body.pagination).toMatchObject({
          page: 1,
          limit: 2,
          total: 4,
          totalPages: 2,
        });
      });

      it('should filter assessments by type QUIZ', async () => {
        const res = await request(app.getHttpServer())
          .get('/assessments')
          .query({ type: 'QUIZ' });

        expect(res.status).toBe(200);
        expect(res.body.assessments).toHaveLength(2);
        res.body.assessments.forEach((assessment: any) => {
          expect(assessment.type).toBe('QUIZ');
        });
      });

      it('should filter assessments by type SIMULADO', async () => {
        const res = await request(app.getHttpServer())
          .get('/assessments')
          .query({ type: 'SIMULADO' });

        expect(res.status).toBe(200);
        expect(res.body.assessments).toHaveLength(1);
        expect(res.body.assessments[0].type).toBe('SIMULADO');
        expect(res.body.assessments[0].title).toBe('Simulado Programming');
      });

      it('should filter assessments by type PROVA_ABERTA', async () => {
        const res = await request(app.getHttpServer())
          .get('/assessments')
          .query({ type: 'PROVA_ABERTA' });

        expect(res.status).toBe(200);
        expect(res.body.assessments).toHaveLength(1);
        expect(res.body.assessments[0].type).toBe('PROVA_ABERTA');
        expect(res.body.assessments[0].title).toBe('Prova Aberta Advanced');
      });

      it('should filter assessments by lessonId', async () => {
        const res = await request(app.getHttpServer())
          .get('/assessments')
          .query({ lessonId: lessonId });

        expect(res.status).toBe(200);
        expect(res.body.assessments).toHaveLength(2);
        res.body.assessments.forEach((assessment: any) => {
          expect(assessment.lessonId).toBe(lessonId);
        });
      });

      it('should filter by type and lessonId combined', async () => {
        const res = await request(app.getHttpServer())
          .get('/assessments')
          .query({ type: 'QUIZ', lessonId: lessonId });

        expect(res.status).toBe(200);
        expect(res.body.assessments).toHaveLength(2);
        res.body.assessments.forEach((assessment: any) => {
          expect(assessment.type).toBe('QUIZ');
          expect(assessment.lessonId).toBe(lessonId);
        });
      });

      it('should handle pagination with filtering', async () => {
        const res = await request(app.getHttpServer())
          .get('/assessments')
          .query({ type: 'QUIZ', page: 1, limit: 1 });

        expect(res.status).toBe(200);
        expect(res.body.assessments).toHaveLength(1);
        expect(res.body.assessments[0].type).toBe('QUIZ');
        expect(res.body.pagination).toMatchObject({
          page: 1,
          limit: 1,
          total: 2,
          totalPages: 2,
        });
      });

      it('should return empty results when no assessments match filter', async () => {
        // Delete all assessments and create one that won't match our filter
        await prisma.assessment.deleteMany({});
        await prisma.assessment.create({
          data: {
            id: '55555555-5555-5555-5555-555555555555',
            slug: 'different-quiz',
            title: 'Different Quiz',
            type: 'QUIZ',
            quizPosition: 'AFTER_LESSON',
            passingScore: 70,
            randomizeQuestions: false,
            randomizeOptions: false,
          },
        });

        const res = await request(app.getHttpServer())
          .get('/assessments')
          .query({ type: 'SIMULADO' });

        expect(res.status).toBe(200);
        expect(res.body.assessments).toHaveLength(0);
        expect(res.body.pagination).toMatchObject({
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        });
      });

      it('should return correct assessment structure', async () => {
        const res = await request(app.getHttpServer())
          .get('/assessments')
          .query({ limit: 1 });

        expect(res.status).toBe(200);
        expect(res.body.assessments).toHaveLength(1);

        const assessment = res.body.assessments[0];
        expect(assessment).toHaveProperty('id');
        expect(assessment).toHaveProperty('slug');
        expect(assessment).toHaveProperty('title');
        expect(assessment).toHaveProperty('type');
        expect(assessment).toHaveProperty('passingScore');
        expect(assessment).toHaveProperty('randomizeQuestions');
        expect(assessment).toHaveProperty('randomizeOptions');
        
        // Check UUID format
        expect(assessment.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        );
      });

      it('should handle large page numbers gracefully', async () => {
        const res = await request(app.getHttpServer())
          .get('/assessments')
          .query({ page: 50, limit: 10 });

        expect(res.status).toBe(200);
        expect(res.body.assessments).toHaveLength(0);
        expect(res.body.pagination).toMatchObject({
          page: 50,
          limit: 10,
          total: 4,
          totalPages: 1,
        });
      });

      it('should handle maximum limit correctly', async () => {
        const res = await request(app.getHttpServer())
          .get('/assessments')
          .query({ limit: 100 });

        expect(res.status).toBe(200);
        expect(res.body.assessments).toHaveLength(4);
        expect(res.body.pagination.limit).toBe(100);
      });
    });

    describe('⚠️ Validation Errors (400)', () => {
      it('should return 400 when page is zero', async () => {
        const res = await request(app.getHttpServer())
          .get('/assessments')
          .query({ page: 0 });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'INVALID_INPUT');
        expect(res.body).toHaveProperty('details');
      });

      it('should return 400 when page is negative', async () => {
        const res = await request(app.getHttpServer())
          .get('/assessments')
          .query({ page: -1 });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'INVALID_INPUT');
      });

      it('should return 400 when limit is zero', async () => {
        const res = await request(app.getHttpServer())
          .get('/assessments')
          .query({ limit: 0 });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'INVALID_INPUT');
      });

      it('should return 400 when limit is negative', async () => {
        const res = await request(app.getHttpServer())
          .get('/assessments')
          .query({ limit: -5 });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'INVALID_INPUT');
      });

      it('should return 400 when limit exceeds maximum', async () => {
        const res = await request(app.getHttpServer())
          .get('/assessments')
          .query({ limit: 101 });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'INVALID_INPUT');
      });

      it('should return 400 when type is invalid', async () => {
        const res = await request(app.getHttpServer())
          .get('/assessments')
          .query({ type: 'INVALID_TYPE' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'INVALID_INPUT');
      });

      it('should return 400 when lessonId is not a valid UUID', async () => {
        const res = await request(app.getHttpServer())
          .get('/assessments')
          .query({ lessonId: 'invalid-uuid' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'INVALID_INPUT');
      });

      it('should return 400 with multiple invalid parameters', async () => {
        const res = await request(app.getHttpServer())
          .get('/assessments')
          .query({ 
            page: -1, 
            limit: 200, 
            type: 'WRONG_TYPE',
            lessonId: 'not-uuid'
          });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'INVALID_INPUT');
        expect(res.body).toHaveProperty('details');
      });

      it('should return 400 when page is not a number', async () => {
        const res = await request(app.getHttpServer())
          .get('/assessments')
          .query({ page: 'abc' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'INVALID_INPUT');
      });

      it('should return 400 when limit is not a number', async () => {
        const res = await request(app.getHttpServer())
          .get('/assessments')
          .query({ limit: 'xyz' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'INVALID_INPUT');
      });
    });

    describe('🔍 Business Logic Errors', () => {
      it('should return 404 when lessonId does not exist', async () => {
        const nonExistentLessonId = '00000000-0000-0000-0000-000000000000';
        
        const res = await request(app.getHttpServer())
          .get('/assessments')
          .query({ lessonId: nonExistentLessonId });

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'LESSON_NOT_FOUND');
        expect(res.body).toHaveProperty('message', 'Lesson not found');
      });

      it('should handle lesson with no associated assessments', async () => {
        // Create a new lesson with no assessments
        const newLesson = await prisma.lesson.create({
          data: {
            slug: 'lesson-no-assessments',
            moduleId,
            order: 2,
            translations: {
              create: [
                { locale: 'pt', title: 'Lesson No Assessments', description: 'Test' },
              ],
            },
          },
        });

        const res = await request(app.getHttpServer())
          .get('/assessments')
          .query({ lessonId: newLesson.id });

        expect(res.status).toBe(200);
        expect(res.body.assessments).toHaveLength(0);
        expect(res.body.pagination).toMatchObject({
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        });
      });
    });

    describe('🔧 Edge Cases', () => {
      it('should handle empty string parameters correctly', async () => {
        const res = await request(app.getHttpServer())
          .get('/assessments')
          .query({ page: '', limit: '', type: '', lessonId: '' });

        // Empty strings for page/limit are treated as invalid and return 400
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'INVALID_INPUT');
      });

      it('should maintain consistent ordering across paginated requests', async () => {
        // Get first page
        const firstPage = await request(app.getHttpServer())
          .get('/assessments')
          .query({ page: 1, limit: 2 });

        // Get second page
        const secondPage = await request(app.getHttpServer())
          .get('/assessments')
          .query({ page: 2, limit: 2 });

        expect(firstPage.status).toBe(200);
        expect(secondPage.status).toBe(200);
        expect(firstPage.body.assessments).toHaveLength(2);
        expect(secondPage.body.assessments).toHaveLength(2);

        // Ensure no duplicates between pages
        const firstPageIds = firstPage.body.assessments.map((a: any) => a.id);
        const secondPageIds = secondPage.body.assessments.map((a: any) => a.id);
        const intersection = firstPageIds.filter((id: string) => secondPageIds.includes(id));
        expect(intersection).toHaveLength(0);
      });

      it('should handle special characters in query parameters', async () => {
        const res = await request(app.getHttpServer())
          .get('/assessments')
          .query({ type: 'QUIZ%20SPECIAL' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'INVALID_INPUT');
      });

      it('should handle concurrent list requests', async () => {
        const requests: Promise<any>[] = [
          request(app.getHttpServer()).get('/assessments').query({ type: 'QUIZ' }),
          request(app.getHttpServer()).get('/assessments').query({ type: 'SIMULADO' }),
          request(app.getHttpServer()).get('/assessments').query({ lessonId: lessonId }),
        ];

        const responses = await Promise.all(requests);

        responses.forEach((res: any) => {
          expect(res.status).toBe(200);
          expect(res.body).toHaveProperty('assessments');
          expect(res.body).toHaveProperty('pagination');
        });

        expect(responses[0].body.assessments).toHaveLength(2); // QUIZ type
        expect(responses[1].body.assessments).toHaveLength(1); // SIMULADO type
        expect(responses[2].body.assessments).toHaveLength(2); // By lessonId
      });
    });

    describe('⚡ Performance Tests', () => {
      it('should respond quickly for large result sets', async () => {
        // Create many assessments for performance testing
        const manyAssessments = Array.from({ length: 50 }, (_, i) => ({
          id: `perf-${i.toString().padStart(4, '0')}-1111-1111-1111-111111111111`,
          slug: `performance-test-${i}`,
          title: `Performance Test Assessment ${i}`,
          type: 'QUIZ' as const,
          quizPosition: 'AFTER_LESSON' as const,
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
        }));

        await prisma.assessment.createMany({
          data: manyAssessments,
        });

        const startTime = Date.now();
        const res = await request(app.getHttpServer())
          .get('/assessments')
          .query({ limit: 100 });
        const endTime = Date.now();

        expect(res.status).toBe(200);
        expect(res.body.assessments.length).toBeGreaterThanOrEqual(50);
        expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
      });

      it('should handle rapid sequential pagination requests', async () => {
        const requests: Promise<any>[] = [];
        for (let page = 1; page <= 5; page++) {
          requests.push(
            request(app.getHttpServer())
              .get('/assessments')
              .query({ page, limit: 1 })
          );
        }

        const responses = await Promise.all(requests);

        responses.forEach((res: any, index: number) => {
          expect(res.status).toBe(200);
          expect(res.body.pagination.page).toBe(index + 1);
          expect(res.body.pagination.limit).toBe(1);
        });
      });
    });

    describe('📊 Data Integrity Tests', () => {
      it('should return assessments sorted by creation date (newest first)', async () => {
        const res = await request(app.getHttpServer()).get('/assessments');

        expect(res.status).toBe(200);
        const assessments = res.body.assessments;
        
        // Verify ordering - should be sorted by createdAt descending
        for (let i = 1; i < assessments.length; i++) {
          const current = new Date(assessments[i].createdAt || 0);
          const previous = new Date(assessments[i - 1].createdAt || 0);
          expect(current.getTime()).toBeLessThanOrEqual(previous.getTime());
        }
      });

      it('should include all required fields in assessment response', async () => {
        const res = await request(app.getHttpServer())
          .get('/assessments')
          .query({ limit: 1 });

        expect(res.status).toBe(200);
        const assessment = res.body.assessments[0];

        // Required fields that should always be present
        expect(assessment).toHaveProperty('id');
        expect(assessment).toHaveProperty('slug');
        expect(assessment).toHaveProperty('title');
        expect(assessment).toHaveProperty('type');
        expect(assessment).toHaveProperty('passingScore');
        expect(assessment).toHaveProperty('randomizeQuestions');
        expect(assessment).toHaveProperty('randomizeOptions');

        // Type-specific fields (should be present when applicable)
        if (assessment.type === 'QUIZ') {
          expect(assessment).toHaveProperty('quizPosition');
        }
        if (assessment.type === 'SIMULADO') {
          expect(assessment).toHaveProperty('timeLimitInMinutes');
        }
      });

      it('should maintain pagination metadata accuracy', async () => {
        const totalRes = await request(app.getHttpServer()).get('/assessments');
        const totalCount = totalRes.body.assessments.length;

        const limitedRes = await request(app.getHttpServer())
          .get('/assessments')
          .query({ limit: 2 });

        expect(limitedRes.status).toBe(200);
        expect(limitedRes.body.pagination).toMatchObject({
          page: 1,
          limit: 2,
          total: totalCount,
          totalPages: Math.ceil(totalCount / 2),
        });
      });
    });
  });

  describe('[GET] /assessments/:id - Get Assessment By ID', () => {
    let assessmentId: string;

    beforeEach(async () => {
      const assessment = await prisma.assessment.create({
        data: {
          slug: 'get-by-id-test',
          title: 'Get By ID Test',
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          passingScore: 75,
          randomizeQuestions: true,
          randomizeOptions: true,
          lessonId: lessonId,
        },
      });
      assessmentId = assessment.id;
    });

    it('should return an assessment by its ID', async () => {
      const res = await request(app.getHttpServer()).get(
        `/assessments/${assessmentId}`,
      );

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('assessment');
      expect(res.body.assessment.id).toBe(assessmentId);
      expect(res.body.assessment.title).toBe('Get By ID Test');
    });

    it('should return 404 when assessment is not found', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app.getHttpServer()).get(
        `/assessments/${nonExistentId}`,
      );

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'ASSESSMENT_NOT_FOUND');
    });

    it('should return 400 for an invalid UUID', async () => {
      const invalidId = 'invalid-uuid';
      const res = await request(app.getHttpServer()).get(
        `/assessments/${invalidId}`,
      );

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'INVALID_INPUT');
    });
  });

  describe('[DELETE] /assessments/:id - Delete Assessment', () => {
    let assessmentId: string;

    beforeEach(async () => {
      const assessment = await prisma.assessment.create({
        data: {
          slug: 'delete-test',
          title: 'Delete Test',
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          passingScore: 75,
          randomizeQuestions: true,
          randomizeOptions: true,
          lessonId: lessonId,
        },
      });
      assessmentId = assessment.id;
    });

    it('should delete an assessment successfully', async () => {
      const res = await request(app.getHttpServer()).delete(
        `/assessments/${assessmentId}`,
      );

      expect(res.status).toBe(200);

      const deletedAssessment = await prisma.assessment.findUnique({
        where: { id: assessmentId },
      });
      expect(deletedAssessment).toBeNull();
    });

    it('should return 404 when trying to delete an assessment that does not exist', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app.getHttpServer()).delete(
        `/assessments/${nonExistentId}`,
      );

      expect(res.status).toBe(404);
    });

    it('should return 400 for an invalid UUID', async () => {
      const invalidId = 'invalid-uuid';
      const res = await request(app.getHttpServer()).delete(
        `/assessments/${invalidId}`,
      );

      expect(res.status).toBe(400);
    });
  });
});
