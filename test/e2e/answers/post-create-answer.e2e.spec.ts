// test/e2e/answers/post-create-answer.e2e.spec.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request, { Response } from 'supertest';

import { AnswerTestSetup } from './shared/answer-test-setup';
import { AnswerTestHelpers } from './shared/answer-test-helpers';
import { AnswerTestData } from './shared/answer-test-data';

describe('CreateAnswer E2E', () => {
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
      const { questionId, optionIds } =
        await testSetup.createTestQuestionWithOptions({
          text: 'Basic multiple choice question for answer creation',
          type: 'MULTIPLE_CHOICE',
          assessmentId: testSetup.quizAssessmentId,
          options: ['Option A', 'Option B', 'Option C'],
        });

      const answerData = {
        explanation: 'Basic explanation for multiple choice question',
        questionId,
        correctOptionId: optionIds[0],
      };

      const response: Response =
        await helpers.createAnswerExpectSuccess(answerData);

      // Verify response format
      helpers.verifyCreateAnswerSuccessResponseFormat(
        response.body,
        answerData.explanation,
        questionId,
        optionIds[0],
      );

      // Verify answer was created in database
      const dbAnswer = await testSetup.findAnswerById(response.body.answer.id);
      expect(dbAnswer).toBeDefined();
      expect(dbAnswer!.explanation).toBe(answerData.explanation);
      expect(dbAnswer!.questionId).toBe(questionId);
      expect(dbAnswer!.correctOptionId).toBe(optionIds[0]);
    });

    it('should create answer for open question without correct option', async () => {
      const { questionId } = await testSetup.createTestQuestionWithOptions({
        text: 'Open question for answer creation without correct option',
        type: 'OPEN',
        assessmentId: testSetup.provaAbertaAssessmentId,
      });

      const answerData = {
        explanation: 'Detailed explanation for open question',
        questionId,
      };

      const response: Response =
        await helpers.createAnswerExpectSuccess(answerData);

      expect(response.body.answer.explanation).toBe(answerData.explanation);
      expect(response.body.answer.questionId).toBe(questionId);
      expect(response.body.answer.correctOptionId).toBeUndefined();
    });

    it('should create answer with translations', async () => {
      const { questionId, optionIds } =
        await testSetup.createTestQuestionWithOptions({
          text: 'Multiple choice question for answer with translations',
          type: 'MULTIPLE_CHOICE',
          assessmentId: testSetup.quizAssessmentId,
          options: ['Option A', 'Option B', 'Option C'],
        });

      const answerData = {
        explanation: 'Answer with multiple translations',
        questionId,
        correctOptionId: optionIds[0],
        translations: [
          { locale: 'pt' as const, explanation: 'Explicação em português' },
          { locale: 'it' as const, explanation: 'Spiegazione in italiano' },
          { locale: 'es' as const, explanation: 'Explicación en español' },
        ],
      };

      const response: Response =
        await helpers.createAnswerExpectSuccess(answerData);

      expect(response.body.answer.translations).toHaveLength(3);
      expect(response.body.answer.translations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            locale: 'pt',
            explanation: 'Explicação em português',
          }),
          expect.objectContaining({
            locale: 'it',
            explanation: 'Spiegazione in italiano',
          }),
          expect.objectContaining({
            locale: 'es',
            explanation: 'Explicación en español',
          }),
        ]),
      );
    });

    it('should create answer with medical content', async () => {
      const { questionId, optionIds } =
        await testSetup.createTestQuestionWithOptions({
          text: 'Medical question about hypertension pathophysiology',
          type: 'MULTIPLE_CHOICE',
          assessmentId: testSetup.quizAssessmentId,
          options: ['Option A', 'Option B', 'Option C'],
        });

      const answerData = {
        explanation:
          'Hypertension is characterized by elevated blood pressure (≥140/90 mmHg). The pathophysiology involves increased peripheral resistance and endothelial dysfunction.',
        questionId,
        correctOptionId: optionIds[0],
      };

      const response: Response =
        await helpers.createAnswerExpectSuccess(answerData);

      expect(response.body.answer.explanation).toContain('140/90 mmHg');
      expect(response.body.answer.explanation).toContain('pathophysiology');
      expect(response.body.answer.explanation).toContain(
        'endothelial dysfunction',
      );
    });

    it('should create answer with special characters', async () => {
      const { questionId } = await testSetup.createTestQuestionWithOptions({
        text: 'Open question for testing special characters in answer',
        type: 'OPEN',
        assessmentId: testSetup.provaAbertaAssessmentId,
      });

      const answerData = {
        explanation: 'Answer with special chars: @#$%^&*()! and symbols: ±≤≥≠≈',
        questionId,
      };

      const response: Response =
        await helpers.createAnswerExpectSuccess(answerData);

      expect(response.body.answer.explanation).toContain('@#$%^&*()!');
      expect(response.body.answer.explanation).toContain('±≤≥≠≈');
    });

    it('should create answer with unicode characters', async () => {
      const { questionId } = await testSetup.createTestQuestionWithOptions({
        text: 'Open question for testing unicode characters in answer',
        type: 'OPEN',
        assessmentId: testSetup.provaAbertaAssessmentId,
      });

      const answerData = {
        explanation:
          'Resposta em português 中文 العربية русский with emojis 🎯🚀',
        questionId,
      };

      const response: Response =
        await helpers.createAnswerExpectSuccess(answerData);

      expect(response.body.answer.explanation).toContain('português');
      expect(response.body.answer.explanation).toContain('中文');
      expect(response.body.answer.explanation).toContain('العربية');
      expect(response.body.answer.explanation).toContain('русский');
      expect(response.body.answer.explanation).toContain('🎯🚀');
    });

    it('should create answer with minimum length explanation', async () => {
      const { questionId } = await testSetup.createTestQuestionWithOptions({
        text: 'Open question for testing minimum length answer',
        type: 'OPEN',
        assessmentId: testSetup.provaAbertaAssessmentId,
      });

      const answerData = {
        explanation: 'A',
        questionId,
      };

      const response: Response =
        await helpers.createAnswerExpectSuccess(answerData);

      expect(response.body.answer.explanation).toBe('A');
      expect(response.body.answer.explanation).toHaveLength(1);
    });

    it('should create answer with maximum length explanation', async () => {
      const { questionId } = await testSetup.createTestQuestionWithOptions({
        text: 'Open question for testing maximum length answer',
        type: 'OPEN',
        assessmentId: testSetup.provaAbertaAssessmentId,
      });

      const longExplanation = 'A'.repeat(2000);
      const answerData = {
        explanation: longExplanation,
        questionId,
      };

      const response: Response =
        await helpers.createAnswerExpectSuccess(answerData);

      expect(response.body.answer.explanation).toBe(longExplanation);
      expect(response.body.answer.explanation).toHaveLength(2000);
    });

    it('should create answer with formatting (newlines and tabs)', async () => {
      const { questionId } = await testSetup.createTestQuestionWithOptions({
        text: 'Open question for testing formatting in answer',
        type: 'OPEN',
        assessmentId: testSetup.provaAbertaAssessmentId,
      });

      const answerData = {
        explanation:
          'Line 1\nLine 2\n\nParagraph 2\n\t- Bullet point 1\n\t- Bullet point 2',
        questionId,
      };

      const response: Response =
        await helpers.createAnswerExpectSuccess(answerData);

      expect(response.body.answer.explanation).toContain('Line 1\nLine 2');
      expect(response.body.answer.explanation).toContain('\t- Bullet point');
    });
  });

  describe('Validation scenarios', () => {
    it('should reject empty explanation', async () => {
      const { questionId, optionIds } =
        await testSetup.createTestQuestionWithOptions({
          text: 'Multiple choice question for empty explanation validation',
          type: 'MULTIPLE_CHOICE',
          assessmentId: testSetup.quizAssessmentId,
          options: ['Option A', 'Option B', 'Option C'],
        });

      const answerData = {
        explanation: '',
        questionId,
        correctOptionId: optionIds[0],
      };

      const response: Response =
        await helpers.createAnswerWithPayload(answerData);
      expect([400, 500]).toContain(response.status);
    });

    it('should reject null explanation', async () => {
      const { questionId, optionIds } =
        await testSetup.createTestQuestionWithOptions({
          text: 'Multiple choice question for null explanation validation',
          type: 'MULTIPLE_CHOICE',
          assessmentId: testSetup.quizAssessmentId,
          options: ['Option A', 'Option B', 'Option C'],
        });

      const answerData = {
        explanation: null,
        questionId,
        correctOptionId: optionIds[0],
      };

      const response: Response =
        await helpers.createAnswerWithPayload(answerData);
      expect(response.status).toBe(400);
    });

    it('should reject missing explanation field', async () => {
      const { questionId, optionIds } =
        await testSetup.createTestQuestionWithOptions({
          text: 'Multiple choice question for missing explanation validation',
          type: 'MULTIPLE_CHOICE',
          assessmentId: testSetup.quizAssessmentId,
          options: ['Option A', 'Option B', 'Option C'],
        });

      const answerData = {
        questionId,
        correctOptionId: optionIds[0],
      };

      const response: Response =
        await helpers.createAnswerWithPayload(answerData);
      expect(response.status).toBe(400);
    });

    it('should reject invalid question ID', async () => {
      const { optionIds } = await testSetup.createTestQuestionWithOptions({
        text: 'Multiple choice question for invalid question ID validation',
        type: 'MULTIPLE_CHOICE',
        assessmentId: testSetup.quizAssessmentId,
        options: ['Option A', 'Option B', 'Option C'],
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

    it('should reject missing question ID', async () => {
      const { optionIds } = await testSetup.createTestQuestionWithOptions({
        text: 'Multiple choice question for missing question ID validation',
        type: 'MULTIPLE_CHOICE',
        assessmentId: testSetup.quizAssessmentId,
        options: ['Option A', 'Option B', 'Option C'],
      });

      const answerData = {
        explanation: 'Valid explanation',
        correctOptionId: optionIds[0],
      };

      const response: Response =
        await helpers.createAnswerWithPayload(answerData);
      expect(response.status).toBe(400);
    });

    it('should reject invalid translation locale', async () => {
      const { questionId, optionIds } =
        await testSetup.createTestQuestionWithOptions({
          text: 'Multiple choice question for invalid locale validation',
          type: 'MULTIPLE_CHOICE',
          assessmentId: testSetup.quizAssessmentId,
          options: ['Option A', 'Option B', 'Option C'],
        });

      const answerData = {
        explanation: 'Valid explanation',
        questionId,
        correctOptionId: optionIds[0],
        translations: [
          {
            locale: 'invalid' as any,
            explanation: 'Invalid locale translation',
          },
        ],
      };

      const response: Response =
        await helpers.createAnswerWithPayload(answerData);
      expect(response.status).toBe(400);
    });

    it('should reject empty translation explanation', async () => {
      const { questionId, optionIds } =
        await testSetup.createTestQuestionWithOptions({
          text: 'Multiple choice question for empty translation validation',
          type: 'MULTIPLE_CHOICE',
          assessmentId: testSetup.quizAssessmentId,
          options: ['Option A', 'Option B', 'Option C'],
        });

      const answerData = {
        explanation: 'Valid explanation',
        questionId,
        correctOptionId: optionIds[0],
        translations: [{ locale: 'pt' as const, explanation: '' }],
      };

      const response: Response =
        await helpers.createAnswerWithPayload(answerData);
      expect([400, 500]).toContain(response.status);
    });

    it('should reject non-string explanation', async () => {
      const { questionId, optionIds } =
        await testSetup.createTestQuestionWithOptions({
          text: 'Multiple choice question for non-string explanation validation',
          type: 'MULTIPLE_CHOICE',
          assessmentId: testSetup.quizAssessmentId,
          options: ['Option A', 'Option B', 'Option C'],
        });

      const answerData = {
        explanation: 123,
        questionId,
        correctOptionId: optionIds[0],
      };

      const response: Response =
        await helpers.createAnswerWithPayload(answerData);
      expect(response.status).toBe(400);
    });

    it('should reject invalid correctOptionId format', async () => {
      const { questionId } = await testSetup.createTestQuestionWithOptions({
        text: 'Multiple choice question for invalid correctOptionId validation',
        type: 'MULTIPLE_CHOICE',
        assessmentId: testSetup.quizAssessmentId,
        options: ['Option A', 'Option B', 'Option C'],
      });

      const answerData = {
        explanation: 'Valid explanation',
        questionId,
        correctOptionId: 'invalid-uuid',
      };

      const response: Response =
        await helpers.createAnswerWithPayload(answerData);
      expect([400, 404]).toContain(response.status);
    });
  });

  describe('Error scenarios', () => {
    it('should return 404 when question does not exist', async () => {
      const { optionIds } = await testSetup.createTestQuestionWithOptions({
        text: 'Multiple choice question for 404 test',
        type: 'MULTIPLE_CHOICE',
        assessmentId: testSetup.quizAssessmentId,
        options: ['Option A', 'Option B', 'Option C'],
      });

      const answerData = {
        explanation: 'Valid explanation',
        questionId: testSetup.getRandomUUID(),
        correctOptionId: optionIds[0],
      };

      await helpers.createAnswerExpectNotFound(answerData);
    });

    it('should return 409 when answer already exists for question', async () => {
      const { questionId, optionIds } =
        await testSetup.createTestQuestionWithOptions({
          text: 'Multiple choice question for 409 conflict test',
          type: 'MULTIPLE_CHOICE',
          assessmentId: testSetup.quizAssessmentId,
          options: ['Option A', 'Option B', 'Option C'],
        });

      const answerData = {
        explanation: 'First answer',
        questionId,
        correctOptionId: optionIds[0],
      };

      // Create first answer
      await helpers.createAnswerExpectSuccess(answerData);

      // Try to create second answer for same question
      const duplicateAnswerData = {
        explanation: 'Second answer',
        questionId,
        correctOptionId: optionIds[0],
      };

      await helpers.createAnswerExpectConflict(duplicateAnswerData);
    });

    it('should handle malformed request body', async () => {
      const malformedPayloads = ['string instead of object', null, []];

      for (const payload of malformedPayloads) {
        const response: Response =
          await helpers.createAnswerWithPayload(payload);
        expect([400, 500]).toContain(response.status);
      }
    });

    it('should handle empty request body', async () => {
      const response: Response =
        await helpers.createAnswerWithPayload(undefined);
      expect([400, 500]).toContain(response.status);
    });

    it('should validate content-type requirements', async () => {
      const response: Response = await request(testSetup.getHttpServer())
        .post('/answers')
        .set('Content-Type', 'text/plain')
        .send('Plain text instead of JSON');

      expect([400, 415]).toContain(response.status);
    });
  });

  describe('Edge cases', () => {
    it('should handle answer creation immediately after question creation', async () => {
      // Create new question
      const { questionId } = await testSetup.createTestQuestionWithOptions({
        text: 'Immediate answer creation test',
        type: 'OPEN',
        assessmentId: testSetup.provaAbertaAssessmentId,
      });

      // Create answer immediately
      const answerData = {
        explanation: 'Immediate answer explanation',
        questionId,
      };

      const response: Response =
        await helpers.createAnswerExpectSuccess(answerData);
      expect(response.body.answer.questionId).toBe(questionId);
    });

    it('should preserve exact explanation content without modification', async () => {
      const edgeCaseTexts = [
        'Text with\ttabs and\nnewlines\r\nand CRLF',
        'Mixed    spacing   between    words',
        'UPPERCASE and lowercase and MiXeD',
        '0123456789',
        '!@#$%^&*()_+-=[]{}|;:,.<>?',
        'áéíóúàèìòùâêîôûãõç',
        '中文测试',
        'مرحبا بالعالم',
        'Привет мир',
        '🚀🎯💡🔬⚕️',
      ];

      for (const text of edgeCaseTexts) {
        const { questionId } = await testSetup.createTestQuestionWithOptions({
          text: `Open question for edge case text: ${text.substring(0, 20)}...`,
          type: 'OPEN',
          assessmentId: testSetup.provaAbertaAssessmentId,
        });

        const answerData = {
          explanation: text,
          questionId,
        };

        const response: Response =
          await helpers.createAnswerExpectSuccess(answerData);

        // Verify preservation (note: leading/trailing spaces are trimmed by validation)
        expect(response.body.answer.explanation).toBe(text);
        expect(response.body.answer.explanation.length).toBe(text.length);
      }

      // Test specifically for trimming behavior
      const { questionId } = await testSetup.createTestQuestionWithOptions({
        text: 'Open question for trimming test',
        type: 'OPEN',
        assessmentId: testSetup.provaAbertaAssessmentId,
      });

      const answerDataWithSpaces = {
        explanation: '  Leading and trailing spaces  ',
        questionId,
      };

      const response =
        await helpers.createAnswerWithPayload(answerDataWithSpaces);
      expect(response.status).toBe(201);

      // Verify that leading/trailing spaces are trimmed (expected behavior)
      expect(response.body.answer.explanation).toBe(
        'Leading and trailing spaces',
      );
    });

    it('should handle concurrent answer creation for different questions', async () => {
      const { questionId: questionId1, optionIds: optionIds1 } =
        await testSetup.createTestQuestionWithOptions({
          text: 'Concurrent test question 1',
          type: 'MULTIPLE_CHOICE',
          assessmentId: testSetup.quizAssessmentId,
          options: ['Option A', 'Option B', 'Option C'],
        });

      const { questionId: questionId2 } =
        await testSetup.createTestQuestionWithOptions({
          text: 'Concurrent test question 2',
          type: 'OPEN',
          assessmentId: testSetup.provaAbertaAssessmentId,
        });

      const { questionId: questionId3 } =
        await testSetup.createTestQuestionWithOptions({
          text: 'Concurrent test question 3',
          type: 'OPEN',
          assessmentId: testSetup.provaAbertaAssessmentId,
        });

      const answerDataSet = [
        {
          explanation: 'Concurrent answer 1',
          questionId: questionId1,
          correctOptionId: optionIds1[0],
        },
        { explanation: 'Concurrent answer 2', questionId: questionId2 },
        { explanation: 'Concurrent answer 3', questionId: questionId3 },
      ];

      // Create answers concurrently
      const promises = answerDataSet.map((data) =>
        helpers.createAnswerExpectSuccess(data),
      );

      const responses = await Promise.all(promises);

      // Verify all succeeded
      expect(responses).toHaveLength(3);
      responses.forEach((response, index) => {
        expect(response.status).toBe(201);
        expect(response.body.answer.explanation).toBe(
          answerDataSet[index].explanation,
        );
        expect(response.body.answer.questionId).toBe(
          answerDataSet[index].questionId,
        );
      });
    });

    it('should handle timestamp precision correctly', async () => {
      const { questionId } = await testSetup.createTestQuestionWithOptions({
        text: 'Open question for timestamp precision test',
        type: 'OPEN',
        assessmentId: testSetup.provaAbertaAssessmentId,
      });

      const before = new Date();

      const answerData = {
        explanation: 'Timestamp test answer',
        questionId,
      };

      const response: Response =
        await helpers.createAnswerExpectSuccess(answerData);

      const after = new Date();
      const createdAt = new Date(response.body.answer.createdAt);
      const updatedAt = new Date(response.body.answer.updatedAt);

      // Verify timestamps are within expected range
      expect(createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());

      // For new records, createdAt should equal updatedAt
      expect(createdAt.getTime()).toBe(updatedAt.getTime());
    });

    it('should handle HTML-like content safely', async () => {
      const { questionId } = await testSetup.createTestQuestionWithOptions({
        text: 'Open question for HTML-like content safety test',
        type: 'OPEN',
        assessmentId: testSetup.provaAbertaAssessmentId,
      });

      const answerData = {
        explanation:
          'The answer contains <strong>bold</strong> and <em>italic</em> text for emphasis.',
        questionId,
      };

      const response: Response =
        await helpers.createAnswerExpectSuccess(answerData);

      expect(response.body.answer.explanation).toContain(
        '<strong>bold</strong>',
      );
      expect(response.body.answer.explanation).toContain('<em>italic</em>');
    });

    it('should handle SQL injection attempt safely', async () => {
      const { questionId } = await testSetup.createTestQuestionWithOptions({
        text: 'Open question for SQL injection safety test',
        type: 'OPEN',
        assessmentId: testSetup.provaAbertaAssessmentId,
      });

      const answerData = {
        explanation: "'; DROP TABLE answers; --",
        questionId,
      };

      // This should be treated as regular text, not executed
      const response: Response =
        await helpers.createAnswerExpectSuccess(answerData);

      expect(response.body.answer.explanation).toBe(answerData.explanation);

      // Verify database integrity
      const dbCount = await testSetup.prisma.answer.count();
      expect(dbCount).toBeGreaterThan(0);
    });

    it('should handle XSS attempt safely', async () => {
      const { questionId } = await testSetup.createTestQuestionWithOptions({
        text: 'Open question for XSS safety test',
        type: 'OPEN',
        assessmentId: testSetup.provaAbertaAssessmentId,
      });

      const answerData = {
        explanation: '<script>alert("XSS")</script>',
        questionId,
      };

      // This should be treated as regular text, not executed
      const response: Response =
        await helpers.createAnswerExpectSuccess(answerData);

      expect(response.body.answer.explanation).toBe(answerData.explanation);
    });
  });

  describe('Performance tests', () => {
    it('should create answer within acceptable time', async () => {
      const { questionId } = await testSetup.createTestQuestionWithOptions({
        text: 'Open question for performance test',
        type: 'OPEN',
        assessmentId: testSetup.provaAbertaAssessmentId,
      });

      const answerData = {
        explanation: 'Performance test answer',
        questionId,
      };

      await helpers.testCreateAnswerPerformance(
        'Single create answer',
        async () => await helpers.createAnswerExpectSuccess(answerData),
        1000, // 1 second max
      );
    });

    it('should handle large explanation efficiently', async () => {
      const { questionId } = await testSetup.createTestQuestionWithOptions({
        text: 'Open question for large explanation performance test',
        type: 'OPEN',
        assessmentId: testSetup.provaAbertaAssessmentId,
      });

      const largeExplanation = 'A'.repeat(2000);
      const answerData = {
        explanation: largeExplanation,
        questionId,
      };

      await helpers.testCreateAnswerPerformance(
        'Large explanation answer creation',
        async () => await helpers.createAnswerExpectSuccess(answerData),
        1500, // 1.5 second max
      );
    });
  });

  describe('Database integrity verification', () => {
    it('should maintain database consistency during operations', async () => {
      const { questionId: openQuestionId } =
        await testSetup.createTestQuestionWithOptions({
          text: 'Open question for database consistency test',
          type: 'OPEN',
          assessmentId: testSetup.provaAbertaAssessmentId,
        });

      const { questionId: multipleChoiceQuestionId, optionIds } =
        await testSetup.createTestQuestionWithOptions({
          text: 'Multiple choice question for database consistency test',
          type: 'MULTIPLE_CHOICE',
          assessmentId: testSetup.quizAssessmentId,
          options: ['Option A', 'Option B', 'Option C'],
        });

      const answersToCreate = [
        { explanation: 'DB Answer 1', questionId: openQuestionId },
        {
          explanation: 'DB Answer 2',
          questionId: multipleChoiceQuestionId,
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
      const { questionId, optionIds } =
        await testSetup.createTestQuestionWithOptions({
          text: 'Multiple choice question for referential integrity test',
          type: 'MULTIPLE_CHOICE',
          assessmentId: testSetup.quizAssessmentId,
          options: ['Option A', 'Option B', 'Option C'],
        });

      const answerData = {
        explanation: 'Referential integrity test',
        questionId,
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

    it('should maintain data integrity between create and get operations', async () => {
      const { questionId, optionIds } =
        await testSetup.createTestQuestionWithOptions({
          text: 'Multiple choice question for data integrity test',
          type: 'MULTIPLE_CHOICE',
          assessmentId: testSetup.quizAssessmentId,
          options: ['Option A', 'Option B', 'Option C'],
        });

      const answerData = {
        explanation: 'Data integrity test answer',
        questionId,
        correctOptionId: optionIds[0],
        translations: [
          { locale: 'pt' as const, explanation: 'Explicação em português' },
        ],
      };

      const createResponse: Response =
        await helpers.createAnswerExpectSuccess(answerData);

      // Retrieve the answer and verify data integrity
      const getResponse = await helpers.getAnswerExpectSuccess(
        createResponse.body.answer.id,
      );

      expect(getResponse.body.answer.explanation).toBe(answerData.explanation);
      expect(getResponse.body.answer.questionId).toBe(questionId);
      expect(getResponse.body.answer.correctOptionId).toBe(optionIds[0]);
      expect(getResponse.body.answer.translations).toHaveLength(1);
      expect(getResponse.body.answer.translations[0].locale).toBe('pt');
      expect(getResponse.body.answer.translations[0].explanation).toBe(
        'Explicação em português',
      );
    });
  });
}, 30000); // 30 second timeout
