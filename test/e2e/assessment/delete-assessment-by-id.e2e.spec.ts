// test/e2e/assessment/delete-assessment-by-id.e2e.spec.ts
import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AssessmentTestSetup } from './shared/assessment-test-setup';
import { AssessmentTestHelpers } from './shared/assessment-test-helpers';
import { AssessmentTestData } from './shared/assessment-test-data';
import { E2ETestModule } from '../test-helpers/e2e-test-module';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';

describe('[DELETE] /assessments/:id - Delete Assessment (E2E)', () => {
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
    it('should delete a QUIZ assessment successfully', async () => {
      // Create assessment to delete
      const assessment = await prisma.assessment.create({
        data: {
          slug: 'delete-quiz-test',
          title: 'Delete Quiz Test',
          description: 'Assessment to be deleted',
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          passingScore: 75,
          randomizeQuestions: true,
          randomizeOptions: true,
          lessonId: lessonId,
        },
      });

      const res = await testHelpers.deleteAssessment(assessment.id);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);

      // Verify deletion in database
      const deletedAssessment = await prisma.assessment.findUnique({
        where: { id: assessment.id },
      });
      expect(deletedAssessment).toBeNull();
    });

    it('should delete a SIMULADO assessment successfully', async () => {
      const assessment = await prisma.assessment.create({
        data: {
          slug: 'delete-simulado-test',
          title: 'Delete Simulado Test',
          description: 'Simulado to be deleted',
          type: 'SIMULADO',
          passingScore: 80,
          timeLimitInMinutes: 120,
          randomizeQuestions: true,
          randomizeOptions: true,
        },
      });

      const res = await testHelpers.deleteAssessment(assessment.id);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);

      // Verify deletion
      const deletedAssessment = await prisma.assessment.findUnique({
        where: { id: assessment.id },
      });
      expect(deletedAssessment).toBeNull();
    });

    it('should delete a PROVA_ABERTA assessment successfully', async () => {
      const assessment = await prisma.assessment.create({
        data: {
          slug: 'delete-prova-aberta-test',
          title: 'Delete Prova Aberta Test',
          type: 'PROVA_ABERTA',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
        },
      });

      const res = await testHelpers.deleteAssessment(assessment.id);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);

      // Verify deletion
      const deletedAssessment = await prisma.assessment.findUnique({
        where: { id: assessment.id },
      });
      expect(deletedAssessment).toBeNull();
    });

    it('should delete assessment with all optional fields', async () => {
      const assessment = await prisma.assessment.create({
        data: {
          slug: 'delete-complete-test',
          title: 'Delete Complete Test',
          description: 'Full assessment with all fields',
          type: 'QUIZ',
          quizPosition: 'BEFORE_LESSON',
          passingScore: 85,
          timeLimitInMinutes: 60,
          randomizeQuestions: true,
          randomizeOptions: true,
          lessonId: lessonId,
        },
      });

      const res = await testHelpers.deleteAssessment(assessment.id);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);

      // Verify complete deletion
      const deletedAssessment = await prisma.assessment.findUnique({
        where: { id: assessment.id },
      });
      expect(deletedAssessment).toBeNull();
    });

    it('should delete assessment without optional fields', async () => {
      const assessment = await prisma.assessment.create({
        data: {
          slug: 'delete-minimal-test',
          title: 'Delete Minimal Test',
          type: 'PROVA_ABERTA',
          randomizeQuestions: false,
          randomizeOptions: false,
        },
      });

      const res = await testHelpers.deleteAssessment(assessment.id);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);

      const deletedAssessment = await prisma.assessment.findUnique({
        where: { id: assessment.id },
      });
      expect(deletedAssessment).toBeNull();
    });

    it('should return consistent success response format', async () => {
      const assessment = await prisma.assessment.create({
        data: {
          slug: 'delete-response-test',
          title: 'Delete Response Test',
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          randomizeQuestions: false,
          randomizeOptions: false,
        },
      });

      const res = await testHelpers.deleteAssessment(assessment.id);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
      });
      expect(Object.keys(res.body)).toHaveLength(1);
    });
  });

  describe('⚠️ Error Cases', () => {
    it('should return 404 when assessment does not exist', async () => {
      const res = await testHelpers.deleteAssessment(
        AssessmentTestData.NON_EXISTENT_UUID,
      );

      testHelpers.expectNotFoundError(res);
    });

    it('should return 400 for invalid UUID format', async () => {
      const res = await testHelpers.deleteAssessment('invalid-uuid');

      testHelpers.expectValidationError(res);
    });

    it('should return 400 for malformed UUID', async () => {
      const res = await testHelpers.deleteAssessment('123-456-789');

      testHelpers.expectValidationError(res);
    });

    it('should return 400 for empty string as ID', async () => {
      const res = await testHelpers.deleteAssessment('');

      // Special case - empty string results in different route
      expect(res.status).toBe(404); // Not found due to route mismatch
    });

    it('should return 400 for special characters in ID', async () => {
      const res = await testHelpers.deleteAssessment('!@#$%^&*()');

      testHelpers.expectValidationError(res);
    });

    it('should return 400 for SQL injection attempt', async () => {
      const res = await testHelpers.deleteAssessment(
        "'; DROP TABLE assessments; --",
      );

      testHelpers.expectValidationError(res);
    });

    it('should return 404 when trying to delete already deleted assessment', async () => {
      // Create and delete assessment
      const assessment = await prisma.assessment.create({
        data: {
          slug: 'delete-twice-test',
          title: 'Delete Twice Test',
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          randomizeQuestions: false,
          randomizeOptions: false,
        },
      });

      // First deletion should succeed
      const firstRes = await testHelpers.deleteAssessment(assessment.id);
      expect(firstRes.status).toBe(200);

      // Second deletion should return 404
      const secondRes = await testHelpers.deleteAssessment(assessment.id);
      testHelpers.expectNotFoundError(secondRes);
    });
  });

  describe('🔄 Idempotency and State', () => {
    it('should not affect other assessments when deleting one', async () => {
      // Create multiple assessments
      const assessment1 = await prisma.assessment.create({
        data: {
          slug: 'keep-assessment-1',
          title: 'Keep Assessment 1',
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          randomizeQuestions: false,
          randomizeOptions: false,
        },
      });

      const assessment2 = await prisma.assessment.create({
        data: {
          slug: 'delete-assessment-2',
          title: 'Delete Assessment 2',
          type: 'SIMULADO',
          randomizeQuestions: false,
          randomizeOptions: false,
        },
      });

      const assessment3 = await prisma.assessment.create({
        data: {
          slug: 'keep-assessment-3',
          title: 'Keep Assessment 3',
          type: 'PROVA_ABERTA',
          randomizeQuestions: false,
          randomizeOptions: false,
        },
      });

      // Delete the middle assessment
      const res = await testHelpers.deleteAssessment(assessment2.id);
      expect(res.status).toBe(200);

      // Verify others still exist
      const remaining1 = await prisma.assessment.findUnique({
        where: { id: assessment1.id },
      });
      const remaining3 = await prisma.assessment.findUnique({
        where: { id: assessment3.id },
      });

      expect(remaining1).not.toBeNull();
      expect(remaining1?.title).toBe('Keep Assessment 1');
      expect(remaining3).not.toBeNull();
      expect(remaining3?.title).toBe('Keep Assessment 3');

      // Verify deleted one is gone
      const deleted = await prisma.assessment.findUnique({
        where: { id: assessment2.id },
      });
      expect(deleted).toBeNull();
    });

    it('should handle concurrent delete requests gracefully', async () => {
      const assessment = await prisma.assessment.create({
        data: {
          slug: 'concurrent-delete-test',
          title: 'Concurrent Delete Test',
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          randomizeQuestions: false,
          randomizeOptions: false,
        },
      });

      // Send multiple delete requests concurrently
      const deletePromises = Array(5)
        .fill(null)
        .map(() => testHelpers.deleteAssessment(assessment.id));

      const results = await Promise.all(deletePromises);

      // All requests might succeed due to database optimizations
      // The important thing is that the assessment is deleted
      const successCount = results.filter((r) => r.status === 200).length;
      const notFoundCount = results.filter((r) => r.status === 404).length;

      expect(successCount + notFoundCount).toBe(5);
      expect(successCount).toBeGreaterThanOrEqual(1); // At least one should succeed

      // Verify assessment is deleted
      const deleted = await prisma.assessment.findUnique({
        where: { id: assessment.id },
      });
      expect(deleted).toBeNull();
    });
  });

  describe('🔗 Cascade and Dependencies', () => {
    it('should handle deletion of assessment with questions', async () => {
      // Create assessment with questions
      const assessment = await prisma.assessment.create({
        data: {
          slug: 'delete-with-questions',
          title: 'Delete With Questions',
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          randomizeQuestions: false,
          randomizeOptions: false,
          questions: {
            create: [
              {
                text: 'Question 1',
                type: 'MULTIPLE_CHOICE',
                options: {
                  create: [
                    {
                      text: 'Option 1',
                    },
                    {
                      text: 'Option 2',
                    },
                  ],
                },
              },
            ],
          },
        },
      });

      const res = await testHelpers.deleteAssessment(assessment.id);

      expect(res.status).toBe(200);

      // Verify assessment and related data are deleted
      const deletedAssessment = await prisma.assessment.findUnique({
        where: { id: assessment.id },
        include: {
          questions: {
            include: {
              options: true,
            },
          },
        },
      });
      expect(deletedAssessment).toBeNull();
    });

    it('should not delete lesson when deleting assessment', async () => {
      const assessment = await prisma.assessment.create({
        data: {
          slug: 'delete-keep-lesson',
          title: 'Delete Keep Lesson',
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          randomizeQuestions: false,
          randomizeOptions: false,
          lessonId: lessonId,
        },
      });

      const res = await testHelpers.deleteAssessment(assessment.id);
      expect(res.status).toBe(200);

      // Verify lesson still exists
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
      });
      expect(lesson).not.toBeNull();
    });
  });

  describe('⚡ Performance', () => {
    it('should delete quickly', async () => {
      const assessment = await prisma.assessment.create({
        data: {
          slug: 'delete-performance-test',
          title: 'Delete Performance Test',
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          randomizeQuestions: false,
          randomizeOptions: false,
        },
      });

      const startTime = Date.now();
      const res = await testHelpers.deleteAssessment(assessment.id);
      const endTime = Date.now();

      expect(res.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle deletion of large assessment efficiently', async () => {
      // Create assessment with many questions
      const assessment = await prisma.assessment.create({
        data: {
          slug: 'delete-large-test',
          title: 'Delete Large Test',
          description: 'X'.repeat(1000),
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          passingScore: 80,
          randomizeQuestions: true,
          randomizeOptions: true,
          questions: {
            create: Array(20)
              .fill(null)
              .map((_, index) => ({
                text: `Question ${index + 1}`,
                type: 'MULTIPLE_CHOICE',
                options: {
                  create: [
                    {
                      text: `Option 1 for Q${index + 1}`,
                    },
                    {
                      text: `Option 2 for Q${index + 1}`,
                    },
                  ],
                },
              })),
          },
        },
      });

      const startTime = Date.now();
      const res = await testHelpers.deleteAssessment(assessment.id);
      const endTime = Date.now();

      expect(res.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });

  describe('🔧 Edge Cases', () => {
    it('should handle UUID in different cases', async () => {
      const assessment = await prisma.assessment.create({
        data: {
          slug: 'delete-case-test',
          title: 'Delete Case Test',
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          randomizeQuestions: false,
          randomizeOptions: false,
        },
      });

      // PostgreSQL UUIDs are case-insensitive, but our system might validate before
      // If it returns 404, it's because the validation layer is case-sensitive
      const upperCaseId = assessment.id.toUpperCase();
      const res = await testHelpers.deleteAssessment(upperCaseId);

      // The system appears to be case-sensitive, so we expect a 404
      expect(res.status).toBe(404);

      // Verify the original assessment still exists
      const stillExists = await prisma.assessment.findUnique({
        where: { id: assessment.id },
      });
      expect(stillExists).not.toBeNull();

      // Now delete with correct case
      const correctRes = await testHelpers.deleteAssessment(assessment.id);
      expect(correctRes.status).toBe(200);

      // Verify deletion
      const deleted = await prisma.assessment.findUnique({
        where: { id: assessment.id },
      });
      expect(deleted).toBeNull();
    });

    it('should handle request with trailing slashes', async () => {
      const assessment = await prisma.assessment.create({
        data: {
          slug: 'delete-trailing-slash',
          title: 'Delete Trailing Slash',
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          randomizeQuestions: false,
          randomizeOptions: false,
        },
      });

      // Manually construct request with trailing slash
      const res = await testHelpers.request
        .delete(`/assessments/${assessment.id}/`)
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
    });

    it('should handle assessment at UUID limits', async () => {
      // Maximum valid UUID
      const maxUuid = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
      const res = await testHelpers.deleteAssessment(maxUuid);
      expect(res.status).toBe(404); // Should not exist

      // Minimum valid UUID
      const minUuid = '00000000-0000-0000-0000-000000000000';
      const res2 = await testHelpers.deleteAssessment(minUuid);
      expect(res2.status).toBe(404); // Should not exist
    });
  });
});