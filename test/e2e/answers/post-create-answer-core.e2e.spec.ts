// test/e2e/answers/post-create-answer-core.e2e.spec.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request, { Response } from 'supertest';

import { AnswerTestSetup } from './shared/answer-test-setup';
import { AnswerTestHelpers } from './shared/answer-test-helpers';

describe('CreateAnswer E2E - Core', () => {
  let testSetup: AnswerTestSetup;
  let helpers: AnswerTestHelpers;

  beforeAll(async () => {
    testSetup = new AnswerTestSetup();
    await testSetup.initialize();
    helpers = new AnswerTestHelpers(testSetup);
  });

  beforeEach(async () => {
    await testSetup.setupTestData();
  });

  afterAll(async () => {
    await testSetup.teardown();
  });

  describe('Success scenarios', () => {
    it('should create basic answer for multiple choice question successfully', async () => {
      // Create a unique question with options for this test
      const { questionId, optionIds } =
        await testSetup.createTestQuestionWithOptions({
          text: 'Test multiple choice question for POST answer',
          type: 'MULTIPLE_CHOICE',
          assessmentId: testSetup.quizAssessmentId,
          options: ['Option A', 'Option B', 'Option C'],
        });

      const answerData = {
        explanation: 'Basic explanation for multiple choice question',
        questionId: questionId,
        correctOptionId: optionIds[0], // Use the first option
      };

      const response: Response =
        await helpers.createAnswerExpectSuccess(answerData);

      // Verify response format
      helpers.verifyCreateAnswerSuccessResponseFormat(
        response.body,
        answerData.explanation,
        answerData.questionId,
        answerData.correctOptionId,
      );

      // Verify answer was created in database
      const dbAnswer = await testSetup.findAnswerById(response.body.answer.id);
      expect(dbAnswer).toBeDefined();
      expect(dbAnswer!.explanation).toBe(answerData.explanation);
      expect(dbAnswer!.questionId).toBe(answerData.questionId);
      expect(dbAnswer!.correctOptionId).toBe(answerData.correctOptionId);
    });

    it('should create answer for open question without correct option', async () => {
      // Create a unique open question for this test
      const { questionId } = await testSetup.createTestQuestionWithOptions({
        text: 'Test open question for POST answer',
        type: 'OPEN',
        assessmentId: testSetup.provaAbertaAssessmentId,
      });

      const answerData = {
        explanation: 'Detailed explanation for open question',
        questionId: questionId,
      };

      const response: Response =
        await helpers.createAnswerExpectSuccess(answerData);

      expect(response.body.answer.explanation).toBe(answerData.explanation);
      expect(response.body.answer.questionId).toBe(answerData.questionId);
      expect(response.body.answer.correctOptionId).toBeUndefined();
    });

    it('should create answer with special characters', async () => {
      // Create a unique open question for this test
      const { questionId } = await testSetup.createTestQuestionWithOptions({
        text: 'Test open question for special characters',
        type: 'OPEN',
        assessmentId: testSetup.provaAbertaAssessmentId,
      });

      const answerData = {
        explanation: 'Answer with special chars: @#$%^&*()! and symbols: ±≤≥≠≈',
        questionId: questionId,
      };

      const response: Response =
        await helpers.createAnswerExpectSuccess(answerData);

      expect(response.body.answer.explanation).toContain('@#$%^&*()!');
      expect(response.body.answer.explanation).toContain('±≤≥≠≈');
    });

    it('should create answer with unicode characters', async () => {
      // Create a unique open question for this test
      const { questionId } = await testSetup.createTestQuestionWithOptions({
        text: 'Test open question for unicode characters',
        type: 'OPEN',
        assessmentId: testSetup.provaAbertaAssessmentId,
      });

      const answerData = {
        explanation:
          'Resposta em português 中文 العربية русский with emojis 🎯🚀',
        questionId: questionId,
      };

      const response: Response =
        await helpers.createAnswerExpectSuccess(answerData);

      expect(response.body.answer.explanation).toContain('português');
      expect(response.body.answer.explanation).toContain('中文');
      expect(response.body.answer.explanation).toContain('العربية');
      expect(response.body.answer.explanation).toContain('русский');
      expect(response.body.answer.explanation).toContain('🎯🚀');
    });
  });

  describe('Validation scenarios', () => {
    it('should reject empty explanation', async () => {
      // Create a unique question with options for this test
      const { questionId, optionIds } =
        await testSetup.createTestQuestionWithOptions({
          text: 'Test multiple choice question for empty explanation validation',
          type: 'MULTIPLE_CHOICE',
          assessmentId: testSetup.quizAssessmentId,
          options: ['Option A', 'Option B'],
        });

      const answerData = {
        explanation: '',
        questionId: questionId,
        correctOptionId: optionIds[0],
      };

      const response: Response =
        await helpers.createAnswerWithPayload(answerData);
      expect([400, 500]).toContain(response.status);
    });

    it('should reject null explanation', async () => {
      // Create a unique question with options for this test
      const { questionId, optionIds } =
        await testSetup.createTestQuestionWithOptions({
          text: 'Test multiple choice question for null explanation validation',
          type: 'MULTIPLE_CHOICE',
          assessmentId: testSetup.quizAssessmentId,
          options: ['Option A', 'Option B'],
        });

      const answerData = {
        explanation: null,
        questionId: questionId,
        correctOptionId: optionIds[0],
      };

      const response: Response =
        await helpers.createAnswerWithPayload(answerData);
      expect(response.status).toBe(400);
    });

    it('should reject missing explanation field', async () => {
      // Create a unique question with options for this test
      const { questionId, optionIds } =
        await testSetup.createTestQuestionWithOptions({
          text: 'Test multiple choice question for missing explanation validation',
          type: 'MULTIPLE_CHOICE',
          assessmentId: testSetup.quizAssessmentId,
          options: ['Option A', 'Option B'],
        });

      const answerData = {
        questionId: questionId,
        correctOptionId: optionIds[0],
      };

      const response: Response =
        await helpers.createAnswerWithPayload(answerData);
      expect(response.status).toBe(400);
    });

    it('should reject invalid question ID', async () => {
      // Create a unique question with options for this test to get a valid option ID
      const { optionIds } = await testSetup.createTestQuestionWithOptions({
        text: 'Test multiple choice question for invalid question ID validation',
        type: 'MULTIPLE_CHOICE',
        assessmentId: testSetup.quizAssessmentId,
        options: ['Option A', 'Option B'],
      });

      const answerData = {
        explanation: 'Valid explanation',
        questionId: 'invalid-uuid',
        correctOptionId: optionIds[0],
      };

      const response: Response =
        await helpers.createAnswerWithPayload(answerData);
      expect(response.status).toBe(400);
    });
  });

  describe('Error scenarios', () => {
    it('should return 404 when question does not exist', async () => {
      const answerData = {
        explanation: 'Valid explanation',
        questionId: testSetup.getRandomUUID(),
      };

      await helpers.createAnswerExpectNotFound(answerData);
    });

    it('should return 409 when answer already exists for question', async () => {
      // Create a unique question with options for this test
      const { questionId, optionIds } =
        await testSetup.createTestQuestionWithOptions({
          text: 'Test multiple choice question for conflict test',
          type: 'MULTIPLE_CHOICE',
          assessmentId: testSetup.quizAssessmentId,
          options: ['Option A', 'Option B'],
        });

      const answerData = {
        explanation: 'First answer',
        questionId: questionId,
        correctOptionId: optionIds[0],
      };

      // Create first answer
      await helpers.createAnswerExpectSuccess(answerData);

      // Try to create second answer for same question
      const duplicateAnswerData = {
        explanation: 'Second answer',
        questionId: questionId,
        correctOptionId: optionIds[0],
      };

      await helpers.createAnswerExpectConflict(duplicateAnswerData);
    });

    it('should handle malformed request body', async () => {
      const response: Response = await helpers.createAnswerWithPayload(
        'invalid string instead of object',
      );
      expect([400, 500]).toContain(response.status);
    });
  });

  describe('Database integrity verification', () => {
    it('should maintain database consistency during operations', async () => {
      // Create unique questions for this test
      const { questionId: openQuestionId } =
        await testSetup.createTestQuestionWithOptions({
          text: 'Test open question for DB consistency',
          type: 'OPEN',
          assessmentId: testSetup.provaAbertaAssessmentId,
        });

      const { questionId: mcQuestionId, optionIds } =
        await testSetup.createTestQuestionWithOptions({
          text: 'Test multiple choice question for DB consistency',
          type: 'MULTIPLE_CHOICE',
          assessmentId: testSetup.quizAssessmentId,
          options: ['Option A', 'Option B'],
        });

      const answersToCreate = [
        { explanation: 'DB Answer 1', questionId: openQuestionId },
        {
          explanation: 'DB Answer 2',
          questionId: mcQuestionId,
          correctOptionId: optionIds[0],
        },
      ];
      const createdIds: string[] = [];

      for (const answerData of answersToCreate) {
        const response: Response =
          await helpers.createAnswerExpectSuccess(answerData);
        createdIds.push(response.body.answer.id);
      }

      // Verify all answers exist in database
      for (const answerId of createdIds) {
        const dbAnswer = await testSetup.findAnswerById(answerId);
        expect(dbAnswer).toBeDefined();
      }

      // Verify database integrity
      await helpers.verifyDatabaseIntegrity();
    });

    it('should ensure referential integrity', async () => {
      // Create a unique question with options for this test
      const { questionId, optionIds } =
        await testSetup.createTestQuestionWithOptions({
          text: 'Test multiple choice question for referential integrity',
          type: 'MULTIPLE_CHOICE',
          assessmentId: testSetup.quizAssessmentId,
          options: ['Option A', 'Option B'],
        });

      const answerData = {
        explanation: 'Referential integrity test',
        questionId: questionId,
        correctOptionId: optionIds[0],
      };

      const response: Response =
        await helpers.createAnswerExpectSuccess(answerData);

      // Verify answer references existing question
      const dbAnswer = await testSetup.prisma.answer.findUnique({
        where: { id: response.body.answer.id },
        include: { question: true },
      });

      expect(dbAnswer).toBeDefined();
      expect(dbAnswer!.question).toBeDefined();
      expect(dbAnswer!.question.id).toBe(questionId);
      expect(dbAnswer!.questionId).toBe(questionId);
    });
  });
}, 30000); // 30 second timeout
