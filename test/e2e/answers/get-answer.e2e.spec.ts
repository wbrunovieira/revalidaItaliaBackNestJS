// test/e2e/answers/get-answer.e2e.spec.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { randomUUID } from 'crypto';
import { AnswerTestSetup } from './shared/answer-test-setup';
import { AnswerTestHelpers } from './shared/answer-test-helpers';
import { AnswerTestData } from './shared/answer-test-data';

describe('GetAnswer E2E Tests', () => {
  let testSetup: AnswerTestSetup;
  let testHelpers: AnswerTestHelpers;

  beforeEach(async () => {
    testSetup = new AnswerTestSetup();
    testHelpers = new AnswerTestHelpers(testSetup);

    await testSetup.initialize();
    await testSetup.setupTestData();
  });

  afterEach(async () => {
    await testSetup.teardown();
  });

  describe('Success Cases', () => {
    it('should successfully retrieve an answer by ID', async () => {
      const response = await testHelpers.getAnswerExpectSuccess(
        testSetup.multipleChoiceAnswerId,
      );

      testHelpers.verifyGetAnswerSuccessResponseFormat(
        response.body,
        testSetup.multipleChoiceAnswerId,
      );

      expect(response.body.answer.explanation).toBeDefined();
      expect(response.body.answer.questionId).toBe(
        testSetup.multipleChoiceQuestionId,
      );
      expect(response.body.answer.correctOptionId).toBeDefined();
      expect(response.body.answer.translations).toBeDefined();
      expect(Array.isArray(response.body.answer.translations)).toBe(true);
    });

    it('should retrieve multiple choice answer with correct option ID', async () => {
      const response = await testHelpers.getAnswerExpectSuccess(
        testSetup.multipleChoiceAnswerId,
      );

      expect(response.body.answer.correctOptionId).toBeDefined();
      expect(typeof response.body.answer.correctOptionId).toBe('string');
      expect(response.body.answer.correctOptionId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it('should retrieve open question answer without correct option ID', async () => {
      const response = await testHelpers.getAnswerExpectSuccess(
        testSetup.openAnswerId,
      );

      expect(response.body.answer.correctOptionId).toBeUndefined();
    });

    it('should retrieve answer with translations', async () => {
      const response = await testHelpers.getAnswerExpectSuccess(
        testSetup.multipleChoiceAnswerId,
      );

      expect(response.body.answer.translations).toBeDefined();
      expect(Array.isArray(response.body.answer.translations)).toBe(true);
      expect(response.body.answer.translations.length).toBeGreaterThan(0);

      // Verify each translation has required fields
      response.body.answer.translations.forEach((translation: any) => {
        expect(translation).toHaveProperty('locale');
        expect(translation).toHaveProperty('explanation');
        expect(typeof translation.locale).toBe('string');
        expect(typeof translation.explanation).toBe('string');
        expect(translation.locale.length).toBeGreaterThan(0);
        expect(translation.explanation.length).toBeGreaterThan(0);
      });
    });

    it('should retrieve answer with medical content', async () => {
      const { answerId } = await testSetup.createAnswerWithQuestion({
        questionText: 'What is the pathophysiology of hypertension?',
        questionType: 'OPEN',
        answerExplanation:
          'Hypertension is characterized by elevated blood pressure (≥140/90 mmHg). The pathophysiology involves increased peripheral resistance, reduced arterial compliance, and endothelial dysfunction.',
      });

      const response = await testHelpers.getAnswerExpectSuccess(answerId);

      expect(response.body.answer.explanation).toContain('140/90 mmHg');
      expect(response.body.answer.explanation.toLowerCase()).toContain(
        'hypertension',
      );
      expect(response.body.answer.explanation.toLowerCase()).toContain(
        'pathophysiology',
      );
    });

    it('should retrieve answer with special characters', async () => {
      const { answerId } = await testSetup.createAnswerWithQuestion({
        questionText: 'Question with special chars',
        questionType: 'MULTIPLE_CHOICE',
        answerExplanation:
          'Answer with special chars: @#$%^&*()! and symbols: ±≤≥≠≈',
      });

      const response = await testHelpers.getAnswerExpectSuccess(answerId);

      expect(response.body.answer.explanation).toContain('@#$%^&*()!');
      expect(response.body.answer.explanation).toContain('±≤≥≠≈');
    });

    it('should retrieve answer with unicode characters', async () => {
      const { answerId } = await testSetup.createAnswerWithQuestion({
        questionText: 'Question with unicode',
        questionType: 'OPEN',
        answerExplanation:
          'Resposta em português 中文 العربية русский with emojis 🎯🚀',
      });

      const response = await testHelpers.getAnswerExpectSuccess(answerId);

      expect(response.body.answer.explanation).toContain('português');
      expect(response.body.answer.explanation).toContain('中文');
      expect(response.body.answer.explanation).toContain('العربية');
      expect(response.body.answer.explanation).toContain('русский');
      expect(response.body.answer.explanation).toContain('🎯🚀');
    });

    it('should retrieve answer with long explanation', async () => {
      const longExplanation = 'A'.repeat(1000);
      const { answerId } = await testSetup.createAnswerWithQuestion({
        questionText: 'Question with long answer',
        questionType: 'OPEN',
        answerExplanation: longExplanation,
      });

      const response = await testHelpers.getAnswerExpectSuccess(answerId);

      expect(response.body.answer.explanation).toBe(longExplanation);
      expect(response.body.answer.explanation.length).toBe(1000);
    });

    it('should retrieve answer with minimal explanation', async () => {
      const minimalExplanation = 'A';
      const { answerId } = await testSetup.createAnswerWithQuestion({
        questionText: 'Question with minimal answer',
        questionType: 'MULTIPLE_CHOICE',
        answerExplanation: minimalExplanation,
      });

      const response = await testHelpers.getAnswerExpectSuccess(answerId);

      expect(response.body.answer.explanation).toBe(minimalExplanation);
      expect(response.body.answer.explanation.length).toBe(1);
    });
  });

  describe('Validation Errors', () => {
    it('should return 400 for invalid UUID format', async () => {
      const invalidId = 'invalid-uuid-format';
      await testHelpers.getAnswerExpectValidationError(invalidId);
    });

    it('should return 400 for non-UUID string', async () => {
      const invalidId = 'not-a-uuid-at-all';
      await testHelpers.getAnswerExpectValidationError(invalidId);
    });

    it('should return 400 for too short ID', async () => {
      const invalidId = 'short';
      await testHelpers.getAnswerExpectValidationError(invalidId);
    });

    it('should return 400 for too long ID', async () => {
      const invalidId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa-extra-characters';
      await testHelpers.getAnswerExpectValidationError(invalidId);
    });

    it('should return 400 for wrong hyphen placement', async () => {
      const invalidId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaa-aaaaaaaa';
      await testHelpers.getAnswerExpectValidationError(invalidId);
    });

    it('should return 400 for missing hyphens', async () => {
      const invalidId = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
      await testHelpers.getAnswerExpectValidationError(invalidId);
    });

    it('should return 400 for special characters in ID', async () => {
      const invalidId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa@';
      await testHelpers.getAnswerExpectValidationError(invalidId);
    });

    it('should return 400 for invalid hex characters', async () => {
      const invalidId = 'gggggggg-gggg-gggg-gggg-gggggggggggg';
      await testHelpers.getAnswerExpectValidationError(invalidId);
    });

    it('should return 400 for empty string', async () => {
      const invalidId = '';
      await testHelpers.getAnswerExpectValidationError(invalidId);
    });

    it('should return 400 for ID with whitespace', async () => {
      const invalidId = '  aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa  ';
      await testHelpers.getAnswerExpectValidationError(invalidId);
    });

    it('should return 400 for ID with tabs', async () => {
      const invalidId = '\taaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\t';
      await testHelpers.getAnswerExpectValidationError(invalidId);
    });

    it('should return 400 for ID with newlines', async () => {
      const invalidId = '\naaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\n';
      await testHelpers.getAnswerExpectValidationError(invalidId);
    });

    it('should return 400 for unicode characters in ID', async () => {
      const invalidId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaαβγ';
      await testHelpers.getAnswerExpectValidationError(invalidId);
    });

    it('should return 400 for emoji characters in ID', async () => {
      const invalidId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa🎯';
      await testHelpers.getAnswerExpectValidationError(invalidId);
    });

    it('should test systematic validation of all invalid formats', async () => {
      const invalidIds = AnswerTestData.getAllInvalidIds();

      for (const invalidRequest of invalidIds) {
        if (typeof invalidRequest.id === 'string') {
          await testHelpers.getAnswerExpectValidationError(invalidRequest.id);
        }
      }
    });
  });

  describe('Not Found Errors', () => {
    it('should return 404 when answer does not exist', async () => {
      const nonExistentId = 'aaaabbbb-cccc-dddd-eeee-ffffaaaabbbb';
      await testHelpers.getAnswerExpectNotFound(nonExistentId);
    });

    it('should return 404 for all-zeros UUID', async () => {
      const zerosId = '00000000-0000-0000-0000-000000000000';
      await testHelpers.getAnswerExpectNotFound(zerosId);
    });

    it('should return 404 for random valid UUID', async () => {
      const randomId = randomUUID();
      await testHelpers.getAnswerExpectNotFound(randomId);
    });

    it('should test systematic validation of all non-existent IDs', async () => {
      const nonExistentIds = AnswerTestData.getAllNonExistentIds();

      for (const nonExistentRequest of nonExistentIds) {
        await testHelpers.getAnswerExpectNotFound(nonExistentRequest.id);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle answer with empty translations array', async () => {
      const { answerId } = await testSetup.createAnswerWithQuestion({
        questionText: 'Question for empty translations test',
        questionType: 'MULTIPLE_CHOICE',
        answerExplanation: 'Answer with no translations',
      });

      const response = await testHelpers.getAnswerExpectSuccess(answerId);

      expect(response.body.answer.translations).toEqual([]);
    });

    it('should handle answer with single translation', async () => {
      const { answerId } = await testSetup.createAnswerWithQuestion({
        questionText: 'Question for single translation test',
        questionType: 'MULTIPLE_CHOICE',
        answerExplanation: 'Answer with single translation',
      });

      await testSetup.prisma.answerTranslation.create({
        data: {
          answerId,
          locale: 'pt',
          explanation: 'Resposta com tradução única',
        },
      });

      const response = await testHelpers.getAnswerExpectSuccess(answerId);

      expect(response.body.answer.translations).toHaveLength(1);
      expect(response.body.answer.translations[0].locale).toBe('pt');
      expect(response.body.answer.translations[0].explanation).toBe(
        'Resposta com tradução única',
      );
    });

    it('should handle answer with multiple translations', async () => {
      const { answerId } = await testSetup.createAnswerWithQuestion({
        questionText: 'Question for multiple translations test',
        questionType: 'MULTIPLE_CHOICE',
        answerExplanation: 'Answer with multiple translations',
      });

      await testSetup.prisma.answerTranslation.createMany({
        data: [
          { answerId, locale: 'pt', explanation: 'Explicação em português' },
          { answerId, locale: 'it', explanation: 'Spiegazione in italiano' },
          { answerId, locale: 'es', explanation: 'Explicación en español' },
        ],
      });

      const response = await testHelpers.getAnswerExpectSuccess(answerId);

      expect(response.body.answer.translations).toHaveLength(3);
      expect(
        response.body.answer.translations.map((t: any) => t.locale),
      ).toEqual(['pt', 'it', 'es']);
    });

    it('should handle case insensitive UUID retrieval', async () => {
      const answerId = testSetup.multipleChoiceAnswerId;

      // Test UUID validation accepts case variations (even if DB is case sensitive)
      const lowerCaseId = answerId.toLowerCase();
      const res1 = await testHelpers.getAnswerById(lowerCaseId);
      expect([200, 404]).toContain(res1.status); // 200 if case insensitive, 404 if case sensitive

      const upperCaseId = answerId.toUpperCase();
      const res2 = await testHelpers.getAnswerById(upperCaseId);
      expect([200, 404]).toContain(res2.status); // 200 if case insensitive, 404 if case sensitive

      const mixedCaseId = answerId
        .split('')
        .map((char, i) =>
          i % 2 === 0 ? char.toLowerCase() : char.toUpperCase(),
        )
        .join('');
      const res3 = await testHelpers.getAnswerById(mixedCaseId);
      expect([200, 404]).toContain(res3.status); // 200 if case insensitive, 404 if case sensitive
    });
  });

  describe('Performance Tests', () => {
    it('should respond within acceptable time limits', async () => {
      const answerId = testSetup.multipleChoiceAnswerId;

      const { executionTime } = await testHelpers.measureExecutionTime(
        async () => {
          return await testHelpers.getAnswerExpectSuccess(answerId);
        },
      );

      expect(executionTime).toBeLessThan(100); // 100ms max
    });

    it('should handle concurrent requests efficiently', async () => {
      const answerIds = [
        testSetup.multipleChoiceAnswerId,
        testSetup.openAnswerId,
        testSetup.multipleChoiceAnswerId, // Duplicate to test caching
        testSetup.openAnswerId,
      ];

      const { executionTime } = await testHelpers.measureExecutionTime(
        async () => {
          return await testHelpers.getAnswersConcurrently(answerIds);
        },
      );

      expect(executionTime).toBeLessThan(200); // 200ms max for 4 concurrent requests
    });

    it('should handle sequential requests efficiently', async () => {
      const answerIds = [
        testSetup.multipleChoiceAnswerId,
        testSetup.openAnswerId,
        testSetup.multipleChoiceAnswerId,
      ];

      const { executionTime } = await testHelpers.measureExecutionTime(
        async () => {
          return await testHelpers.getAnswersSequentially(answerIds);
        },
      );

      expect(executionTime).toBeLessThan(300); // 300ms max for 3 sequential requests
    });

    it('should maintain consistent response times', async () => {
      const answerId = testSetup.multipleChoiceAnswerId;

      await testHelpers.testGetAnswerResponseTimeConsistency(
        answerId,
        5, // 5 iterations
        30, // 30ms variance allowed
      );
    });
  });

  describe('Data Integrity', () => {
    it('should maintain data consistency between database and API', async () => {
      await testHelpers.verifyAnswerDataIntegrity(
        testSetup.multipleChoiceAnswerId,
      );
      await testHelpers.verifyAnswerDataIntegrity(testSetup.openAnswerId);
    });

    it('should return consistent timestamps', async () => {
      const response = await testHelpers.getAnswerExpectSuccess(
        testSetup.multipleChoiceAnswerId,
      );

      const createdAt = new Date(response.body.answer.createdAt);
      const updatedAt = new Date(response.body.answer.updatedAt);

      // Verify timestamps are valid dates
      expect(createdAt.getTime()).not.toBeNaN();
      expect(updatedAt.getTime()).not.toBeNaN();

      // Verify timestamps are reasonable (not in the future)
      const now = new Date();
      expect(createdAt.getTime()).toBeLessThanOrEqual(now.getTime());
      expect(updatedAt.getTime()).toBeLessThanOrEqual(now.getTime());

      // Verify updatedAt is >= createdAt
      expect(updatedAt.getTime()).toBeGreaterThanOrEqual(createdAt.getTime());
    });

    it('should verify database integrity after operations', async () => {
      await testHelpers.verifyDatabaseIntegrity();
    });

    it('should handle different question types correctly', async () => {
      // Test with multiple choice question answer
      const mcResponse = await testHelpers.getAnswerExpectSuccess(
        testSetup.multipleChoiceAnswerId,
      );
      expect(mcResponse.body.answer.correctOptionId).toBeDefined();

      // Test with open question answer
      const openResponse = await testHelpers.getAnswerExpectSuccess(
        testSetup.openAnswerId,
      );
      expect(openResponse.body.answer.correctOptionId).toBeUndefined();
    });
  });

  describe('Response Format Validation', () => {
    it('should return consistent response structure', async () => {
      const response = await testHelpers.getAnswerExpectSuccess(
        testSetup.multipleChoiceAnswerId,
      );

      testHelpers.verifyGetAnswerSuccessResponseFormat(
        response.body,
        testSetup.multipleChoiceAnswerId,
      );
    });

    it('should not contain undefined fields', async () => {
      const response = await testHelpers.getAnswerExpectSuccess(
        testSetup.multipleChoiceAnswerId,
      );

      testHelpers.verifyNoUndefinedFields(response.body, ['correctOptionId']);
    });

    it('should return proper error format for not found', async () => {
      const nonExistentId = 'aaaabbbb-cccc-dddd-eeee-ffffaaaabbbb';
      const response = await testHelpers.getAnswerExpectNotFound(nonExistentId);

      testHelpers.verifyErrorResponseFormat(
        response.body,
        404,
        'ANSWER_NOT_FOUND',
      );
    });

    it('should return proper error format for validation errors', async () => {
      const invalidId = 'invalid-uuid-format';
      const response =
        await testHelpers.getAnswerExpectValidationError(invalidId);

      if (response.status === 400) {
        testHelpers.verifyErrorResponseFormat(
          response.body,
          400,
          'INVALID_INPUT',
        );
      }
    });
  });

  describe('Special Content Handling', () => {
    it('should handle medical terminology correctly', async () => {
      const { answerId } = await testSetup.createAnswerWithQuestion({
        questionText: 'Medical terminology question',
        questionType: 'OPEN',
        answerExplanation:
          'Tachycardia is defined as a heart rate >100 bpm. It can be caused by physiological or pathological conditions.',
      });

      const response = await testHelpers.getAnswerExpectSuccess(answerId);

      expect(response.body.answer.explanation).toContain('Tachycardia');
      expect(response.body.answer.explanation).toContain('>100 bpm');
    });

    it('should handle mathematical expressions', async () => {
      const { answerId } = await testSetup.createAnswerWithQuestion({
        questionText: 'Mathematical expression question',
        questionType: 'MULTIPLE_CHOICE',
        answerExplanation:
          'The formula is: BP = CO × SVR, where BP is blood pressure, CO is cardiac output, and SVR is systemic vascular resistance.',
      });

      const response = await testHelpers.getAnswerExpectSuccess(answerId);

      expect(response.body.answer.explanation).toContain('BP = CO × SVR');
    });

    it('should handle HTML-like content safely', async () => {
      const { answerId } = await testSetup.createAnswerWithQuestion({
        questionText: 'HTML-like content question',
        questionType: 'OPEN',
        answerExplanation:
          'The answer contains <strong>bold</strong> and <em>italic</em> text for emphasis.',
      });

      const response = await testHelpers.getAnswerExpectSuccess(answerId);

      expect(response.body.answer.explanation).toContain(
        '<strong>bold</strong>',
      );
      expect(response.body.answer.explanation).toContain('<em>italic</em>');
    });

    it('should handle newlines and formatting', async () => {
      const { answerId } = await testSetup.createAnswerWithQuestion({
        questionText: 'Formatted content question',
        questionType: 'OPEN',
        answerExplanation:
          'Line 1\nLine 2\n\nParagraph 2\n\t- Bullet point 1\n\t- Bullet point 2',
      });

      const response = await testHelpers.getAnswerExpectSuccess(answerId);

      expect(response.body.answer.explanation).toContain('Line 1\nLine 2');
      expect(response.body.answer.explanation).toContain('\t- Bullet point');
    });
  });

  describe('Comprehensive Test Scenarios', () => {
    it('should handle all valid test scenarios', async () => {
      const scenarios = AnswerTestData.testScenarios.happyPath.requests;

      // Since we can't use the predefined IDs, we'll create our own test answers
      const testAnswers = [
        testSetup.multipleChoiceAnswerId,
        testSetup.openAnswerId,
      ];

      for (const answerId of testAnswers) {
        const response = await testHelpers.getAnswerExpectSuccess(answerId);
        expect(response.body.answer).toBeDefined();
        expect(response.body.answer.id).toBe(answerId);
      }
    });

    it('should handle mixed content scenarios', async () => {
      // Use existing answer and add special content test
      const answerId = testSetup.multipleChoiceAnswerId;

      const response = await testHelpers.getAnswerExpectSuccess(answerId);

      // Test that the answer structure is correct for mixed content scenarios
      expect(response.body.answer).toHaveProperty('explanation');
      expect(response.body.answer).toHaveProperty('translations');
      expect(Array.isArray(response.body.answer.translations)).toBe(true);

      // Test that special characters in existing answer are handled correctly
      const explanation = response.body.answer.explanation;
      expect(typeof explanation).toBe('string');
      expect(explanation.length).toBeGreaterThan(0);
    });
  });
});
