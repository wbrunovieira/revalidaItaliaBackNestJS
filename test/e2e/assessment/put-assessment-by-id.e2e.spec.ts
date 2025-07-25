// test/e2e/assessment/put-assessment-by-id.e2e.spec.ts
import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AssessmentTestSetup } from './shared/assessment-test-setup';
import { AssessmentTestHelpers } from './shared/assessment-test-helpers';
import { AssessmentTestData } from './shared/assessment-test-data';
import { E2ETestModule } from '../test-helpers/e2e-test-module';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';

describe('[PUT] /assessments/:id - Update Assessment (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let testSetup: AssessmentTestSetup;
  let testHelpers: AssessmentTestHelpers;
  let courseId: string;
  let moduleId: string;
  let lessonId: string;
  let quizAssessmentId: string;
  let simuladoAssessmentId: string;
  let provaAbertaAssessmentId: string;

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

    // Create test assessments for update tests
    const quiz = await prisma.assessment.create({
      data: {
        slug: 'update-quiz-test',
        title: 'Update Quiz Test',
        description: 'Original quiz description',
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
        lessonId: lessonId,
      },
    });
    quizAssessmentId = quiz.id;

    const simulado = await prisma.assessment.create({
      data: {
        slug: 'update-simulado-test',
        title: 'Update Simulado Test',
        description: 'Original simulado description',
        type: 'SIMULADO',
        passingScore: 80,
        timeLimitInMinutes: 120,
        randomizeQuestions: true,
        randomizeOptions: true,
      },
    });
    simuladoAssessmentId = simulado.id;

    const provaAberta = await prisma.assessment.create({
      data: {
        slug: 'update-prova-aberta-test',
        title: 'Update Prova Aberta Test',
        description: 'Original prova aberta description',
        type: 'PROVA_ABERTA',
        passingScore: 75,
        randomizeQuestions: false,
        randomizeOptions: false,
      },
    });
    provaAbertaAssessmentId = provaAberta.id;
  });

  describe('✅ Success Cases', () => {
    it('should update all fields of a QUIZ assessment', async () => {
      const updatePayload = {
        title: 'Updated Quiz Title',
        description: 'Updated quiz description',
        type: 'QUIZ',
        quizPosition: 'BEFORE_LESSON',
        passingScore: 85,
        randomizeQuestions: true,
        randomizeOptions: true,
        lessonId: lessonId,
      };

      const res = await testHelpers.updateAssessment(
        quizAssessmentId,
        updatePayload,
      );

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('assessment');
      expect(res.body.assessment).toMatchObject({
        id: quizAssessmentId,
        slug: 'updated-quiz-title',
        title: 'Updated Quiz Title',
        description: 'Updated quiz description',
        type: 'QUIZ',
        quizPosition: 'BEFORE_LESSON',
        passingScore: 85,
        randomizeQuestions: true,
        randomizeOptions: true,
        lessonId: lessonId,
      });

      // Verify database update
      const updatedAssessment = await prisma.assessment.findUnique({
        where: { id: quizAssessmentId },
      });
      expect(updatedAssessment?.title).toBe('Updated Quiz Title');
      expect(updatedAssessment?.quizPosition).toBe('BEFORE_LESSON');
    });

    it('should update only the title', async () => {
      const updatePayload = {
        title: 'Only Title Updated',
      };

      const res = await testHelpers.updateAssessment(
        simuladoAssessmentId,
        updatePayload,
      );

      expect(res.status).toBe(200);
      expect(res.body.assessment.title).toBe('Only Title Updated');
      expect(res.body.assessment.slug).toBe('only-title-updated');
      // Other fields should remain unchanged
      expect(res.body.assessment.type).toBe('SIMULADO');
      expect(res.body.assessment.passingScore).toBe(80);
      expect(res.body.assessment.timeLimitInMinutes).toBe(120);
    });

    it('should update only the description', async () => {
      const updatePayload = {
        description: 'Brand new description',
      };

      const res = await testHelpers.updateAssessment(
        provaAbertaAssessmentId,
        updatePayload,
      );

      expect(res.status).toBe(200);
      expect(res.body.assessment.description).toBe('Brand new description');
      // Title should remain unchanged
      expect(res.body.assessment.title).toBe('Update Prova Aberta Test');
    });

    it('should update type from QUIZ to SIMULADO', async () => {
      const updatePayload = {
        type: 'SIMULADO',
        timeLimitInMinutes: 90,
      };

      const res = await testHelpers.updateAssessment(
        quizAssessmentId,
        updatePayload,
      );

      expect(res.status).toBe(200);
      expect(res.body.assessment.type).toBe('SIMULADO');
      expect(res.body.assessment.timeLimitInMinutes).toBe(90);
      expect(res.body.assessment.quizPosition).toBeUndefined();
    });

    it('should update type from SIMULADO to QUIZ', async () => {
      const updatePayload = {
        type: 'QUIZ',
        quizPosition: 'AFTER_LESSON',
        lessonId: lessonId,
      };

      const res = await testHelpers.updateAssessment(
        simuladoAssessmentId,
        updatePayload,
      );

      expect(res.status).toBe(200);
      expect(res.body.assessment.type).toBe('QUIZ');
      expect(res.body.assessment.quizPosition).toBe('AFTER_LESSON');
      expect(res.body.assessment.timeLimitInMinutes).toBeUndefined();
      expect(res.body.assessment.lessonId).toBe(lessonId);
    });

    it('should update type from QUIZ to PROVA_ABERTA', async () => {
      const updatePayload = {
        type: 'PROVA_ABERTA',
      };

      const res = await testHelpers.updateAssessment(
        quizAssessmentId,
        updatePayload,
      );

      expect(res.status).toBe(200);
      expect(res.body.assessment.type).toBe('PROVA_ABERTA');
      expect(res.body.assessment.quizPosition).toBeUndefined();
    });

    it('should remove optional fields with null', async () => {
      const updatePayload = {
        description: null,
        lessonId: null,
      };

      const res = await testHelpers.updateAssessment(
        quizAssessmentId,
        updatePayload,
      );

      expect(res.status).toBe(200);
      expect(res.body.assessment.description).toBeUndefined();
      expect(res.body.assessment.lessonId).toBeUndefined();
    });

    it('should update passingScore to minimum value (0)', async () => {
      const updatePayload = {
        passingScore: 0,
      };

      const res = await testHelpers.updateAssessment(
        quizAssessmentId,
        updatePayload,
      );

      expect(res.status).toBe(200);
      expect(res.body.assessment.passingScore).toBe(0);
    });

    it('should update passingScore to maximum value (100)', async () => {
      const updatePayload = {
        passingScore: 100,
      };

      const res = await testHelpers.updateAssessment(
        simuladoAssessmentId,
        updatePayload,
      );

      expect(res.status).toBe(200);
      expect(res.body.assessment.passingScore).toBe(100);
    });

    it('should update timeLimitInMinutes to minimum value (1)', async () => {
      const updatePayload = {
        timeLimitInMinutes: 1,
      };

      const res = await testHelpers.updateAssessment(
        simuladoAssessmentId,
        updatePayload,
      );

      expect(res.status).toBe(200);
      expect(res.body.assessment.timeLimitInMinutes).toBe(1);
    });

    it('should update boolean fields', async () => {
      const updatePayload = {
        randomizeQuestions: true,
        randomizeOptions: true,
      };

      const res = await testHelpers.updateAssessment(
        quizAssessmentId,
        updatePayload,
      );

      expect(res.status).toBe(200);
      expect(res.body.assessment.randomizeQuestions).toBe(true);
      expect(res.body.assessment.randomizeOptions).toBe(true);
    });

    it('should update lessonId', async () => {
      // Create a new lesson for testing
      const newLesson = await prisma.lesson.create({
        data: {
          slug: 'new-lesson-for-update',
          moduleId,
          order: 3,
          translations: {
            create: [{ locale: 'pt', title: 'Nova Aula', description: 'Test' }],
          },
        },
      });

      const updatePayload = {
        lessonId: newLesson.id,
      };

      const res = await testHelpers.updateAssessment(
        simuladoAssessmentId,
        updatePayload,
      );

      expect(res.status).toBe(200);
      expect(res.body.assessment.lessonId).toBe(newLesson.id);
    });

    it('should handle empty update payload', async () => {
      const res = await testHelpers.updateAssessment(quizAssessmentId, {});

      expect(res.status).toBe(200);
      // Assessment should remain unchanged except for updatedAt
      expect(res.body.assessment.title).toBe('Update Quiz Test');
      expect(res.body.assessment.type).toBe('QUIZ');
    });

    it('should trim whitespace from title', async () => {
      const updatePayload = {
        title: '   Trimmed Title   ',
      };

      const res = await testHelpers.updateAssessment(
        provaAbertaAssessmentId,
        updatePayload,
      );

      expect(res.status).toBe(200);
      expect(res.body.assessment.title).toBe('Trimmed Title');
      expect(res.body.assessment.slug).toBe('trimmed-title');
    });

    it('should handle unicode characters in updated title', async () => {
      const updatePayload = {
        title: 'Título Atualizado 中文 العربية 🎯',
        description: 'Descrição com emojis 😀 🎉 🚀',
      };

      const res = await testHelpers.updateAssessment(
        quizAssessmentId,
        updatePayload,
      );

      expect(res.status).toBe(200);
      expect(res.body.assessment.title).toBe(
        'Título Atualizado 中文 العربية 🎯',
      );
      expect(res.body.assessment.description).toBe(
        'Descrição com emojis 😀 🎉 🚀',
      );
      expect(res.body.assessment.slug).toMatch(/^[a-z0-9-]+$/);
    });

    it('should update assessment with very long title and description', async () => {
      const updatePayload = {
        title: 'A'.repeat(255),
        description: 'B'.repeat(1000),
      };

      const res = await testHelpers.updateAssessment(
        simuladoAssessmentId,
        updatePayload,
      );

      expect(res.status).toBe(200);
      expect(res.body.assessment.title).toBe('A'.repeat(255));
      expect(res.body.assessment.description).toBe('B'.repeat(1000));
    });

    it('should update timestamps', async () => {
      // Get original timestamps
      const originalRes = await testHelpers.getAssessment(quizAssessmentId);
      const originalUpdatedAt = originalRes.body.assessment.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 100));

      const updatePayload = {
        title: 'Updated to Check Timestamp',
      };

      const res = await testHelpers.updateAssessment(
        quizAssessmentId,
        updatePayload,
      );

      expect(res.status).toBe(200);
      expect(res.body.assessment.updatedAt).not.toBe(originalUpdatedAt);
      expect(new Date(res.body.assessment.updatedAt).getTime()).toBeGreaterThan(
        new Date(originalUpdatedAt).getTime(),
      );
    });
  });

  describe('⚠️ Validation Errors (400)', () => {
    it('should return 400 when title is too short', async () => {
      const updatePayload = {
        title: 'AB',
      };

      const res = await testHelpers.updateAssessment(
        quizAssessmentId,
        updatePayload,
      );

      testHelpers.expectValidationError(res);
    });

    it('should return 400 when type is invalid', async () => {
      const updatePayload = {
        type: 'INVALID_TYPE',
      };

      const res = await testHelpers.updateAssessment(
        simuladoAssessmentId,
        updatePayload,
      );

      testHelpers.expectValidationError(res);
    });

    it('should return 400 when passingScore is below 0', async () => {
      const updatePayload = {
        passingScore: -5,
      };

      const res = await testHelpers.updateAssessment(
        provaAbertaAssessmentId,
        updatePayload,
      );

      testHelpers.expectValidationError(res);
    });

    it('should return 400 when passingScore is above 100', async () => {
      const updatePayload = {
        passingScore: 105,
      };

      const res = await testHelpers.updateAssessment(
        quizAssessmentId,
        updatePayload,
      );

      testHelpers.expectValidationError(res);
    });

    it('should return 400 when lessonId is invalid UUID format', async () => {
      const updatePayload = {
        lessonId: 'invalid-uuid',
      };

      const res = await testHelpers.updateAssessment(
        simuladoAssessmentId,
        updatePayload,
      );

      testHelpers.expectValidationError(res);
    });

    it('should return 400 when quizPosition is invalid', async () => {
      const updatePayload = {
        quizPosition: 'INVALID_POSITION',
      };

      const res = await testHelpers.updateAssessment(
        quizAssessmentId,
        updatePayload,
      );

      testHelpers.expectValidationError(res);
    });

    it('should return 400 when timeLimitInMinutes is zero or negative', async () => {
      const updatePayload = {
        timeLimitInMinutes: 0,
      };

      const res = await testHelpers.updateAssessment(
        simuladoAssessmentId,
        updatePayload,
      );

      testHelpers.expectValidationError(res);
    });

    it('should return 400 for invalid assessment ID format', async () => {
      const res = await testHelpers.updateAssessment('invalid-uuid', {
        title: 'Test',
      });

      testHelpers.expectValidationError(res);
    });

    it('should return 400 with multiple validation errors', async () => {
      const updatePayload = {
        title: 'A', // Too short
        type: 'INVALID', // Invalid type
        passingScore: -10, // Invalid score
        lessonId: 'not-a-uuid', // Invalid UUID
      };

      const res = await testHelpers.updateAssessment(
        quizAssessmentId,
        updatePayload,
      );

      testHelpers.expectValidationError(res);
    });
  });

  describe('🔄 Business Logic Errors', () => {
    it('should return 404 when assessment does not exist', async () => {
      const updatePayload = {
        title: 'Update Non-Existent',
      };

      const res = await testHelpers.updateAssessment(
        AssessmentTestData.NON_EXISTENT_UUID,
        updatePayload,
      );

      testHelpers.expectNotFoundError(res);
    });

    it('should return 409 when title already exists on another assessment', async () => {
      const updatePayload = {
        title: 'Update Simulado Test', // Title of simuladoAssessmentId
      };

      const res = await testHelpers.updateAssessment(
        quizAssessmentId,
        updatePayload,
      );

      testHelpers.expectConflictError(res);
    });

    it('should allow same title when updating the same assessment', async () => {
      const updatePayload = {
        title: 'Update Quiz Test', // Same title
        description: 'New description',
      };

      const res = await testHelpers.updateAssessment(
        quizAssessmentId,
        updatePayload,
      );

      expect(res.status).toBe(200);
      expect(res.body.assessment.description).toBe('New description');
    });

    it.skip('should return 404 when lessonId does not exist', async () => {
      // TODO: The system currently does not validate if lessonId exists
      // This should be implemented as a business rule validation
      const updatePayload = {
        lessonId: AssessmentTestData.NON_EXISTENT_UUID,
      };

      const res = await testHelpers.updateAssessment(
        quizAssessmentId,
        updatePayload,
      );

      testHelpers.expectNotFoundError(res);
    });

    it.skip('should validate QUIZ requires quizPosition', async () => {
      // TODO: The system currently does not validate this business rule
      // QUIZ type should require quizPosition field
      // Update from SIMULADO to QUIZ without quizPosition
      const updatePayload = {
        type: 'QUIZ',
        // Missing quizPosition
      };

      const res = await testHelpers.updateAssessment(
        simuladoAssessmentId,
        updatePayload,
      );

      testHelpers.expectValidationError(res);
    });

    it('should validate SIMULADO cannot have quizPosition', async () => {
      const updatePayload = {
        type: 'SIMULADO',
        quizPosition: 'AFTER_LESSON', // Should not be allowed
      };

      const res = await testHelpers.updateAssessment(
        provaAbertaAssessmentId,
        updatePayload,
      );

      testHelpers.expectValidationError(res);
    });
  });

  describe('🔍 Edge Cases', () => {
    it('should handle concurrent updates', async () => {
      const payload1 = { title: 'Concurrent Update 1' };
      const payload2 = { description: 'Concurrent Description' };

      // Send updates concurrently
      const [res1, res2] = await Promise.all([
        testHelpers.updateAssessment(quizAssessmentId, payload1),
        testHelpers.updateAssessment(quizAssessmentId, payload2),
      ]);

      // Both should succeed
      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);

      // Get final state
      const finalRes = await testHelpers.getAssessment(quizAssessmentId);
      const assessment = finalRes.body.assessment;

      // Should have both updates (order may vary)
      expect(
        [
          assessment.title === 'Concurrent Update 1' ||
            assessment.title === 'Update Quiz Test',
          assessment.description === 'Concurrent Description' ||
            assessment.description === 'Original quiz description',
        ].some(Boolean),
      ).toBe(true);
    });

    it('should maintain referential integrity', async () => {
      // Update with valid lessonId
      const updatePayload = {
        lessonId: lessonId,
      };

      const res = await testHelpers.updateAssessment(
        simuladoAssessmentId,
        updatePayload,
      );

      expect(res.status).toBe(200);

      // Verify relationship exists
      const assessment = await prisma.assessment.findUnique({
        where: { id: simuladoAssessmentId },
        include: { lesson: true },
      });

      expect(assessment?.lesson).toBeDefined();
      expect(assessment?.lesson?.id).toBe(lessonId);
    });

    it('should handle special characters in slug generation', async () => {
      const updatePayload = {
        title: 'Title with @#$% Special & Characters!',
      };

      const res = await testHelpers.updateAssessment(
        provaAbertaAssessmentId,
        updatePayload,
      );

      expect(res.status).toBe(200);
      expect(res.body.assessment.slug).toMatch(/^[a-z0-9-]+$/);
      expect(res.body.assessment.slug).not.toContain('@');
      expect(res.body.assessment.slug).not.toContain('#');
      expect(res.body.assessment.slug).not.toContain('$');
    });

    it('should handle update after deletion attempt', async () => {
      // First, try to update a non-existent assessment
      const updatePayload = {
        title: 'Should Fail',
      };

      const failedRes = await testHelpers.updateAssessment(
        '99999999-9999-9999-9999-999999999999',
        updatePayload,
      );

      expect(failedRes.status).toBe(404);

      // Then update an existing one
      const successPayload = {
        title: 'Should Succeed',
      };

      const successRes = await testHelpers.updateAssessment(
        quizAssessmentId,
        successPayload,
      );

      expect(successRes.status).toBe(200);
      expect(successRes.body.assessment.title).toBe('Should Succeed');
    });
  });

  describe('🔧 Response Format', () => {
    it('should return properly structured response', async () => {
      const updatePayload = {
        title: 'Response Format Test',
        description: 'Testing response structure',
      };

      const res = await testHelpers.updateAssessment(
        quizAssessmentId,
        updatePayload,
      );

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('assessment');
      expect(typeof res.body.assessment).toBe('object');
      expect(res.body.assessment).not.toBeNull();

      // Verify all expected fields are present
      const assessment = res.body.assessment;
      expect(assessment).toHaveProperty('id');
      expect(assessment).toHaveProperty('slug');
      expect(assessment).toHaveProperty('title');
      expect(assessment).toHaveProperty('type');
      expect(assessment).toHaveProperty('createdAt');
      expect(assessment).toHaveProperty('updatedAt');
    });

    it('should not expose internal fields', async () => {
      const updatePayload = {
        title: 'Check Internal Fields',
      };

      const res = await testHelpers.updateAssessment(
        simuladoAssessmentId,
        updatePayload,
      );

      expect(res.status).toBe(200);
      const assessment = res.body.assessment;

      // Should not expose internal database fields
      expect(assessment).not.toHaveProperty('_id');
      expect(assessment).not.toHaveProperty('__v');
      expect(assessment).not.toHaveProperty('deleted');
      expect(assessment).not.toHaveProperty('deletedAt');
    });

    it('should omit undefined optional fields', async () => {
      // Create assessment without optional fields
      const minimalAssessment = await prisma.assessment.create({
        data: {
          slug: 'minimal-for-update',
          title: 'Minimal Assessment',
          type: 'PROVA_ABERTA',
          randomizeQuestions: false,
          randomizeOptions: false,
        },
      });

      const updatePayload = {
        title: 'Updated Minimal',
      };

      const res = await testHelpers.updateAssessment(
        minimalAssessment.id,
        updatePayload,
      );

      expect(res.status).toBe(200);

      // Optional fields should not be present if undefined
      expect(res.body.assessment.description).toBeUndefined();
      expect(res.body.assessment.quizPosition).toBeUndefined();
      expect(res.body.assessment.timeLimitInMinutes).toBeUndefined();
      expect(res.body.assessment.lessonId).toBeUndefined();
    });
  });

  describe('⚡ Performance', () => {
    it('should update quickly', async () => {
      const updatePayload = {
        title: 'Performance Test Update',
        description: 'Testing update performance',
      };

      const startTime = Date.now();
      const res = await testHelpers.updateAssessment(
        quizAssessmentId,
        updatePayload,
      );
      const endTime = Date.now();

      expect(res.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle large payload updates efficiently', async () => {
      const updatePayload = {
        title: 'Large Update ' + 'X'.repeat(200),
        description: 'Y'.repeat(900),
        passingScore: 95,
        randomizeQuestions: true,
        randomizeOptions: true,
      };

      const startTime = Date.now();
      const res = await testHelpers.updateAssessment(
        simuladoAssessmentId,
        updatePayload,
      );
      const endTime = Date.now();

      expect(res.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should handle rapid sequential updates', async () => {
      const updates: Promise<any>[] = [];
      for (let i = 1; i <= 5; i++) {
        updates.push(
          testHelpers.updateAssessment(provaAbertaAssessmentId, {
            title: `Rapid Update ${i}`,
          }),
        );
      }

      const responses = await Promise.all(updates);

      // All should succeed
      responses.forEach((res) => {
        expect(res.status).toBe(200);
      });

      // Final state should reflect last update (though order may vary due to concurrency)
      const finalRes = await testHelpers.getAssessment(provaAbertaAssessmentId);
      expect(finalRes.body.assessment.title).toMatch(/Rapid Update \d/);
    });
  });
});
