// test/e2e/assessment/post-assessments.e2e.spec.ts
import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AssessmentTestSetup } from './shared/assessment-test-setup';
import { AssessmentTestHelpers } from './shared/assessment-test-helpers';
import { AssessmentTestData } from './shared/assessment-test-data';
import { E2ETestModule } from '../test-helpers/e2e-test-module';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';

describe('[POST] /assessments - Create Assessment (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let testSetup: AssessmentTestSetup;
  let testHelpers: AssessmentTestHelpers;
  let courseId: string;
  let moduleId: string;
  let lessonId: string;

  beforeAll(async () => {
    const { app: testApp } = await E2ETestModule.create([AppModule]);
    app = testApp;
    prisma = app.get(PrismaService);

    testSetup = new AssessmentTestSetup(prisma);
    testHelpers = new AssessmentTestHelpers(app);
  });

  afterAll(async () => {
    await testSetup.cleanup();
    await app.close();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await testSetup.cleanup();
    
    // Create test data structure
    const testData = await testSetup.createCourseStructure();
    courseId = testData.courseId;
    moduleId = testData.moduleId;
    lessonId = testData.lessonId;
  });

  describe('✅ Success Cases', () => {
    it('should create QUIZ assessment with lessonId successfully', async () => {
      const payload = AssessmentTestData.createQuizPayload({ lessonId });

      const res = await testHelpers.createAssessment(payload);

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
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      // Verify that it was saved in the database
      const savedAssessment = await prisma.assessment.findUnique({
        where: { id: res.body.assessment.id },
      });
      expect(savedAssessment).toBeDefined();
      expect(savedAssessment?.title).toBe('JavaScript Fundamentals Quiz');
    });

    it('should create QUIZ assessment without lessonId', async () => {
      const payload = AssessmentTestData.createQuizPayload({
        title: 'Generic JavaScript Quiz',
        description: 'Generic quiz not tied to a specific lesson',
        quizPosition: 'BEFORE_LESSON',
        passingScore: 75,
        randomizeQuestions: true,
        randomizeOptions: true,
      });

      const res = await testHelpers.createAssessment(payload);

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
      const payload = AssessmentTestData.createSimuladoPayload({ lessonId });

      const res = await testHelpers.createAssessment(payload);

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
      const payload = AssessmentTestData.createProvaAbertaPayload();

      const res = await testHelpers.createAssessment(payload);

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
      const payload = AssessmentTestData.createQuizPayload({
        title: 'Simple Quiz',
        description: undefined,
        passingScore: 60,
      });

      const res = await testHelpers.createAssessment(payload);

      expect(res.status).toBe(201);
      expect(res.body.assessment.title).toBe('Simple Quiz');
      expect(res.body.assessment.description).toBeUndefined();
    });

    it('should generate correct slug from title with special characters', async () => {
      const payload = AssessmentTestData.createEdgeCasePayloads().specialCharsTitle;

      const res = await testHelpers.createAssessment(payload);

      expect(res.status).toBe(201);
      expect(res.body.assessment.slug).toBe('avaliacao-de-programacao-logica');
    });

    it('should handle minimum and maximum passing scores', async () => {
      // Test minimum score
      const minPayload = AssessmentTestData.createQuizPayload({
        title: 'Minimum Score Test',
        passingScore: 0,
      });

      const minRes = await testHelpers.createAssessment(minPayload);

      expect(minRes.status).toBe(201);
      expect(minRes.body.assessment.passingScore).toBe(0);

      // Test maximum score
      const maxPayload = AssessmentTestData.createQuizPayload({
        title: 'Maximum Score Test',
        passingScore: 100,
      });

      const maxRes = await testHelpers.createAssessment(maxPayload);

      expect(maxRes.status).toBe(201);
      expect(maxRes.body.assessment.passingScore).toBe(100);
    });

    it('should handle minimum time limit for SIMULADO', async () => {
      const payload = AssessmentTestData.createSimuladoPayload({
        title: 'Quick Simulation',
        timeLimitInMinutes: 1,
      });

      const res = await testHelpers.createAssessment(payload);

      expect(res.status).toBe(201);
      expect(res.body.assessment.timeLimitInMinutes).toBe(1);
    });
  });

  describe('⚠️ Validation Errors (400)', () => {
    it('should return 400 when title is too short', async () => {
      const payload = AssessmentTestData.createInvalidPayloads().shortTitle;

      const res = await testHelpers.createAssessment(payload);

      testHelpers.expectValidationError(res);
    });

    it('should return 400 when type is invalid', async () => {
      const payload = AssessmentTestData.createInvalidPayloads().invalidType;

      const res = await testHelpers.createAssessment(payload);

      testHelpers.expectValidationError(res);
    });

    it('should return 400 when passingScore is below 0', async () => {
      const payload = AssessmentTestData.createInvalidPayloads().negativeScore;

      const res = await testHelpers.createAssessment(payload);

      testHelpers.expectValidationError(res);
    });

    it('should return 400 when passingScore is above 100', async () => {
      const payload = AssessmentTestData.createInvalidPayloads().scoreAbove100;

      const res = await testHelpers.createAssessment(payload);

      testHelpers.expectValidationError(res);
    });

    it('should return 400 when lessonId is invalid UUID format', async () => {
      const payload = AssessmentTestData.createInvalidPayloads().invalidLessonId;

      const res = await testHelpers.createAssessment(payload);

      testHelpers.expectValidationError(res);
    });

    it('should return 400 when required fields are missing', async () => {
      const payload = AssessmentTestData.createInvalidPayloads().missingTitle;

      const res = await testHelpers.createAssessment(payload);

      testHelpers.expectValidationError(res);
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

      const res = await testHelpers.createAssessment(payload);

      testHelpers.expectValidationError(res);
    });
  });

  describe('🔄 Business Logic Errors', () => {
    it('should return 409 when assessment title already exists', async () => {
      // Create first assessment
      const payload = AssessmentTestData.createQuizPayload({
        title: 'Duplicate Title Test',
      });

      const firstRes = await testHelpers.createAssessment(payload);
      expect(firstRes.status).toBe(201);

      // Try to create second assessment with same title
      const secondPayload = AssessmentTestData.createSimuladoPayload({
        title: 'Duplicate Title Test',
      });

      const secondRes = await testHelpers.createAssessment(secondPayload);

      testHelpers.expectConflictError(secondRes);
    });

    it('should return 404 when lessonId does not exist', async () => {
      const payload = AssessmentTestData.createQuizPayload({
        title: 'Quiz With Non-Existent Lesson',
        lessonId: AssessmentTestData.NON_EXISTENT_UUID,
      });

      const res = await testHelpers.createAssessment(payload);

      testHelpers.expectNotFoundError(res);
    });
  });

  describe('🔍 Edge Cases', () => {
    it('should handle very long but valid title', async () => {
      const payload = AssessmentTestData.createEdgeCasePayloads().longTitle;

      const res = await testHelpers.createAssessment(payload);

      expect(res.status).toBe(201);
      expect(res.body.assessment.title).toBe('A'.repeat(255));
    });

    it('should handle very long but valid description', async () => {
      const payload = AssessmentTestData.createEdgeCasePayloads().longDescription;

      const res = await testHelpers.createAssessment(payload);

      expect(res.status).toBe(201);
      expect(res.body.assessment.description).toBe('B'.repeat(1000));
    });

    it('should handle unicode characters in title', async () => {
      const payload = AssessmentTestData.createEdgeCasePayloads().unicodeTitle;

      const res = await testHelpers.createAssessment(payload);

      expect(res.status).toBe(201);
      expect(res.body.assessment.title).toBe('Avaliação 中文 العربية русский 🎯');
      expect(res.body.assessment.slug).toMatch(/^[a-z0-9-]+$/);
    });

    it('should handle very high time limit', async () => {
      const payload = AssessmentTestData.createSimuladoPayload({
        title: 'Long Duration Exam',
        timeLimitInMinutes: 9999,
      });

      const res = await testHelpers.createAssessment(payload);

      expect(res.status).toBe(201);
      expect(res.body.assessment.timeLimitInMinutes).toBe(9999);
    });

    it('should maintain data integrity after creation', async () => {
      const payload = AssessmentTestData.createQuizPayload({
        title: 'Integrity Test Assessment',
        description: 'Testing data integrity',
        passingScore: 85,
        randomizeQuestions: true,
        lessonId: lessonId,
      });

      const res = await testHelpers.createAssessment(payload);

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
      const payload1 = AssessmentTestData.createQuizPayload({
        title: 'Concurrent Test 1',
      });

      const payload2 = AssessmentTestData.createSimuladoPayload({
        title: 'Concurrent Test 2',
      });

      // Send requests concurrently
      const [res1, res2] = await Promise.all([
        testHelpers.createAssessment(payload1),
        testHelpers.createAssessment(payload2),
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
      const payload = AssessmentTestData.createQuizPayload({
        title: 'Assessment With Lesson Relationship',
        lessonId: lessonId,
      });

      const res = await testHelpers.createAssessment(payload);

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
      const payload = AssessmentTestData.createQuizPayload({
        title: 'Response Format Test',
        description: 'Testing response structure',
        passingScore: 75,
        randomizeQuestions: true,
        lessonId: lessonId,
      });

      const res = await testHelpers.createAssessment(payload);

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
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      });

      // Verify UUID format
      expect(res.body.assessment.id).toMatch(AssessmentTestData.UUID_REGEX);

      // Verify slug format
      expect(res.body.assessment.slug).toMatch(/^[a-z0-9-]+$/);
      expect(res.body.assessment.slug).toBe('response-format-test');
    });

    it('should not include undefined fields in response', async () => {
      const payload = AssessmentTestData.createProvaAbertaPayload({
        title: 'Minimal Response Test',
        description: undefined,
      });

      const res = await testHelpers.createAssessment(payload);

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
        title: 'Performance Test Assessment with Very Long Title ' + 'A'.repeat(200),
        description: 'Performance test description with detailed content and comprehensive explanation of the assessment objectives, methodology, and expected outcomes. ' + 'B'.repeat(800),
        type: 'SIMULADO',
        passingScore: 85,
        timeLimitInMinutes: 180,
        randomizeQuestions: true,
        randomizeOptions: true,
        lessonId: lessonId,
      };

      const startTime = Date.now();
      const res = await testHelpers.createAssessment(payload);
      const endTime = Date.now();

      expect(res.status).toBe(201);
      expect(endTime - startTime).toBeLessThan(3000); // Should complete within 3 seconds

      // Verify data was processed correctly
      expect(res.body.assessment.title).toContain('Performance Test Assessment');
      expect(res.body.assessment.description).toContain('Performance test description');
    });

    it('should handle rapid sequential requests', async () => {
      const requests: Promise<any>[] = [];
      for (let i = 1; i <= 5; i++) {
        const payload = AssessmentTestData.createQuizPayload({
          title: `Sequential Test ${i}`,
        });
        requests.push(testHelpers.createAssessment(payload));
      }

      const responses = await Promise.all(requests);

      responses.forEach((res, index) => {
        expect(res.status).toBe(201);
        expect(res.body.assessment.title).toBe(`Sequential Test ${index + 1}`);
      });

      // Verify all were saved
      const count = await prisma.assessment.count();
      expect(count).toBe(5);
    });

  });
});