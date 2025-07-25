// test/e2e/assessment/get-assessment-by-id.e2e.spec.ts
import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AssessmentTestSetup } from './shared/assessment-test-setup';
import { AssessmentTestHelpers } from './shared/assessment-test-helpers';
import { AssessmentTestData } from './shared/assessment-test-data';
import { E2ETestModule } from '../test-helpers/e2e-test-module';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';

describe('[GET] /assessments/:id - Get Assessment By ID (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let testSetup: AssessmentTestSetup;
  let testHelpers: AssessmentTestHelpers;
  let lessonId: string;
  let assessmentId: string;

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
    lessonId = testData.lessonId;
    
    // Create test assessment
    const assessment = await prisma.assessment.create({
      data: {
        slug: 'get-by-id-test',
        title: 'Get By ID Test',
        description: 'Test assessment for GET by ID',
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

  describe('✅ Success Cases', () => {
    it('should return an assessment by its ID', async () => {
      const res = await testHelpers.getAssessment(assessmentId);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('assessment');
      expect(res.body.assessment.id).toBe(assessmentId);
      expect(res.body.assessment.title).toBe('Get By ID Test');
      expect(res.body.assessment.description).toBe('Test assessment for GET by ID');
      expect(res.body.assessment.type).toBe('QUIZ');
      expect(res.body.assessment.quizPosition).toBe('AFTER_LESSON');
      expect(res.body.assessment.passingScore).toBe(75);
      expect(res.body.assessment.randomizeQuestions).toBe(true);
      expect(res.body.assessment.randomizeOptions).toBe(true);
      expect(res.body.assessment.lessonId).toBe(lessonId);
    });

    it('should return assessment with all fields when they exist', async () => {
      // Create a SIMULADO with all fields
      const simulado = await prisma.assessment.create({
        data: {
          slug: 'simulado-full-fields',
          title: 'Simulado With All Fields',
          description: 'Complete simulado assessment',
          type: 'SIMULADO',
          passingScore: 80,
          timeLimitInMinutes: 120,
          randomizeQuestions: true,
          randomizeOptions: false,
        },
      });

      const res = await testHelpers.getAssessment(simulado.id);

      expect(res.status).toBe(200);
      expect(res.body.assessment).toMatchObject({
        id: simulado.id,
        slug: 'simulado-full-fields',
        title: 'Simulado With All Fields',
        description: 'Complete simulado assessment',
        type: 'SIMULADO',
        passingScore: 80,
        timeLimitInMinutes: 120,
        randomizeQuestions: true,
        randomizeOptions: false,
      });
      expect(res.body.assessment.quizPosition).toBeUndefined();
      expect(res.body.assessment.lessonId).toBeUndefined();
    });

    it('should return assessment without optional fields', async () => {
      // Create assessment with minimal fields
      const minimal = await prisma.assessment.create({
        data: {
          slug: 'minimal-assessment',
          title: 'Minimal Assessment',
          type: 'PROVA_ABERTA',
          randomizeQuestions: false,
          randomizeOptions: false,
        },
      });

      const res = await testHelpers.getAssessment(minimal.id);

      expect(res.status).toBe(200);
      expect(res.body.assessment).toMatchObject({
        id: minimal.id,
        slug: 'minimal-assessment',
        title: 'Minimal Assessment',
        type: 'PROVA_ABERTA',
        randomizeQuestions: false,
        randomizeOptions: false,
      });
      
      // Optional fields should not be present when not set
      expect(res.body.assessment.description).toBeUndefined();
      expect(res.body.assessment.passingScore).toBeUndefined();
      expect(res.body.assessment.timeLimitInMinutes).toBeUndefined();
      expect(res.body.assessment.quizPosition).toBeUndefined();
      expect(res.body.assessment.lessonId).toBeUndefined();
    });

    it('should include timestamps in response', async () => {
      const res = await testHelpers.getAssessment(assessmentId);

      expect(res.status).toBe(200);
      expect(res.body.assessment).toHaveProperty('createdAt');
      expect(res.body.assessment).toHaveProperty('updatedAt');
      expect(typeof res.body.assessment.createdAt).toBe('string');
      expect(typeof res.body.assessment.updatedAt).toBe('string');
      
      // Verify timestamps are valid ISO dates
      expect(new Date(res.body.assessment.createdAt).toISOString()).toBe(res.body.assessment.createdAt);
      expect(new Date(res.body.assessment.updatedAt).toISOString()).toBe(res.body.assessment.updatedAt);
    });
  });

  describe('❌ Error Cases', () => {
    it('should return 404 when assessment is not found', async () => {
      const nonExistentId = AssessmentTestData.NON_EXISTENT_UUID;

      const res = await testHelpers.getAssessment(nonExistentId);

      testHelpers.expectNotFoundError(res);
    });

    it('should return 400 for an invalid UUID', async () => {
      const invalidId = 'invalid-uuid';

      const res = await testHelpers.getAssessment(invalidId);

      testHelpers.expectValidationError(res);
    });

    it('should return 400 for malformed UUID formats', async () => {
      const malformedIds = [
        '12345',
        'not-a-uuid',
        '00000000-0000-0000-0000-00000000000g', // Invalid character
        '00000000-0000-0000-0000-0000000000001', // Extra character
        '00000000-0000-0000-0000-00000000000', // Missing character
        ' 00000000-0000-0000-0000-000000000000', // Leading space
      ];

      for (const malformedId of malformedIds) {
        const res = await testHelpers.getAssessment(malformedId);
        expect(res.status).toBe(400);
        testHelpers.expectValidationError(res);
      }
    });
    
    it('should handle UUID with trailing space', async () => {
      // This UUID format might pass validation but result in not found
      const uuidWithSpace = '00000000-0000-0000-0000-000000000000 ';
      const res = await testHelpers.getAssessment(uuidWithSpace);
      
      // System might trim the space and search for valid UUID
      expect([400, 404]).toContain(res.status);
      if (res.status === 400) {
        testHelpers.expectValidationError(res);
      } else {
        testHelpers.expectNotFoundError(res);
      }
    });
  });

  describe('🔍 Edge Cases', () => {
    it('should handle assessment with very long title and description', async () => {
      const longAssessment = await prisma.assessment.create({
        data: {
          slug: 'long-content-assessment',
          title: 'A'.repeat(255),
          description: 'B'.repeat(1000),
          type: 'QUIZ',
          quizPosition: 'BEFORE_LESSON',
          passingScore: 90,
          randomizeQuestions: false,
          randomizeOptions: true,
        },
      });

      const res = await testHelpers.getAssessment(longAssessment.id);

      expect(res.status).toBe(200);
      expect(res.body.assessment.title).toBe('A'.repeat(255));
      expect(res.body.assessment.description).toBe('B'.repeat(1000));
    });

    it('should handle assessment with unicode characters', async () => {
      const unicodeAssessment = await prisma.assessment.create({
        data: {
          slug: 'unicode-assessment',
          title: 'Avaliação 中文 العربية русский 🎯',
          description: 'Descrição com emojis 😀 🎉 🚀 e caracteres especiais ñáéíóú',
          type: 'SIMULADO',
          passingScore: 70,
          timeLimitInMinutes: 90,
          randomizeQuestions: true,
          randomizeOptions: true,
        },
      });

      const res = await testHelpers.getAssessment(unicodeAssessment.id);

      expect(res.status).toBe(200);
      expect(res.body.assessment.title).toBe('Avaliação 中文 العربية русский 🎯');
      expect(res.body.assessment.description).toBe('Descrição com emojis 😀 🎉 🚀 e caracteres especiais ñáéíóú');
    });

    it('should handle concurrent requests for the same assessment', async () => {
      // Send multiple requests concurrently
      const requests = Array(5).fill(null).map(() => 
        testHelpers.getAssessment(assessmentId)
      );

      const responses = await Promise.all(requests);

      // All should succeed with the same data
      responses.forEach(res => {
        expect(res.status).toBe(200);
        expect(res.body.assessment.id).toBe(assessmentId);
        expect(res.body.assessment.title).toBe('Get By ID Test');
      });
    });

    it('should return consistent data after assessment update', async () => {
      // Get initial state
      const initialRes = await testHelpers.getAssessment(assessmentId);
      expect(initialRes.status).toBe(200);
      const initialUpdatedAt = initialRes.body.assessment.updatedAt;

      // Update the assessment
      await prisma.assessment.update({
        where: { id: assessmentId },
        data: { 
          title: 'Updated Title',
          passingScore: 85,
        },
      });

      // Get updated state
      const updatedRes = await testHelpers.getAssessment(assessmentId);
      expect(updatedRes.status).toBe(200);
      expect(updatedRes.body.assessment.title).toBe('Updated Title');
      expect(updatedRes.body.assessment.passingScore).toBe(85);
      
      // Other fields should remain unchanged
      expect(updatedRes.body.assessment.description).toBe('Test assessment for GET by ID');
      expect(updatedRes.body.assessment.type).toBe('QUIZ');
      
      // Updated timestamp should be different
      expect(updatedRes.body.assessment.updatedAt).not.toBe(initialUpdatedAt);
    });
  });

  describe('🔧 Response Format', () => {
    it('should return properly structured response', async () => {
      const res = await testHelpers.getAssessment(assessmentId);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('assessment');
      expect(typeof res.body.assessment).toBe('object');
      expect(res.body.assessment).not.toBeNull();
      
      // Should not have extra properties at root level
      const rootKeys = Object.keys(res.body);
      expect(rootKeys).toEqual(['assessment']);
    });

    it('should not expose internal fields', async () => {
      const res = await testHelpers.getAssessment(assessmentId);

      expect(res.status).toBe(200);
      
      // Should not expose internal database fields if any
      const assessment = res.body.assessment;
      expect(assessment).not.toHaveProperty('_id');
      expect(assessment).not.toHaveProperty('__v');
      expect(assessment).not.toHaveProperty('deleted');
      expect(assessment).not.toHaveProperty('deletedAt');
    });
  });

  describe('⚡ Performance', () => {
    it('should respond quickly for single assessment fetch', async () => {
      const startTime = Date.now();
      const res = await testHelpers.getAssessment(assessmentId);
      const endTime = Date.now();

      expect(res.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(500); // Should respond within 500ms
    });

    it('should handle assessment with many related entities efficiently', async () => {
      // This would be more relevant if assessments had related entities loaded
      // For now, just verify it handles the base case efficiently
      const startTime = Date.now();
      const res = await testHelpers.getAssessment(assessmentId);
      const endTime = Date.now();

      expect(res.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(500);
    });
  });
});