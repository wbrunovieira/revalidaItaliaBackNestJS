// test/e2e/questions/create-question.e2e.spec.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { QuestionTestSetup } from './shared/question-test-setup';
import { QuestionTestData } from './shared/question-test-data';
import { QuestionTestHelpers } from './shared/question-test-helpers';

describe('Questions E2E - Create', () => {
  let testSetup: QuestionTestSetup;
  let testHelpers: QuestionTestHelpers;

  beforeAll(async () => {
    testSetup = new QuestionTestSetup();
    await testSetup.initialize();
    testHelpers = new QuestionTestHelpers(testSetup);
  });

  afterAll(async () => {
    await testSetup.teardown();
  });

  beforeEach(async () => {
    await testSetup.setupTestData();
  });

  describe('Success Cases by Assessment Type', () => {
    it('should create MULTIPLE_CHOICE question for QUIZ assessment', async () => {
      const payload = QuestionTestData.validPayloads.quizMultipleChoice(
        testSetup.quizAssessmentId,
      );

      const response = await testHelpers.createQuestionExpectSuccess(payload);

      testHelpers.verifySuccessResponseFormat(
        response.body,
        payload.text,
        'MULTIPLE_CHOICE',
      );

      // Verify in database
      await testHelpers.verifyQuestionSaved(response.body.question.id, {
        text: payload.text,
        type: 'MULTIPLE_CHOICE',
        assessmentId: testSetup.quizAssessmentId,
      });
    });

    it('should create MULTIPLE_CHOICE question for SIMULADO assessment', async () => {
      const payload = QuestionTestData.validPayloads.simuladoMultipleChoice(
        testSetup.simuladoAssessmentId,
      );

      const response = await testHelpers.createQuestionExpectSuccess(payload);

      testHelpers.verifySuccessResponseFormat(
        response.body,
        payload.text,
        'MULTIPLE_CHOICE',
      );

      await testHelpers.verifyQuestionSaved(response.body.question.id, {
        text: payload.text,
        type: 'MULTIPLE_CHOICE',
        assessmentId: testSetup.simuladoAssessmentId,
      });
    });

    it('should create OPEN question for PROVA_ABERTA assessment', async () => {
      const payload = QuestionTestData.validPayloads.provaAbertaOpen(
        testSetup.provaAbertaAssessmentId,
      );

      const response = await testHelpers.createQuestionExpectSuccess(payload);

      testHelpers.verifySuccessResponseFormat(
        response.body,
        payload.text,
        'OPEN',
      );

      await testHelpers.verifyQuestionSaved(response.body.question.id, {
        text: payload.text,
        type: 'OPEN',
        assessmentId: testSetup.provaAbertaAssessmentId,
      });
    });

    it('should create question with argument for SIMULADO assessment', async () => {
      const payload = QuestionTestData.validPayloads.simuladoWithArgument(
        testSetup.simuladoAssessmentId,
        testSetup.argumentId,
      );

      const response = await testHelpers.createQuestionExpectSuccess(payload);

      expect(response.body.question.argumentId).toBe(testSetup.argumentId);

      await testHelpers.verifyQuestionArgumentRelationship(
        response.body.question.id,
        testSetup.argumentId,
      );
    });

    it('should create question without argument', async () => {
      const payload = QuestionTestData.validPayloads.quizMultipleChoice(
        testSetup.quizAssessmentId,
      );

      const response = await testHelpers.createQuestionExpectSuccess(payload);

      expect(response.body.question.argumentId).toBeUndefined();

      const savedQuestion = await testSetup.findQuestionById(
        response.body.question.id,
      );
      expect(savedQuestion?.argumentId).toBeNull();
    });
  });

  describe('Question Type Business Rules', () => {
    it('should reject OPEN question for QUIZ assessment', async () => {
      const payload = QuestionTestData.typeMismatchScenarios.quizWithOpen(
        testSetup.quizAssessmentId,
      );

      await testHelpers.createQuestionExpectTypeMismatch(payload);

      // Verify not saved in database
      await testHelpers.verifyQuestionNotSaved(
        payload.text,
        testSetup.quizAssessmentId,
      );
    });

    it('should reject OPEN question for SIMULADO assessment', async () => {
      const payload = QuestionTestData.typeMismatchScenarios.simuladoWithOpen(
        testSetup.simuladoAssessmentId,
      );

      await testHelpers.createQuestionExpectTypeMismatch(payload);

      await testHelpers.verifyQuestionNotSaved(
        payload.text,
        testSetup.simuladoAssessmentId,
      );
    });

    it('should reject MULTIPLE_CHOICE question for PROVA_ABERTA assessment', async () => {
      const payload =
        QuestionTestData.typeMismatchScenarios.provaAbertaWithMultipleChoice(
          testSetup.provaAbertaAssessmentId,
        );

      await testHelpers.createQuestionExpectTypeMismatch(payload);

      await testHelpers.verifyQuestionNotSaved(
        payload.text,
        testSetup.provaAbertaAssessmentId,
      );
    });

    it('should enforce type rules across all assessment types', async () => {
      await testHelpers.testAllAssessmentTypeScenarios();
    });
  });

  describe('Validation Errors', () => {
    it('should reject question with text too short', async () => {
      const payload = QuestionTestData.invalidPayloads.textTooShort(
        testSetup.quizAssessmentId,
      );

      await testHelpers.createQuestionExpectValidationError(payload);
    });

    it('should reject question with text too long', async () => {
      const payload = QuestionTestData.invalidPayloads.textTooLong(
        testSetup.quizAssessmentId,
      );

      await testHelpers.createQuestionExpectValidationError(payload);
    });

    it('should reject question with empty text', async () => {
      const payload = QuestionTestData.invalidPayloads.emptyText(
        testSetup.quizAssessmentId,
      );

      await testHelpers.createQuestionExpectValidationError(payload);
    });

    it('should reject question with whitespace-only text', async () => {
      const payload = QuestionTestData.invalidPayloads.whitespaceText(
        testSetup.quizAssessmentId,
      );

      await testHelpers.createQuestionExpectValidationError(payload);
    });

    it('should reject question with invalid type', async () => {
      const payload = QuestionTestData.invalidPayloads.invalidType(
        testSetup.quizAssessmentId,
      );

      await testHelpers.createQuestionExpectValidationError(payload);
    });

    it('should reject question with missing type', async () => {
      const payload = QuestionTestData.invalidPayloads.missingType(
        testSetup.quizAssessmentId,
      );

      await testHelpers.createQuestionExpectValidationError(payload);
    });

    it('should reject question with invalid assessmentId UUID', async () => {
      const payload = QuestionTestData.invalidPayloads.invalidAssessmentId();

      await testHelpers.createQuestionExpectValidationError(payload);
    });

    it('should reject question with missing assessmentId', async () => {
      const payload = QuestionTestData.invalidPayloads.missingAssessmentId();

      await testHelpers.createQuestionExpectValidationError(payload);
    });

    it('should reject question with invalid argumentId UUID', async () => {
      const payload = QuestionTestData.invalidPayloads.invalidArgumentId(
        testSetup.quizAssessmentId,
      );

      await testHelpers.createQuestionExpectValidationError(payload);
    });

    it('should reject question with multiple validation errors', async () => {
      const payload = QuestionTestData.invalidPayloads.multipleErrors();

      const response =
        await testHelpers.createQuestionExpectValidationError(payload);

      // Should have multiple error messages
      expect(response.body.message).toBeDefined();
      // Message could be a string or array of strings
      if (Array.isArray(response.body.message)) {
        expect(response.body.message.length).toBeGreaterThan(1);
      } else if (response.body.details) {
        expect(Array.isArray(response.body.details)).toBe(true);
        expect(response.body.details.length).toBeGreaterThan(1);
      }
    });

    it('should accept extra fields in payload (whitelist behavior)', async () => {
      const payload = QuestionTestData.invalidPayloads.extraFields(
        testSetup.quizAssessmentId,
      );

      const response = await testHelpers.createQuestion(payload);

      // With whitelist: true, extra fields are ignored, not rejected
      expect(response.status).toBe(201);
      expect(response.body.question).toBeDefined();
      // Verify extra fields are not saved
      expect(response.body.question).not.toHaveProperty('extraField');
      expect(response.body.question).not.toHaveProperty('anotherField');
    });
  });

  describe('Business Logic Errors', () => {
    it('should reject duplicate question in same assessment', async () => {
      const { first, second } = QuestionTestData.getDuplicateScenario(
        testSetup.quizAssessmentId,
      );

      // Create first question
      await testHelpers.createQuestionExpectSuccess(first);

      // Try to create duplicate
      await testHelpers.createQuestionExpectDuplicate(second);
    });

    it('should handle case insensitive duplicate detection', async () => {
      const { first, second } =
        QuestionTestData.getCaseInsensitiveDuplicateScenario(
          testSetup.quizAssessmentId,
        );

      await testHelpers.createQuestionExpectSuccess(first);
      await testHelpers.createQuestionExpectDuplicate(second);
    });

    it('should allow same text in different assessments', async () => {
      const { first, second } = QuestionTestData.getDifferentAssessmentScenario(
        testSetup.quizAssessmentId,
        testSetup.simuladoAssessmentId,
      );

      // Both should succeed
      await testHelpers.createQuestionExpectSuccess(first);
      await testHelpers.createQuestionExpectSuccess(second);

      // Verify both are saved
      const quizQuestions = await testSetup.findQuestionsByAssessmentId(
        testSetup.quizAssessmentId,
      );
      const simuladoQuestions = await testSetup.findQuestionsByAssessmentId(
        testSetup.simuladoAssessmentId,
      );

      expect(quizQuestions).toHaveLength(1);
      expect(simuladoQuestions).toHaveLength(1);
    });

    it('should reject question for non-existent assessment', async () => {
      await testHelpers.createQuestionWithNonExistentAssessment(
        'MULTIPLE_CHOICE',
      );
    });

    it('should reject question for non-existent argument', async () => {
      await testHelpers.createQuestionWithNonExistentArgument(
        testSetup.quizAssessmentId,
        'MULTIPLE_CHOICE',
      );
    });
  });

  describe('Edge Cases and Text Validation', () => {
    it('should handle minimum text length', async () => {
      const payload = QuestionTestData.validPayloads.minLength(
        testSetup.quizAssessmentId,
      );

      const response = await testHelpers.createQuestionExpectSuccess(payload);

      expect(response.body.question.text).toBe(payload.text);
      expect(response.body.question.text.length).toBe(10);
    });

    it('should handle maximum text length', async () => {
      const payload = QuestionTestData.validPayloads.maxLength(
        testSetup.quizAssessmentId,
      );

      const response = await testHelpers.createQuestionExpectSuccess(payload);

      expect(response.body.question.text.length).toBe(1000);
    });

    it('should handle special characters', async () => {
      const payload = QuestionTestData.validPayloads.specialChars(
        testSetup.quizAssessmentId,
      );

      const response = await testHelpers.createQuestionExpectSuccess(payload);

      testHelpers.verifyTextNormalization(
        payload.text,
        response.body.question.text,
      );
    });

    it('should handle unicode characters and emojis', async () => {
      const payload = QuestionTestData.validPayloads.unicode(
        testSetup.provaAbertaAssessmentId,
      );

      const response = await testHelpers.createQuestionExpectSuccess(payload);

      expect(response.body.question.text).toContain('中文');
      expect(response.body.question.text).toContain('🎯');
    });

    it('should handle newlines and formatting', async () => {
      const payload = QuestionTestData.validPayloads.withNewlines(
        testSetup.provaAbertaAssessmentId,
      );

      const response = await testHelpers.createQuestionExpectSuccess(payload);

      expect(response.body.question.text).toContain('\n');
      expect(response.body.question.text).toContain('\t');
    });

    it('should handle mixed whitespace', async () => {
      const payload = QuestionTestData.validPayloads.mixedWhitespace(
        testSetup.quizAssessmentId,
      );

      const response = await testHelpers.createQuestionExpectSuccess(payload);

      // Text should be preserved as-is
      testHelpers.verifyTextNormalization(
        payload.text,
        response.body.question.text,
      );
    });
  });

  describe('Medical Context Scenarios', () => {
    it('should handle clinical case questions', async () => {
      const payload = QuestionTestData.validPayloads.clinicalCase(
        testSetup.provaAbertaAssessmentId,
      );

      const response = await testHelpers.createQuestionExpectSuccess(payload);

      expect(response.body.question.text).toContain('dyspnea');
      expect(response.body.question.text).toContain('differential diagnosis');
      expect(response.body.question.type).toBe('OPEN');
    });

    it('should handle pharmacology questions', async () => {
      const payload = QuestionTestData.validPayloads.pharmacology(
        testSetup.quizAssessmentId,
      );

      const response = await testHelpers.createQuestionExpectSuccess(payload);

      expect(response.body.question.type).toBe('MULTIPLE_CHOICE');
    });

    it('should handle anatomy questions', async () => {
      const payload = QuestionTestData.validPayloads.anatomy(
        testSetup.quizAssessmentId,
      );

      const response = await testHelpers.createQuestionExpectSuccess(payload);

      expect(response.body.question.text).toContain('anatomical');
      expect(response.body.question.type).toBe('MULTIPLE_CHOICE');
    });

    it('should handle mathematical calculations', async () => {
      const payload = QuestionTestData.validPayloads.mathematical(
        testSetup.provaAbertaAssessmentId,
      );

      const response = await testHelpers.createQuestionExpectSuccess(payload);

      expect(response.body.question.text).toContain('Calculate');
      expect(response.body.question.type).toBe('OPEN');
    });

    it('should handle medical specialty contexts', async () => {
      const cardiologyPayload = QuestionTestData.medicalContexts.cardiology(
        testSetup.quizAssessmentId,
      );
      const respiratoryPayload = QuestionTestData.medicalContexts.respiratory(
        testSetup.provaAbertaAssessmentId,
      );

      await testHelpers.createQuestionExpectSuccess(cardiologyPayload);
      await testHelpers.createQuestionExpectSuccess(respiratoryPayload);

      await testHelpers.verifyQuestionCount(2);
    });
  });

  describe('Multiple Arguments Scenario', () => {
    it('should create multiple questions for different arguments in same assessment', async () => {
      // Create additional arguments
      const argument2Id = await testSetup.createTestArgument({
        title: 'Second Test Argument',
        assessmentId: testSetup.simuladoAssessmentId,
      });

      const argument3Id = await testSetup.createTestArgument({
        title: 'Third Test Argument',
        assessmentId: testSetup.simuladoAssessmentId,
      });

      // Create questions for each argument
      const results = await testHelpers.createQuestionsForMultipleArguments(
        testSetup.simuladoAssessmentId,
        [testSetup.argumentId, argument2Id, argument3Id],
        2, // 2 questions per argument
      );

      expect(results).toHaveLength(6); // 3 arguments × 2 questions each

      // Verify distribution
      const arg1Questions = await testSetup.findQuestionsByArgumentId(
        testSetup.argumentId,
      );
      const arg2Questions =
        await testSetup.findQuestionsByArgumentId(argument2Id);
      const arg3Questions =
        await testSetup.findQuestionsByArgumentId(argument3Id);

      expect(arg1Questions).toHaveLength(2);
      expect(arg2Questions).toHaveLength(2);
      expect(arg3Questions).toHaveLength(2);
    });

    it('should handle simulado with 5 arguments and 5 questions each', async () => {
      // Create 5 arguments
      const argumentIds: string[] = [];
      for (let i = 1; i <= 5; i++) {
        const argumentId = await testSetup.createTestArgument({
          title: `Argument ${i} for Simulado`,
          assessmentId: testSetup.simuladoAssessmentId,
        });
        argumentIds.push(argumentId);
      }

      // Create 5 questions for each argument
      const allResults: any[] = [];
      for (const argumentId of argumentIds) {
        for (let i = 1; i <= 5; i++) {
          const result = await testHelpers.createQuestionExpectSuccess({
            text: `Question ${i} for argument ${argumentId} with sufficient length`,
            type: 'MULTIPLE_CHOICE',
            assessmentId: testSetup.simuladoAssessmentId,
            argumentId,
          });
          allResults.push(result);
        }
      }

      expect(allResults).toHaveLength(25); // 5 arguments × 5 questions each

      // Verify total question count
      await testHelpers.verifyQuestionCount(25);

      // Verify each argument has exactly 5 questions
      for (const argumentId of argumentIds) {
        const questions = await testSetup.findQuestionsByArgumentId(argumentId);
        expect(questions).toHaveLength(5);
      }
    });
  });

  describe('Performance Tests', () => {
    it('should handle question creation within reasonable time', async () => {
      const payload = QuestionTestData.validPayloads.quizMultipleChoice(
        testSetup.quizAssessmentId,
      );

      await testHelpers.testPerformance(
        'Single Question Creation',
        async () => {
          return await testHelpers.createQuestionExpectSuccess(payload);
        },
        1000, // Should complete in < 1 second
      );
    });

    it('should handle sequential question creation efficiently', async () => {
      const payloads = QuestionTestData.performance.sequential(
        10,
        testSetup.quizAssessmentId,
      );

      await testHelpers.testPerformance(
        'Sequential Question Creation (10 questions)',
        async () => {
          return await testHelpers.createQuestionsSequentially(payloads);
        },
        5000, // Should complete in < 5 seconds
      );
    });

    it('should handle concurrent question creation', async () => {
      const payloads = QuestionTestData.performance.concurrent(
        5,
        testSetup.quizAssessmentId,
      );

      await testHelpers.testPerformance(
        'Concurrent Question Creation (5 questions)',
        async () => {
          return await testHelpers.createQuestionsConcurrently(payloads);
        },
        3000, // Should complete in < 3 seconds
      );

      // Verify all were created
      await testHelpers.verifyQuestionCount(5);
    });
  });

  describe('Database Integrity', () => {
    it('should maintain referential integrity', async () => {
      // Create questions with various relationships
      await testHelpers.createQuestionExpectSuccess({
        text: 'Question without argument',
        type: 'MULTIPLE_CHOICE',
        assessmentId: testSetup.quizAssessmentId,
      });

      await testHelpers.createQuestionExpectSuccess({
        text: 'Question with argument',
        type: 'MULTIPLE_CHOICE',
        assessmentId: testSetup.simuladoAssessmentId,
        argumentId: testSetup.argumentId,
      });

      await testHelpers.verifyDatabaseIntegrity();
    });

    it('should generate unique IDs for all questions', async () => {
      const responses = await testHelpers.createQuestionsConcurrently([
        QuestionTestData.validPayloads.quizMultipleChoice(
          testSetup.quizAssessmentId,
        ),
        QuestionTestData.validPayloads.simuladoMultipleChoice(
          testSetup.simuladoAssessmentId,
        ),
        QuestionTestData.validPayloads.provaAbertaOpen(
          testSetup.provaAbertaAssessmentId,
        ),
      ]);

      const ids = responses.map((res) => res.body.question.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should handle timestamps correctly', async () => {
      const beforeCreation = new Date();

      const response = await testHelpers.createQuestionExpectSuccess(
        QuestionTestData.validPayloads.quizMultipleChoice(
          testSetup.quizAssessmentId,
        ),
      );

      const afterCreation = new Date();
      const createdAt = new Date(response.body.question.createdAt);
      const updatedAt = new Date(response.body.question.updatedAt);

      expect(createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreation.getTime(),
      );
      expect(createdAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
      expect(updatedAt.getTime()).toBe(createdAt.getTime());
    });
  });

  describe('Response Format Validation', () => {
    it('should return consistent response structure for all question types', async () => {
      const testCases = [
        {
          payload: QuestionTestData.validPayloads.quizMultipleChoice(
            testSetup.quizAssessmentId,
          ),
          expectedType: 'MULTIPLE_CHOICE',
        },
        {
          payload: QuestionTestData.validPayloads.provaAbertaOpen(
            testSetup.provaAbertaAssessmentId,
          ),
          expectedType: 'OPEN',
        },
      ];

      for (const testCase of testCases) {
        const response = await testHelpers.createQuestionExpectSuccess(
          testCase.payload,
        );

        testHelpers.verifySuccessResponseFormat(
          response.body,
          testCase.payload.text,
          testCase.expectedType,
        );

        testHelpers.verifyNoUndefinedFields(response.body);
      }
    });

    it('should include argumentId when provided', async () => {
      const payload = QuestionTestData.validPayloads.simuladoWithArgument(
        testSetup.simuladoAssessmentId,
        testSetup.argumentId,
      );

      const response = await testHelpers.createQuestionExpectSuccess(payload);

      expect(response.body.question).toHaveProperty(
        'argumentId',
        testSetup.argumentId,
      );
    });

    it('should not include argumentId when not provided', async () => {
      const payload = QuestionTestData.validPayloads.quizMultipleChoice(
        testSetup.quizAssessmentId,
      );

      const response = await testHelpers.createQuestionExpectSuccess(payload);

      expect(response.body.question.argumentId).toBeUndefined();
    });
  });
});
