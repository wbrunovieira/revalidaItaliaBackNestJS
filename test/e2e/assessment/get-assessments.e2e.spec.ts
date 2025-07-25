// test/e2e/assessment/get-assessments.e2e.spec.ts
import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AssessmentTestSetup } from './shared/assessment-test-setup';
import { AssessmentTestHelpers } from './shared/assessment-test-helpers';
import { AssessmentTestData } from './shared/assessment-test-data';
import { E2ETestModule } from '../test-helpers/e2e-test-module';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';

describe('[GET] /assessments - List Assessments (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let testSetup: AssessmentTestSetup;
  let testHelpers: AssessmentTestHelpers;
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
    lessonId = testData.lessonId;
    
    // Create test assessments for listing
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
      const res = await testHelpers.listAssessments();

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
      const res = await testHelpers.listAssessments({ page: 1, limit: 2 });

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
      const res = await testHelpers.listAssessments({ type: 'QUIZ' });

      expect(res.status).toBe(200);
      expect(res.body.assessments).toHaveLength(2);
      res.body.assessments.forEach((assessment: any) => {
        expect(assessment.type).toBe('QUIZ');
      });
    });

    it('should filter assessments by type SIMULADO', async () => {
      const res = await testHelpers.listAssessments({ type: 'SIMULADO' });

      expect(res.status).toBe(200);
      expect(res.body.assessments).toHaveLength(1);
      expect(res.body.assessments[0].type).toBe('SIMULADO');
      expect(res.body.assessments[0].title).toBe('Simulado Programming');
    });

    it('should filter assessments by type PROVA_ABERTA', async () => {
      const res = await testHelpers.listAssessments({ type: 'PROVA_ABERTA' });

      expect(res.status).toBe(200);
      expect(res.body.assessments).toHaveLength(1);
      expect(res.body.assessments[0].type).toBe('PROVA_ABERTA');
      expect(res.body.assessments[0].title).toBe('Prova Aberta Advanced');
    });

    it('should filter assessments by lessonId', async () => {
      const res = await testHelpers.listAssessments({ lessonId: lessonId });

      expect(res.status).toBe(200);
      expect(res.body.assessments).toHaveLength(2);
      res.body.assessments.forEach((assessment: any) => {
        expect(assessment.lessonId).toBe(lessonId);
      });
    });

    it('should filter by type and lessonId combined', async () => {
      const res = await testHelpers.listAssessments({ 
        type: 'QUIZ', 
        lessonId: lessonId 
      });

      expect(res.status).toBe(200);
      expect(res.body.assessments).toHaveLength(2);
      res.body.assessments.forEach((assessment: any) => {
        expect(assessment.type).toBe('QUIZ');
        expect(assessment.lessonId).toBe(lessonId);
      });
    });

    it('should handle pagination with filtering', async () => {
      const res = await testHelpers.listAssessments({ 
        type: 'QUIZ', 
        page: 1, 
        limit: 1 
      });

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

      const res = await testHelpers.listAssessments({ type: 'SIMULADO' });

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
      const res = await testHelpers.listAssessments({ limit: 1 });

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
      expect(assessment).toHaveProperty('createdAt');
      expect(assessment).toHaveProperty('updatedAt');
      
      // Optional fields should exist when present
      if (assessment.description) {
        expect(typeof assessment.description).toBe('string');
      }
      if (assessment.quizPosition) {
        expect(['BEFORE_LESSON', 'AFTER_LESSON']).toContain(assessment.quizPosition);
      }
      if (assessment.timeLimitInMinutes) {
        expect(typeof assessment.timeLimitInMinutes).toBe('number');
      }
      if (assessment.lessonId) {
        expect(typeof assessment.lessonId).toBe('string');
      }
    });
  });

  describe('🔧 Pagination Edge Cases', () => {
    it('should handle page beyond total pages', async () => {
      const res = await testHelpers.listAssessments({ page: 10, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body.assessments).toHaveLength(0);
      expect(res.body.pagination).toMatchObject({
        page: 10,
        limit: 10,
        total: 4,
        totalPages: 1,
      });
    });

    it('should handle very large limit', async () => {
      const res = await testHelpers.listAssessments({ limit: 1000 });

      // System may reject very large limits as invalid
      expect([200, 400]).toContain(res.status);
      
      if (res.status === 200) {
        expect(res.body.assessments).toHaveLength(4);
        expect(res.body.pagination).toMatchObject({
          page: 1,
          limit: 1000,
          total: 4,
          totalPages: 1,
        });
      } else {
        // If 400, it should be a validation error with RFC 7807 format
        testHelpers.expectValidationError(res);
      }
    });

    it('should handle zero assessments', async () => {
      await prisma.assessment.deleteMany({});

      const res = await testHelpers.listAssessments();

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

  describe('⚠️ Invalid Query Parameters', () => {
    it('should handle invalid page parameter', async () => {
      const res = await testHelpers.listAssessments({ page: -1 });

      // The system might either return 400 or default to page 1
      expect([200, 400]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.pagination.page).toBeGreaterThan(0);
      }
    });

    it('should handle invalid limit parameter', async () => {
      const res = await testHelpers.listAssessments({ limit: 0 });

      // The system might either return 400 or use a default limit
      expect([200, 400]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.pagination.limit).toBeGreaterThan(0);
      }
    });

    it('should handle invalid type filter', async () => {
      const res = await testHelpers.listAssessments({ type: 'INVALID_TYPE' as any });

      // System might return 400 for invalid enum or empty results
      expect([200, 400]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.assessments).toHaveLength(0);
      }
    });

    it('should handle invalid lessonId format', async () => {
      const res = await testHelpers.listAssessments({ lessonId: 'invalid-uuid' });

      // System might validate UUID format or just return no results
      expect([200, 400]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.assessments).toHaveLength(0);
      }
    });
  });

  describe('🔍 Sorting and Ordering', () => {
    it('should return assessments in consistent order', async () => {
      const res1 = await testHelpers.listAssessments();
      const res2 = await testHelpers.listAssessments();

      expect(res1.body.assessments.map((a: any) => a.id))
        .toEqual(res2.body.assessments.map((a: any) => a.id));
    });

    it('should handle multiple pages consistently', async () => {
      const page1 = await testHelpers.listAssessments({ page: 1, limit: 2 });
      const page2 = await testHelpers.listAssessments({ page: 2, limit: 2 });

      expect(page1.body.assessments).toHaveLength(2);
      expect(page2.body.assessments).toHaveLength(2);

      // Ensure no duplicates between pages
      const page1Ids = page1.body.assessments.map((a: any) => a.id);
      const page2Ids = page2.body.assessments.map((a: any) => a.id);
      const intersection = page1Ids.filter((id: string) => page2Ids.includes(id));
      expect(intersection).toHaveLength(0);
    });
  });

  describe('⚡ Performance Considerations', () => {
    it('should handle large dataset efficiently', async () => {
      // Create many assessments
      const assessments: any[] = [];
      for (let i = 0; i < 50; i++) {
        assessments.push({
          id: `perf-test-${i}-${Date.now()}`,
          slug: `perf-test-assessment-${i}`,
          title: `Performance Test Assessment ${i}`,
          type: i % 3 === 0 ? 'QUIZ' : i % 3 === 1 ? 'SIMULADO' : 'PROVA_ABERTA',
          passingScore: 70 + (i % 20),
          randomizeQuestions: i % 2 === 0,
          randomizeOptions: i % 3 === 0,
        });
      }

      await prisma.assessment.createMany({ data: assessments });

      const startTime = Date.now();
      const res = await testHelpers.listAssessments({ limit: 10 });
      const endTime = Date.now();

      expect(res.status).toBe(200);
      expect(res.body.assessments).toHaveLength(10);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});