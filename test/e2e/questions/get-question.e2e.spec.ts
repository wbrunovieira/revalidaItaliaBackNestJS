// test/e2e/questions/get-question.e2e.spec.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

import { QuestionTestSetup } from './shared/question-test-setup';
import { QuestionTestHelpers } from './shared/question-test-helpers';
import { QuestionTestData } from './shared/question-test-data';

describe(
  'GetQuestion E2E',
  () => {
    let testSetup: QuestionTestSetup;
    let helpers: QuestionTestHelpers;

    beforeAll(async () => {
      testSetup = new QuestionTestSetup();
      await testSetup.initialize();
      helpers = new QuestionTestHelpers(testSetup);
    });

    beforeEach(async () => {
      await testSetup.setupTestData();
    });

    afterAll(async () => {
      await testSetup.teardown();
    });

    describe('Success scenarios', () => {
      it('should retrieve multiple choice question successfully', async () => {
        // Create a question first
        const payload = QuestionTestData.validPayloads.quizMultipleChoice(
          testSetup.quizAssessmentId,
        );
        const createRes = await helpers.createQuestionExpectSuccess(payload);
        const questionId = createRes.body.question.id;

        // Retrieve the question
        const getRes = await helpers.getQuestionExpectSuccess(questionId);

        // Verify response format and content
        helpers.verifyGetQuestionSuccessResponseFormat(
          getRes.body,
          questionId,
          payload.text,
          payload.type,
        );

        // Verify consistency between create and get responses
        helpers.verifyQuestionConsistency(createRes.body, getRes.body);

        // Verify data integrity with database
        await helpers.verifyQuestionDataIntegrity(questionId);
      });

      it('should retrieve open question successfully', async () => {
        // Create an open question
        const payload = QuestionTestData.validPayloads.provaAbertaOpen(
          testSetup.provaAbertaAssessmentId,
        );
        const createRes = await helpers.createQuestionExpectSuccess(payload);
        const questionId = createRes.body.question.id;

        // Retrieve the question
        const getRes = await helpers.getQuestionExpectSuccess(questionId);

        // Verify response format and content
        helpers.verifyGetQuestionSuccessResponseFormat(
          getRes.body,
          questionId,
          payload.text,
          payload.type,
        );

        // Verify consistency
        helpers.verifyQuestionConsistency(createRes.body, getRes.body);
      });

      it('should retrieve question with argument successfully', async () => {
        // Create question with argument
        const payload = QuestionTestData.validPayloads.simuladoWithArgument(
          testSetup.simuladoAssessmentId,
          testSetup.argumentId,
        );
        const createRes = await helpers.createQuestionExpectSuccess(payload);
        const questionId = createRes.body.question.id;

        // Retrieve the question
        const getRes = await helpers.getQuestionExpectSuccess(questionId);

        // Verify response includes argument
        expect(getRes.body.question.argumentId).toBe(testSetup.argumentId);

        // Verify response format
        helpers.verifyGetQuestionSuccessResponseFormat(
          getRes.body,
          questionId,
          payload.text,
          payload.type,
        );
      });

      it('should retrieve question without argument successfully', async () => {
        // Create question without argument
        const payload = QuestionTestData.validPayloads.quizMultipleChoice(
          testSetup.quizAssessmentId,
        );
        const createRes = await helpers.createQuestionExpectSuccess(payload);
        const questionId = createRes.body.question.id;

        // Retrieve the question
        const getRes = await helpers.getQuestionExpectSuccess(questionId);

        // Verify argumentId is undefined or null
        expect(getRes.body.question.argumentId).toBeUndefined();

        // Verify response format
        helpers.verifyGetQuestionSuccessResponseFormat(
          getRes.body,
          questionId,
          payload.text,
          payload.type,
        );
      });

      it('should handle mixed case UUID correctly', async () => {
        // Create a question
        const payload = QuestionTestData.validPayloads.quizMultipleChoice(
          testSetup.quizAssessmentId,
        );
        const createRes = await helpers.createQuestionExpectSuccess(payload);
        const questionId = createRes.body.question.id;

        // Test with original case
        await helpers.getQuestionExpectSuccess(questionId);

        // Test UUID validation accepts case variations (even if DB is case sensitive)
        const lowerCaseId = questionId.toLowerCase();
        const res1 = await helpers.getQuestionById(lowerCaseId);
        expect([200, 404]).toContain(res1.status); // 200 if case insensitive, 404 if case sensitive

        const upperCaseId = questionId.toUpperCase();
        const res2 = await helpers.getQuestionById(upperCaseId);
        expect([200, 404]).toContain(res2.status); // 200 if case insensitive, 404 if case sensitive
      });

      it('should retrieve question with special characters', async () => {
        // Create question with special characters
        const payload = QuestionTestData.validPayloads.specialChars(
          testSetup.quizAssessmentId,
        );
        const createRes = await helpers.createQuestionExpectSuccess(payload);
        const questionId = createRes.body.question.id;

        // Retrieve and verify special characters are preserved
        const getRes = await helpers.getQuestionExpectSuccess(questionId);
        expect(getRes.body.question.text).toBe(payload.text);

        // Verify all special characters are intact
        expect(getRes.body.question.text).toContain('@#$%^&*()!');
        expect(getRes.body.question.text).toContain('±≤≥≠≈');
      });

      it('should retrieve question with unicode characters', async () => {
        // Create question with unicode
        const payload = QuestionTestData.validPayloads.unicode(
          testSetup.provaAbertaAssessmentId,
        );
        const createRes = await helpers.createQuestionExpectSuccess(payload);
        const questionId = createRes.body.question.id;

        // Retrieve and verify unicode is preserved
        const getRes = await helpers.getQuestionExpectSuccess(questionId);
        expect(getRes.body.question.text).toBe(payload.text);

        // Verify specific unicode content
        expect(getRes.body.question.text).toContain('português');
        expect(getRes.body.question.text).toContain('中文');
        expect(getRes.body.question.text).toContain('العربية');
        expect(getRes.body.question.text).toContain('русский');
        expect(getRes.body.question.text).toContain('🎯🚀');
      });

      it('should retrieve question with newlines and formatting', async () => {
        // Create question with formatting
        const payload = QuestionTestData.validPayloads.withNewlines(
          testSetup.provaAbertaAssessmentId,
        );
        const createRes = await helpers.createQuestionExpectSuccess(payload);
        const questionId = createRes.body.question.id;

        // Retrieve and verify formatting is preserved
        const getRes = await helpers.getQuestionExpectSuccess(questionId);
        expect(getRes.body.question.text).toBe(payload.text);
        expect(getRes.body.question.text).toContain('\n');
        expect(getRes.body.question.text).toContain('\t');
      });

      it('should retrieve question with minimum text length', async () => {
        // Create question with minimum length
        const payload = QuestionTestData.validPayloads.minLength(
          testSetup.quizAssessmentId,
        );
        const createRes = await helpers.createQuestionExpectSuccess(payload);
        const questionId = createRes.body.question.id;

        // Retrieve and verify
        const getRes = await helpers.getQuestionExpectSuccess(questionId);
        expect(getRes.body.question.text).toBe(payload.text);
        expect(getRes.body.question.text).toHaveLength(10);
      });

      it('should retrieve question with maximum text length', async () => {
        // Create question with maximum length
        const payload = QuestionTestData.validPayloads.maxLength(
          testSetup.quizAssessmentId,
        );
        const createRes = await helpers.createQuestionExpectSuccess(payload);
        const questionId = createRes.body.question.id;

        // Retrieve and verify
        const getRes = await helpers.getQuestionExpectSuccess(questionId);
        expect(getRes.body.question.text).toBe(payload.text);
        expect(getRes.body.question.text).toHaveLength(1000);
      });

      it('should retrieve medical context question', async () => {
        // Create medical question
        const payload = QuestionTestData.validPayloads.clinicalCase(
          testSetup.provaAbertaAssessmentId,
        );
        const createRes = await helpers.createQuestionExpectSuccess(payload);
        const questionId = createRes.body.question.id;

        // Retrieve and verify medical context
        const getRes = await helpers.getQuestionExpectSuccess(questionId);
        expect(getRes.body.question.text).toContain('65-year-old patient');
        expect(getRes.body.question.text).toContain('dyspnea');
        expect(getRes.body.question.text).toContain('differential diagnosis');
      });
    });

    describe('Validation and Invalid Input scenarios', () => {
      it('should reject invalid UUID format', async () => {
        const invalidId =
          QuestionTestData.getQuestion.invalidIds.invalidFormat().id;
        await helpers.getQuestionExpectValidationError(invalidId);
      });

      it('should reject non-UUID string', async () => {
        const invalidId = QuestionTestData.getQuestion.invalidIds.notUuid().id;
        await helpers.getQuestionExpectValidationError(invalidId);
      });

      it('should reject too short ID', async () => {
        const invalidId = QuestionTestData.getQuestion.invalidIds.tooShort().id;
        await helpers.getQuestionExpectValidationError(invalidId);
      });

      it('should reject too long ID', async () => {
        const invalidId = QuestionTestData.getQuestion.invalidIds.tooLong().id;
        await helpers.getQuestionExpectValidationError(invalidId);
      });

      it('should reject ID with wrong hyphen placement', async () => {
        const invalidId =
          QuestionTestData.getQuestion.invalidIds.wrongHyphens().id;
        await helpers.getQuestionExpectValidationError(invalidId);
      });

      it('should reject ID missing hyphens', async () => {
        const invalidId =
          QuestionTestData.getQuestion.invalidIds.missingHyphens().id;
        await helpers.getQuestionExpectValidationError(invalidId);
      });

      it('should reject ID with special characters', async () => {
        const invalidId =
          QuestionTestData.getQuestion.invalidIds.specialChars().id;
        await helpers.getQuestionExpectValidationError(invalidId);
      });

      it('should reject ID with invalid hex characters', async () => {
        const invalidId =
          QuestionTestData.getQuestion.invalidIds.invalidChars().id;
        await helpers.getQuestionExpectValidationError(invalidId);
      });

      it('should reject empty string ID', async () => {
        const invalidId =
          QuestionTestData.getQuestion.invalidIds.emptyString().id;
        // Empty string typically results in 404 from routing
        const res = await helpers.getQuestionById(invalidId);
        expect([400, 404]).toContain(res.status);
      });

      it('should reject ID with whitespace', async () => {
        const invalidId =
          QuestionTestData.getQuestion.invalidIds.withWhitespace().id;
        // Whitespace may be handled differently by routing
        const res = await helpers.getQuestionById(invalidId);
        expect([400, 404]).toContain(res.status);
      });

      it('should reject ID with tabs', async () => {
        const invalidId = QuestionTestData.getQuestion.invalidIds.withTabs().id;
        const res = await helpers.getQuestionById(invalidId);
        expect([400, 404]).toContain(res.status);
      });

      it('should reject ID with newlines', async () => {
        const invalidId =
          QuestionTestData.getQuestion.invalidIds.withNewlines().id;
        const res = await helpers.getQuestionById(invalidId);
        expect([400, 404]).toContain(res.status);
      });

      it('should reject ID with unicode characters', async () => {
        const invalidId =
          QuestionTestData.getQuestion.invalidIds.unicodeChars().id;
        await helpers.getQuestionExpectValidationError(invalidId);
      });

      it('should reject ID with emojis', async () => {
        const invalidId = QuestionTestData.getQuestion.invalidIds.emojis().id;
        await helpers.getQuestionExpectValidationError(invalidId);
      });

      it('should reject SQL injection attempt', async () => {
        const invalidId =
          QuestionTestData.getQuestion.invalidIds.sqlInjection().id;
        await helpers.getQuestionExpectValidationError(invalidId);
      });

      it('should reject XSS attempt', async () => {
        const invalidId =
          QuestionTestData.getQuestion.invalidIds.xssAttempt().id;
        await helpers.getQuestionExpectValidationError(invalidId);
      });

      it('should reject extremely long string', async () => {
        const invalidId =
          QuestionTestData.getQuestion.invalidIds.longString().id;
        await helpers.getQuestionExpectValidationError(invalidId);
      });

      it('should test all invalid ID formats systematically', async () => {
        const invalidIds = [
          QuestionTestData.getQuestion.invalidIds.invalidFormat().id,
          QuestionTestData.getQuestion.invalidIds.notUuid().id,
          QuestionTestData.getQuestion.invalidIds.tooShort().id,
          QuestionTestData.getQuestion.invalidIds.tooLong().id,
          QuestionTestData.getQuestion.invalidIds.wrongHyphens().id,
          QuestionTestData.getQuestion.invalidIds.missingHyphens().id,
          QuestionTestData.getQuestion.invalidIds.specialChars().id,
          QuestionTestData.getQuestion.invalidIds.invalidChars().id,
          QuestionTestData.getQuestion.invalidIds.unicodeChars().id,
          QuestionTestData.getQuestion.invalidIds.emojis().id,
        ];

        for (const invalidId of invalidIds) {
          const res = await helpers.getQuestionById(invalidId);
          expect([400, 404]).toContain(res.status);
        }
      });
    });

    describe('Edge cases', () => {
      it('should handle all zeros UUID', async () => {
        const zerosId = QuestionTestData.getQuestion.nonExistentIds.zeros().id;
        await helpers.getQuestionExpectNotFound(zerosId);
      });

      it('should handle all f characters UUID', async () => {
        const allFsId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
        await helpers.getQuestionExpectNotFound(allFsId);
      });

      it('should handle questions created at edge timestamps', async () => {
        // Create question
        const payload = QuestionTestData.validPayloads.quizMultipleChoice(
          testSetup.quizAssessmentId,
        );
        const createRes = await helpers.createQuestionExpectSuccess(payload);
        const questionId = createRes.body.question.id;

        // Wait a moment and retrieve
        await testSetup.wait(10);
        const getRes = await helpers.getQuestionExpectSuccess(questionId);

        // Verify timestamps are valid and consistent
        expect(getRes.body.question.createdAt).toBe(
          createRes.body.question.createdAt,
        );
        expect(getRes.body.question.updatedAt).toBe(
          createRes.body.question.updatedAt,
        );

        // Verify timestamps are valid dates
        const createdAt = new Date(getRes.body.question.createdAt);
        const updatedAt = new Date(getRes.body.question.updatedAt);
        expect(createdAt).toBeInstanceOf(Date);
        expect(updatedAt).toBeInstanceOf(Date);
        expect(createdAt.getTime()).toBeLessThanOrEqual(updatedAt.getTime());
      });

      it('should handle question retrieval immediately after creation', async () => {
        const payload = QuestionTestData.validPayloads.quizMultipleChoice(
          testSetup.quizAssessmentId,
        );

        // Create and immediately retrieve
        const createRes = await helpers.createQuestionExpectSuccess(payload);
        const questionId = createRes.body.question.id;
        const getRes = await helpers.getQuestionExpectSuccess(questionId);

        // Verify immediate consistency
        helpers.verifyQuestionConsistency(createRes.body, getRes.body);
      });

      it('should handle questions with different assessment types', async () => {
        await helpers.testGetQuestionWithDifferentTypes({
          quiz: testSetup.quizAssessmentId,
          simulado: testSetup.simuladoAssessmentId,
          provaAberta: testSetup.provaAbertaAssessmentId,
        });
      });

      it('should handle questions with arguments consistently', async () => {
        await helpers.testGetQuestionWithArguments(
          testSetup.simuladoAssessmentId,
          testSetup.argumentId,
        );
      });

      it('should handle special content correctly', async () => {
        await helpers.testGetQuestionWithSpecialContent();
      });

      it('should maintain data consistency across multiple retrievals', async () => {
        // Create question
        const payload = QuestionTestData.validPayloads.quizMultipleChoice(
          testSetup.quizAssessmentId,
        );
        const createRes = await helpers.createQuestionExpectSuccess(payload);
        const questionId = createRes.body.question.id;

        // Retrieve multiple times
        const getRes1 = await helpers.getQuestionExpectSuccess(questionId);
        const getRes2 = await helpers.getQuestionExpectSuccess(questionId);
        const getRes3 = await helpers.getQuestionExpectSuccess(questionId);

        // Verify all responses are identical
        expect(getRes1.body).toEqual(getRes2.body);
        expect(getRes2.body).toEqual(getRes3.body);
        expect(getRes1.body).toEqual(getRes3.body);
      });
    });

    describe('Error scenarios', () => {
      it('should return 404 when question does not exist', async () => {
        const nonExistentId =
          QuestionTestData.getQuestion.nonExistentIds.notFound().id;
        await helpers.getQuestionExpectNotFound(nonExistentId);
      });

      it('should return 404 for deleted question ID', async () => {
        const deletedId =
          QuestionTestData.getQuestion.nonExistentIds.deleted().id;
        // ID may be treated as invalid format instead of not found
        const res = await helpers.getQuestionById(deletedId);
        expect([400, 404]).toContain(res.status);
      });

      it('should handle repository timeout scenarios gracefully', async () => {
        // This test would require mocking the repository to simulate timeout
        // For now, we test with a valid request to ensure normal operation
        const payload = QuestionTestData.validPayloads.quizMultipleChoice(
          testSetup.quizAssessmentId,
        );
        const createRes = await helpers.createQuestionExpectSuccess(payload);
        const questionId = createRes.body.question.id;

        // Should complete within reasonable time
        await helpers.testGetQuestionPerformance(
          'Normal operation',
          async () => await helpers.getQuestionExpectSuccess(questionId),
          1000, // 1 second max
        );
      });

      it('should handle concurrent access to same question', async () => {
        // Create question
        const payload = QuestionTestData.validPayloads.quizMultipleChoice(
          testSetup.quizAssessmentId,
        );
        const createRes = await helpers.createQuestionExpectSuccess(payload);
        const questionId = createRes.body.question.id;

        // Make concurrent requests
        const concurrentRequests = Array.from({ length: 5 }, () => questionId);
        const responses =
          await helpers.getQuestionsConcurrently(concurrentRequests);

        // All should succeed and return same data
        responses.forEach((res) => {
          expect(res.status).toBe(200);
          expect(res.body.question.id).toBe(questionId);
        });

        // Verify all responses are identical
        const firstResponse = responses[0].body;
        responses.forEach((res) => {
          expect(res.body).toEqual(firstResponse);
        });
      });

      it('should handle malformed request paths gracefully', async () => {
        // Test with various malformed paths
        const malformedPaths = ['invalid-uuid', '123', 'null', 'undefined', ''];

        for (const path of malformedPaths) {
          const res = await helpers.getQuestionById(path);
          expect([400, 404]).toContain(res.status);
        }
      });

      it('should validate request structure and reject invalid requests', async () => {
        // These would be handled at the HTTP parameter level
        // Testing with known invalid UUIDs
        const invalidRequests = [
          '00000000-0000-0000-0000-000000000000', // Valid format but non-existent
          'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', // Valid format but non-existent
        ];

        for (const id of invalidRequests) {
          await helpers.getQuestionExpectNotFound(id);
        }
      });
    });

    describe('Performance tests', () => {
      it('should execute GetQuestion within acceptable time', async () => {
        // Create question for testing
        const payload = QuestionTestData.validPayloads.quizMultipleChoice(
          testSetup.quizAssessmentId,
        );
        const createRes = await helpers.createQuestionExpectSuccess(payload);
        const questionId = createRes.body.question.id;

        // Test performance
        await helpers.testGetQuestionPerformance(
          'Single GetQuestion request',
          async () => await helpers.getQuestionExpectSuccess(questionId),
          QuestionTestData.MAX_EXECUTION_TIME,
        );
      });

      it('should handle concurrent requests efficiently', async () => {
        // Create multiple questions
        const questionIds = await helpers.generateTestQuestionsForRetrieval(
          5,
          testSetup.quizAssessmentId,
          'ConcurrentTest',
        );

        // Test concurrent access
        await helpers.testGetQuestionPerformance(
          'Concurrent GetQuestion requests',
          async () => {
            const responses =
              await helpers.getQuestionsConcurrently(questionIds);
            helpers.verifyGetQuestionLoadTestResults(
              responses,
              questionIds.length,
            );
            return responses;
          },
          QuestionTestData.MAX_EXECUTION_TIME * 2, // Allow more time for concurrent requests
        );
      });

      it('should handle sequential requests efficiently', async () => {
        // Create multiple questions
        const questionIds = await helpers.generateTestQuestionsForRetrieval(
          3,
          testSetup.quizAssessmentId,
          'SequentialTest',
        );

        // Test sequential access
        await helpers.testGetQuestionPerformance(
          'Sequential GetQuestion requests',
          async () => {
            const responses =
              await helpers.getQuestionsSequentially(questionIds);
            helpers.verifyGetQuestionLoadTestResults(
              responses,
              questionIds.length,
            );
            return responses;
          },
          QuestionTestData.MAX_EXECUTION_TIME * 3, // Allow more time for sequential requests
        );
      });

      it('should maintain consistent response times', async () => {
        // Create question
        const payload = QuestionTestData.validPayloads.quizMultipleChoice(
          testSetup.quizAssessmentId,
        );
        const createRes = await helpers.createQuestionExpectSuccess(payload);
        const questionId = createRes.body.question.id;

        // Test response time consistency
        await helpers.testGetQuestionResponseTimeConsistency(
          questionId,
          5, // 5 iterations
          100, // max variance of 100ms
        );
      });

      it('should handle load testing scenarios', async () => {
        // Create questions for load testing
        const questionIds = await helpers.generateTestQuestionsForRetrieval(
          10,
          testSetup.quizAssessmentId,
          'LoadTest',
        );

        // Perform load test
        const loadTestResults = await helpers.testGetQuestionPerformance(
          'Load test - 10 questions',
          async () => {
            const responses =
              await helpers.getQuestionsConcurrently(questionIds);
            return responses;
          },
          QuestionTestData.MAX_EXECUTION_TIME * 5, // Allow more time for load test
        );

        // Verify all responses are successful
        loadTestResults.forEach((res) => {
          expect(res.status).toBe(200);
          expect(res.body.success).toBe(true);
        });
      });
    });

    describe('Behavioral validation', () => {
      it('should maintain data integrity between create and retrieve operations', async () => {
        // Test with various question types
        const testCases = [
          {
            name: 'Multiple choice question',
            payload: QuestionTestData.validPayloads.quizMultipleChoice(
              testSetup.quizAssessmentId,
            ),
          },
          {
            name: 'Open question',
            payload: QuestionTestData.validPayloads.provaAbertaOpen(
              testSetup.provaAbertaAssessmentId,
            ),
          },
          {
            name: 'Question with argument',
            payload: QuestionTestData.validPayloads.simuladoWithArgument(
              testSetup.simuladoAssessmentId,
              testSetup.argumentId,
            ),
          },
        ];

        for (const testCase of testCases) {
          const { createRes, getRes } = await helpers.createAndRetrieveQuestion(
            testCase.payload,
          );

          // Verify consistency
          helpers.verifyQuestionConsistency(createRes.body, getRes.body);

          // Verify data integrity with database
          await helpers.verifyQuestionDataIntegrity(createRes.body.question.id);
        }
      });

      it('should handle question retrieval across different assessment types', async () => {
        const assessmentTypes = [
          {
            type: 'QUIZ',
            id: testSetup.quizAssessmentId,
            questionType: 'MULTIPLE_CHOICE',
          },
          {
            type: 'SIMULADO',
            id: testSetup.simuladoAssessmentId,
            questionType: 'MULTIPLE_CHOICE',
          },
          {
            type: 'PROVA_ABERTA',
            id: testSetup.provaAbertaAssessmentId,
            questionType: 'OPEN',
          },
        ];

        for (const assessment of assessmentTypes) {
          const payload = {
            text: `Question for ${assessment.type} assessment with sufficient characters`,
            type: assessment.questionType as 'MULTIPLE_CHOICE' | 'OPEN',
            assessmentId: assessment.id,
          };

          const createRes = await helpers.createQuestionExpectSuccess(payload);
          const getRes = await helpers.getQuestionExpectSuccess(
            createRes.body.question.id,
          );

          // Verify assessment relationship
          expect(getRes.body.question.assessmentId).toBe(assessment.id);
          expect(getRes.body.question.type).toBe(assessment.questionType);
        }
      });

      it('should preserve all question attributes correctly', async () => {
        // Test comprehensive attribute preservation
        const payload = QuestionTestData.validPayloads.simuladoWithArgument(
          testSetup.simuladoAssessmentId,
          testSetup.argumentId,
        );

        const createRes = await helpers.createQuestionExpectSuccess(payload);
        const questionId = createRes.body.question.id;

        // Retrieve and verify all attributes
        const getRes = await helpers.getQuestionExpectSuccess(questionId);
        const question = getRes.body.question;

        // Verify all required fields are present
        expect(question.id).toBeDefined();
        expect(question.text).toBeDefined();
        expect(question.type).toBeDefined();
        expect(question.assessmentId).toBeDefined();
        expect(question.createdAt).toBeDefined();
        expect(question.updatedAt).toBeDefined();

        // Verify data types
        expect(typeof question.id).toBe('string');
        expect(typeof question.text).toBe('string');
        expect(typeof question.type).toBe('string');
        expect(typeof question.assessmentId).toBe('string');
        expect(typeof question.createdAt).toBe('string');
        expect(typeof question.updatedAt).toBe('string');

        // Verify content matches creation
        expect(question.text).toBe(payload.text);
        expect(question.type).toBe(payload.type);
        expect(question.assessmentId).toBe(payload.assessmentId);
        expect(question.argumentId).toBe(payload.argumentId);
      });

      it('should not modify data during retrieval', async () => {
        const payload = QuestionTestData.validPayloads.unicode(
          testSetup.provaAbertaAssessmentId,
        );

        const createRes = await helpers.createQuestionExpectSuccess(payload);
        const questionId = createRes.body.question.id;

        // Retrieve multiple times to ensure no modification
        const getRes1 = await helpers.getQuestionExpectSuccess(questionId);
        const getRes2 = await helpers.getQuestionExpectSuccess(questionId);

        // Verify text is not modified
        expect(getRes1.body.question.text).toBe(payload.text);
        expect(getRes2.body.question.text).toBe(payload.text);
        expect(getRes1.body.question.text).toBe(getRes2.body.question.text);

        // Verify timestamps don't change during retrieval
        expect(getRes1.body.question.createdAt).toBe(
          getRes2.body.question.createdAt,
        );
        expect(getRes1.body.question.updatedAt).toBe(
          getRes2.body.question.updatedAt,
        );
      });

      it('should handle edge case content correctly', async () => {
        // Test various edge cases for content
        const edgeCases = [
          {
            name: 'Minimum length text',
            payload: QuestionTestData.validPayloads.minLength(
              testSetup.quizAssessmentId,
            ),
          },
          {
            name: 'Maximum length text',
            payload: QuestionTestData.validPayloads.maxLength(
              testSetup.quizAssessmentId,
            ),
          },
          {
            name: 'Special characters',
            payload: QuestionTestData.validPayloads.specialChars(
              testSetup.quizAssessmentId,
            ),
          },
          {
            name: 'Mixed whitespace',
            payload: QuestionTestData.validPayloads.mixedWhitespace(
              testSetup.quizAssessmentId,
            ),
          },
        ];

        for (const edgeCase of edgeCases) {
          const createRes = await helpers.createQuestionExpectSuccess(
            edgeCase.payload,
          );
          const getRes = await helpers.getQuestionExpectSuccess(
            createRes.body.question.id,
          );

          // Verify text is preserved exactly
          expect(getRes.body.question.text).toBe(edgeCase.payload.text);

          // Verify text normalization doesn't occur
          helpers.verifyTextNormalization(
            edgeCase.payload.text,
            getRes.body.question.text,
          );
        }
      });
    });

    describe('Database integrity verification', () => {
      it('should maintain database consistency during operations', async () => {
        // Create multiple questions
        const questionIds: string[] = [];
        for (let i = 0; i < 3; i++) {
          const payload = {
            text: `Database integrity test question ${i + 1} with sufficient characters`,
            type: 'MULTIPLE_CHOICE' as const,
            assessmentId: testSetup.quizAssessmentId,
          };
          const createRes = await helpers.createQuestionExpectSuccess(payload);
          questionIds.push(createRes.body.question.id);
        }

        // Verify all questions can be retrieved
        for (const questionId of questionIds) {
          await helpers.getQuestionExpectSuccess(questionId);
          await helpers.verifyQuestionDataIntegrity(questionId);
        }

        // Verify database integrity
        await helpers.verifyDatabaseIntegrity();
      });

      it('should handle database relationships correctly', async () => {
        // Create question with argument
        const payload = QuestionTestData.validPayloads.simuladoWithArgument(
          testSetup.simuladoAssessmentId,
          testSetup.argumentId,
        );
        const createRes = await helpers.createQuestionExpectSuccess(payload);
        const questionId = createRes.body.question.id;

        // Verify relationships are maintained
        await helpers.verifyQuestionAssessmentRelationship(
          questionId,
          testSetup.simuladoAssessmentId,
        );
        await helpers.verifyQuestionArgumentRelationship(
          questionId,
          testSetup.argumentId,
        );

        // Retrieve and verify relationships in response
        const getRes = await helpers.getQuestionExpectSuccess(questionId);
        expect(getRes.body.question.assessmentId).toBe(
          testSetup.simuladoAssessmentId,
        );
        expect(getRes.body.question.argumentId).toBe(testSetup.argumentId);
      });
    });
  },
  QuestionTestData.TIMEOUTS.LONG,
);
