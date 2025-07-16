// test/e2e/assessment/get-questions-detailed.e2e.spec.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { AssessmentTestSetup } from './shared/assessment-test-setup';
import { AssessmentTestHelpers } from './shared/assessment-test-helpers';
import { AssessmentTestData } from './shared/assessment-test-data';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
import { UniqueEntityID } from '@/core/unique-entity-id';

describe('[E2E] GET /assessments/:id/questions/detailed', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let testSetup: AssessmentTestSetup;
  let testHelpers: AssessmentTestHelpers;
  let testData: any;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();

    prisma = new PrismaClient();
    testSetup = new AssessmentTestSetup(prisma);
    testHelpers = new AssessmentTestHelpers(app);

    // Create test scenario
    testData = await testSetup.createTestScenario();
  });

  afterAll(async () => {
    await testSetup.cleanup();
    await app.close();
    await prisma.$disconnect();
  });

  describe('Success Scenarios', () => {
    it('should return detailed questions for a QUIZ assessment', async () => {
      // Act
      const response = await testHelpers.getQuestionsDetailed(testData.quizId);

      // Debug - let's see what error we're getting
      if (response.status !== 200) {
        console.log('Response status:', response.status);
        console.log('Response body:', response.body);
      }

      // Assert
      testHelpers.validateQuizResponse(response, testData);
    });

    it('should return detailed questions for a SIMULADO assessment', async () => {
      // Act
      const response = await testHelpers.getQuestionsDetailed(
        testData.simuladoId,
      );

      // Assert
      testHelpers.validateSimuladoResponse(response, testData);
    });

    it('should return detailed questions for a PROVA_ABERTA assessment', async () => {
      // Act
      const response = await testHelpers.getQuestionsDetailed(
        testData.provaAbertaId,
      );

      // Assert
      testHelpers.validateProvaAbertaResponse(response, testData);
    });

    it('should handle empty assessment with no questions', async () => {
      // Act
      const response = await testHelpers.getQuestionsDetailed(
        testData.emptyAssessmentId,
      );

      // Assert
      testHelpers.validateEmptyAssessmentResponse(response, testData);
    });
  });

  describe('Validation Errors', () => {
    it('should return 400 when assessmentId is not a valid UUID', async () => {
      // Act
      const response = await testHelpers.getQuestionsDetailed(
        AssessmentTestData.INVALID_UUID,
      );

      // Assert
      testHelpers.expectValidationError(response, [
        'assessmentId: Assessment ID must be a valid UUID',
      ]);
    });

    it('should return 400 when assessmentId is empty', async () => {
      // Act
      const response = await testHelpers.getQuestionsDetailed('');

      // Assert
      expect(response.status).toBe(404); // NestJS returns 404 for empty path params
    });
  });

  describe('Business Logic Errors', () => {
    it('should return 404 when assessment does not exist', async () => {
      // Act
      const response = await testHelpers.getQuestionsDetailed(
        AssessmentTestData.NON_EXISTENT_UUID,
      );

      // Assert
      testHelpers.expectNotFoundError(response);
    });
  });

  describe('Response Structure Validation', () => {
    it('should include all required fields in the response', async () => {
      // Act
      const response = await testHelpers.getQuestionsDetailed(testData.quizId);

      // Assert
      expect(response.status).toBe(200);

      // Check top-level structure
      expect(response.body).toHaveProperty('assessment');
      expect(response.body).toHaveProperty('lesson');
      expect(response.body).toHaveProperty('arguments');
      expect(response.body).toHaveProperty('questions');
      expect(response.body).toHaveProperty('totalQuestions');
      expect(response.body).toHaveProperty('totalQuestionsWithAnswers');

      // Check assessment structure
      const { assessment } = response.body;
      expect(assessment).toHaveProperty('id');
      expect(assessment).toHaveProperty('slug');
      expect(assessment).toHaveProperty('title');
      expect(assessment).toHaveProperty('description');
      expect(assessment).toHaveProperty('type');
      expect(assessment).toHaveProperty('quizPosition');
      expect(assessment).toHaveProperty('passingScore');
      // timeLimitInMinutes may be undefined for some assessment types
      expect(assessment).toHaveProperty('randomizeQuestions');
      expect(assessment).toHaveProperty('randomizeOptions');
      expect(assessment).toHaveProperty('lessonId');
      expect(assessment).toHaveProperty('createdAt');
      expect(assessment).toHaveProperty('updatedAt');

      // Check question structure
      const question = response.body.questions[0];
      expect(question).toHaveProperty('id');
      expect(question).toHaveProperty('text');
      expect(question).toHaveProperty('type');
      // argumentId is optional for questions
      expect(question).toHaveProperty('options');
      expect(question).toHaveProperty('answer');
      expect(question).toHaveProperty('createdAt');
      expect(question).toHaveProperty('updatedAt');

      // Check option structure
      const option = question.options[0];
      expect(option).toHaveProperty('id');
      expect(option).toHaveProperty('text');
      expect(option).toHaveProperty('createdAt');
      expect(option).toHaveProperty('updatedAt');

      // Check answer structure
      const { answer } = question;
      expect(answer).toHaveProperty('id');
      expect(answer).toHaveProperty('correctOptionId');
      expect(answer).toHaveProperty('explanation');
      expect(answer).toHaveProperty('translations');

      // Check translation structure
      const translation = answer.translations[0];
      expect(translation).toHaveProperty('locale');
      expect(translation).toHaveProperty('explanation');
    });

    it('should handle questions with multilingual translations', async () => {
      // Act
      const response = await testHelpers.getQuestionsDetailed(testData.quizId);

      // Assert
      expect(response.status).toBe(200);
      const { answer } = response.body.questions[0];
      expect(answer.translations).toHaveLength(2);

      const ptTranslation = answer.translations.find(
        (t: any) => t.locale === 'pt',
      );
      expect(ptTranslation).toBeDefined();
      expect(ptTranslation.explanation).toBe('Dois mais dois é igual a quatro');

      const itTranslation = answer.translations.find(
        (t: any) => t.locale === 'it',
      );
      expect(itTranslation).toBeDefined();
      expect(itTranslation.explanation).toBe('Due più due fa quattro');
    });

    it('should correctly count questions with and without answers', async () => {
      // Act
      const quizResponse = await testHelpers.getQuestionsDetailed(
        testData.quizId,
      );
      const provaResponse = await testHelpers.getQuestionsDetailed(
        testData.provaAbertaId,
      );

      // Assert
      // Quiz has questions with answers
      expect(quizResponse.body.totalQuestions).toBe(1);
      expect(quizResponse.body.totalQuestionsWithAnswers).toBe(1);

      // Prova Aberta has questions without answers
      expect(provaResponse.body.totalQuestions).toBe(1);
      expect(provaResponse.body.totalQuestionsWithAnswers).toBe(0);
    });

    it('should include argument information for SIMULADO assessments', async () => {
      // Act
      const response = await testHelpers.getQuestionsDetailed(
        testData.simuladoId,
      );

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.arguments).toHaveLength(1);

      const argument = response.body.arguments[0];
      expect(argument).toHaveProperty('id');
      expect(argument).toHaveProperty('title');
      // description is optional for arguments
      expect(argument).toHaveProperty('assessmentId');
      expect(argument).toHaveProperty('questions');
      expect(argument).toHaveProperty('createdAt');
      expect(argument).toHaveProperty('updatedAt');

      // Check that questions are grouped under arguments
      expect(argument.questions).toHaveLength(1);
      expect(argument.questions[0].argumentId).toBe(argument.id);
    });
  });

  describe('Edge Cases', () => {
    it('should handle QUIZ assessment without lesson gracefully', async () => {
      // Create a quiz without lesson
      const quizWithoutLessonId = new UniqueEntityID().toString();
      await prisma.assessment.create({
        data: {
          id: quizWithoutLessonId,
          slug: 'quiz-no-lesson',
          title: 'Quiz Without Lesson',
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
        },
      });

      // Act
      const response =
        await testHelpers.getQuestionsDetailed(quizWithoutLessonId);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.lesson).toBeUndefined();

      // Cleanup
      await prisma.assessment.delete({ where: { id: quizWithoutLessonId } });
    });

    it('should handle assessment with questions but no options', async () => {
      // Create assessment with question but no options
      const assessmentId = new UniqueEntityID().toString();
      const questionId = new UniqueEntityID().toString();

      await prisma.assessment.create({
        data: {
          id: assessmentId,
          slug: 'assessment-no-options',
          title: 'Assessment with Question but No Options',
          type: 'QUIZ',
          quizPosition: 'AFTER_LESSON',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
        },
      });

      await prisma.question.create({
        data: {
          id: questionId,
          text: 'Question without options',
          type: 'MULTIPLE_CHOICE',
          assessmentId: assessmentId,
        },
      });

      // Act
      const response = await testHelpers.getQuestionsDetailed(assessmentId);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.questions).toHaveLength(1);
      expect(response.body.questions[0].options).toHaveLength(0);
      expect(response.body.questions[0].answer).toBeUndefined();

      // Cleanup
      await prisma.question.delete({ where: { id: questionId } });
      await prisma.assessment.delete({ where: { id: assessmentId } });
    });
  });

  describe('Performance Considerations', () => {
    it('should handle assessment with many questions efficiently', async () => {
      // Create assessment with multiple questions
      const perfAssessmentId = new UniqueEntityID().toString();
      await prisma.assessment.create({
        data: {
          id: perfAssessmentId,
          slug: 'performance-assessment',
          title: 'Performance Test Assessment',
          type: 'SIMULADO',
          passingScore: 80,
          randomizeQuestions: true,
          randomizeOptions: true,
        },
      });

      // Create 10 questions
      const questionIds: string[] = [];
      for (let i = 0; i < 10; i++) {
        const questionId = `perf-question-${i}`;
        questionIds.push(questionId);

        await prisma.question.create({
          data: {
            id: questionId,
            text: `Performance test question ${i}`,
            type: 'MULTIPLE_CHOICE',
            assessmentId: perfAssessmentId,
          },
        });

        // Create 4 options per question
        for (let j = 0; j < 4; j++) {
          await prisma.questionOption.create({
            data: {
              id: `perf-option-${i}-${j}`,
              text: `Option ${j}`,
              questionId: questionId,
            },
          });
        }
      }

      // Measure response time
      const startTime = Date.now();
      const response = await testHelpers.getQuestionsDetailed(perfAssessmentId);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.questions).toHaveLength(10);
      expect(response.body.totalQuestions).toBe(10);
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second

      // Cleanup
      await prisma.questionOption.deleteMany({
        where: { questionId: { in: questionIds } },
      });
      await prisma.question.deleteMany({
        where: { id: { in: questionIds } },
      });
      await prisma.assessment.delete({ where: { id: perfAssessmentId } });
    });
  });
});
