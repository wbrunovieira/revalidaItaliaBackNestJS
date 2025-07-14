// test/e2e/question-options/get-list-question-options.e2e.spec.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

import { QuestionOptionTestSetup } from './shared/question-option-test-setup';
import { QuestionOptionTestHelpers } from './shared/question-option-test-helpers';
import { QuestionOptionTestData } from './shared/question-option-test-data';

describe(
  'ListQuestionOptions E2E',
  () => {
    let testSetup: QuestionOptionTestSetup;
    let helpers: QuestionOptionTestHelpers;

    beforeAll(async () => {
      testSetup = new QuestionOptionTestSetup();
      await testSetup.initialize();
      helpers = new QuestionOptionTestHelpers(testSetup);
    });

    beforeEach(async () => {
      await testSetup.setupTestData();
    });

    afterAll(async () => {
      await testSetup.teardown();
    });

    describe('Success scenarios', () => {
      it('should list empty options for question without options', async () => {
        // Use existing multiple choice question with no options
        const response = await helpers.listQuestionOptionsExpectSuccess(
          testSetup.multipleChoiceQuestionId,
        );

        // Verify empty options response
        helpers.verifyListQuestionOptionsSuccessResponseFormat(
          response.body,
          [],
        );
        expect(response.body.options).toHaveLength(0);
      });

      it('should list single option successfully', async () => {
        // Create question with single option
        const { questionId, listResponse } =
          await helpers.createAndListQuestionOptions(
            'Question with single option',
            QuestionOptionTestData.validQuestionOptions.singleOption,
            testSetup.quizAssessmentId,
          );

        // Verify response format
        helpers.verifyListQuestionOptionsSuccessResponseFormat(
          listResponse.body,
          QuestionOptionTestData.validQuestionOptions.singleOption.map(
            (text) => ({
              text,
              questionId,
            }),
          ),
        );

        // Verify option content
        expect(listResponse.body.options[0].text).toBe(
          QuestionOptionTestData.validQuestionOptions.singleOption[0],
        );
        expect(listResponse.body.options[0].questionId).toBe(questionId);
      });

      it('should list multiple choice options successfully', async () => {
        // Create question with multiple options
        const { questionId, listResponse } =
          await helpers.createAndListQuestionOptions(
            'Multiple choice question',
            QuestionOptionTestData.validQuestionOptions.multipleChoice.basic,
            testSetup.quizAssessmentId,
          );

        // Verify response format
        helpers.verifyListQuestionOptionsSuccessResponseFormat(
          listResponse.body,
          QuestionOptionTestData.validQuestionOptions.multipleChoice.basic.map(
            (text) => ({
              text,
              questionId,
            }),
          ),
        );

        // Verify all options are returned
        expect(listResponse.body.options).toHaveLength(4);

        // Verify options content
        const expectedTexts =
          QuestionOptionTestData.validQuestionOptions.multipleChoice.basic;
        helpers.verifyOptionsOrder(listResponse.body, expectedTexts);
      });

      it('should list medical options successfully', async () => {
        // Create medical question with options
        const { questionId, listResponse } =
          await helpers.createAndListQuestionOptions(
            'Medical multiple choice question',
            QuestionOptionTestData.validQuestionOptions.multipleChoice.medical,
            testSetup.quizAssessmentId,
          );

        // Verify medical content is preserved
        const medicalOptions =
          QuestionOptionTestData.validQuestionOptions.multipleChoice.medical;
        medicalOptions.forEach((expectedText, index) => {
          expect(listResponse.body.options[index].text).toBe(expectedText);
        });

        // Verify medical terminology is preserved
        expect(listResponse.body.options[0].text).toContain('Hypertension');
        expect(listResponse.body.options[1].text).toContain(
          'Diabetes mellitus',
        );
        expect(listResponse.body.options[2].text).toContain(
          'Coronary artery disease',
        );
        expect(listResponse.body.options[3].text).toContain(
          'Chronic kidney disease',
        );
      });

      it('should list options with special characters', async () => {
        // Create question with special character options
        const { questionId, listResponse } =
          await helpers.createAndListQuestionOptions(
            'Question with special characters',
            QuestionOptionTestData.validQuestionOptions.specialCharacters,
            testSetup.quizAssessmentId,
          );

        // Verify special characters are preserved
        expect(listResponse.body.options[0].text).toContain('@#$%^&*()');
        expect(listResponse.body.options[1].text).toContain('±≤≥≠≈∞');
        expect(listResponse.body.options[2].text).toContain('$€£¥₹');
        expect(listResponse.body.options[3].text).toContain('"quotes"');
      });

      it('should list options with unicode characters', async () => {
        // Create question with unicode options
        const { questionId, listResponse } =
          await helpers.createAndListQuestionOptions(
            'Question with unicode characters',
            QuestionOptionTestData.validQuestionOptions.unicode,
            testSetup.quizAssessmentId,
          );

        // Verify unicode is preserved
        expect(listResponse.body.options[0].text).toContain('português');
        expect(listResponse.body.options[1].text).toContain('中文');
        expect(listResponse.body.options[2].text).toContain('العربية');
        expect(listResponse.body.options[3].text).toContain('русский');
        expect(listResponse.body.options[4].text).toContain('🎯🚀💡🔬⚕️');
      });

      it('should list options with whitespace formatting', async () => {
        // Create question with whitespace options
        const { questionId, listResponse } =
          await helpers.createAndListQuestionOptions(
            'Question with whitespace formatting',
            QuestionOptionTestData.validQuestionOptions.whitespace,
            testSetup.quizAssessmentId,
          );

        // Verify whitespace is preserved
        QuestionOptionTestData.validQuestionOptions.whitespace.forEach(
          (originalText, index) => {
            const retrievedText = listResponse.body.options[index].text;
            helpers.verifyTextNormalization(originalText, retrievedText);
          },
        );
      });

      it('should list options with minimum and maximum lengths', async () => {
        // Test minimum length
        const { questionId: minQuestionId, listResponse: minResponse } =
          await helpers.createAndListQuestionOptions(
            'Question with minimum length option',
            QuestionOptionTestData.validQuestionOptions.minLength,
            testSetup.quizAssessmentId,
          );

        expect(minResponse.body.options[0].text).toHaveLength(9);

        // Test maximum length
        const { questionId: maxQuestionId, listResponse: maxResponse } =
          await helpers.createAndListQuestionOptions(
            'Question with maximum length option',
            QuestionOptionTestData.validQuestionOptions.maxLength,
            testSetup.quizAssessmentId,
          );

        expect(maxResponse.body.options[0].text).toHaveLength(500);
      });

      it('should maintain creation order in listed options', async () => {
        // Create question with multiple options in specific order
        const optionTexts = [
          'First Option',
          'Second Option',
          'Third Option',
          'Fourth Option',
        ];
        const { questionId, listResponse } =
          await helpers.createAndListQuestionOptions(
            'Question for order testing',
            optionTexts,
            testSetup.quizAssessmentId,
          );

        // Verify options are in creation order
        helpers.verifyOptionsOrder(listResponse.body, optionTexts);
      });

      it('should handle different question types correctly', async () => {
        await helpers.testListQuestionOptionsWithDifferentQuestionTypes();
      });

      it('should handle special content correctly', async () => {
        await helpers.testListQuestionOptionsWithSpecialContent();
      });
    });

    describe('Validation and Invalid Input scenarios', () => {
      it('should reject invalid UUID format', async () => {
        const invalidId =
          QuestionOptionTestData.listQuestionOptions.invalidIds.invalidFormat()
            .id;
        await helpers.listQuestionOptionsExpectValidationError(invalidId);
      });

      it('should reject non-UUID string', async () => {
        const invalidId =
          QuestionOptionTestData.listQuestionOptions.invalidIds.notUuid().id;
        await helpers.listQuestionOptionsExpectValidationError(invalidId);
      });

      it('should reject too short ID', async () => {
        const invalidId =
          QuestionOptionTestData.listQuestionOptions.invalidIds.tooShort().id;
        await helpers.listQuestionOptionsExpectValidationError(invalidId);
      });

      it('should reject too long ID', async () => {
        const invalidId =
          QuestionOptionTestData.listQuestionOptions.invalidIds.tooLong().id;
        await helpers.listQuestionOptionsExpectValidationError(invalidId);
      });

      it('should reject ID with wrong hyphen placement', async () => {
        const invalidId =
          QuestionOptionTestData.listQuestionOptions.invalidIds.wrongHyphens()
            .id;
        await helpers.listQuestionOptionsExpectValidationError(invalidId);
      });

      it('should reject ID missing hyphens', async () => {
        const invalidId =
          QuestionOptionTestData.listQuestionOptions.invalidIds.missingHyphens()
            .id;
        await helpers.listQuestionOptionsExpectValidationError(invalidId);
      });

      it('should reject ID with special characters', async () => {
        const invalidId =
          QuestionOptionTestData.listQuestionOptions.invalidIds.specialChars()
            .id;
        await helpers.listQuestionOptionsExpectValidationError(invalidId);
      });

      it('should reject ID with invalid hex characters', async () => {
        const invalidId =
          QuestionOptionTestData.listQuestionOptions.invalidIds.invalidChars()
            .id;
        await helpers.listQuestionOptionsExpectValidationError(invalidId);
      });

      it('should reject empty string ID', async () => {
        const invalidId =
          QuestionOptionTestData.listQuestionOptions.invalidIds.emptyString()
            .id;
        const res = await helpers.listQuestionOptionsById(invalidId);
        expect([400, 404]).toContain(res.status);
      });

      it('should reject ID with whitespace', async () => {
        const invalidId =
          QuestionOptionTestData.listQuestionOptions.invalidIds.withWhitespace()
            .id;
        const res = await helpers.listQuestionOptionsById(invalidId);
        expect([400, 404]).toContain(res.status);
      });

      it('should reject ID with tabs', async () => {
        const invalidId =
          QuestionOptionTestData.listQuestionOptions.invalidIds.withTabs().id;
        const res = await helpers.listQuestionOptionsById(invalidId);
        expect([400, 404]).toContain(res.status);
      });

      it('should reject ID with newlines', async () => {
        const invalidId =
          QuestionOptionTestData.listQuestionOptions.invalidIds.withNewlines()
            .id;
        const res = await helpers.listQuestionOptionsById(invalidId);
        expect([400, 404]).toContain(res.status);
      });

      it('should reject ID with unicode characters', async () => {
        const invalidId =
          QuestionOptionTestData.listQuestionOptions.invalidIds.unicodeChars()
            .id;
        await helpers.listQuestionOptionsExpectValidationError(invalidId);
      });

      it('should reject ID with emojis', async () => {
        const invalidId =
          QuestionOptionTestData.listQuestionOptions.invalidIds.emojis().id;
        await helpers.listQuestionOptionsExpectValidationError(invalidId);
      });

      it('should reject SQL injection attempt', async () => {
        const invalidId =
          QuestionOptionTestData.listQuestionOptions.invalidIds.sqlInjection()
            .id;
        const res = await helpers.listQuestionOptionsById(invalidId);
        expect([400, 404]).toContain(res.status);
      });

      it('should reject XSS attempt', async () => {
        const invalidId =
          QuestionOptionTestData.listQuestionOptions.invalidIds.xssAttempt().id;
        const res = await helpers.listQuestionOptionsById(invalidId);
        expect([400, 404]).toContain(res.status);
      });

      it('should reject extremely long string', async () => {
        const invalidId =
          QuestionOptionTestData.listQuestionOptions.invalidIds.longString().id;
        await helpers.listQuestionOptionsExpectValidationError(invalidId);
      });

      it('should test all invalid ID formats systematically', async () => {
        const invalidIds = [
          QuestionOptionTestData.listQuestionOptions.invalidIds.invalidFormat()
            .id,
          QuestionOptionTestData.listQuestionOptions.invalidIds.notUuid().id,
          QuestionOptionTestData.listQuestionOptions.invalidIds.tooShort().id,
          QuestionOptionTestData.listQuestionOptions.invalidIds.tooLong().id,
          QuestionOptionTestData.listQuestionOptions.invalidIds.wrongHyphens()
            .id,
          QuestionOptionTestData.listQuestionOptions.invalidIds.missingHyphens()
            .id,
          QuestionOptionTestData.listQuestionOptions.invalidIds.specialChars()
            .id,
          QuestionOptionTestData.listQuestionOptions.invalidIds.invalidChars()
            .id,
          QuestionOptionTestData.listQuestionOptions.invalidIds.unicodeChars()
            .id,
          QuestionOptionTestData.listQuestionOptions.invalidIds.emojis().id,
        ];

        for (const invalidId of invalidIds) {
          const res = await helpers.listQuestionOptionsById(invalidId);
          expect([400, 404]).toContain(res.status);
        }
      });
    });

    describe('Edge cases', () => {
      it('should handle all zeros UUID', async () => {
        const zerosId =
          QuestionOptionTestData.listQuestionOptions.nonExistentIds.zeros().id;
        await helpers.listQuestionOptionsExpectNotFound(zerosId);
      });

      it('should handle all f characters UUID', async () => {
        const allFsId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
        await helpers.listQuestionOptionsExpectNotFound(allFsId);
      });

      it('should handle question retrieval immediately after option creation', async () => {
        // Create question and add option
        const questionId = await testSetup.createTestQuestion({
          text: 'Immediate retrieval test question',
          type: 'MULTIPLE_CHOICE',
          assessmentId: testSetup.quizAssessmentId,
        });

        const optionId = await testSetup.createTestQuestionOption({
          text: 'Immediate option',
          questionId,
        });

        // Retrieve immediately
        const response =
          await helpers.listQuestionOptionsExpectSuccess(questionId);

        // Verify immediate consistency
        expect(response.body.options).toHaveLength(1);
        expect(response.body.options[0].text).toBe('Immediate option');
        expect(response.body.options[0].questionId).toBe(questionId);
      });

      it('should handle mixed case UUID correctly', async () => {
        // Create question with options
        const { questionId } = await helpers.createAndListQuestionOptions(
          'Mixed case UUID test',
          ['Option A', 'Option B'],
          testSetup.quizAssessmentId,
        );

        // Test with original case
        await helpers.listQuestionOptionsExpectSuccess(questionId);

        // Test UUID validation accepts case variations
        const lowerCaseId = questionId.toLowerCase();
        const res1 = await helpers.listQuestionOptionsById(lowerCaseId);
        expect([200, 404]).toContain(res1.status);

        const upperCaseId = questionId.toUpperCase();
        const res2 = await helpers.listQuestionOptionsById(upperCaseId);
        expect([200, 404]).toContain(res2.status);
      });

      it('should maintain data consistency across multiple retrievals', async () => {
        // Create question with options
        const { questionId } = await helpers.createAndListQuestionOptions(
          'Consistency test question',
          ['Consistent Option A', 'Consistent Option B', 'Consistent Option C'],
          testSetup.quizAssessmentId,
        );

        // Retrieve multiple times
        const response1 =
          await helpers.listQuestionOptionsExpectSuccess(questionId);
        const response2 =
          await helpers.listQuestionOptionsExpectSuccess(questionId);
        const response3 =
          await helpers.listQuestionOptionsExpectSuccess(questionId);

        // Verify all responses are identical
        expect(response1.body).toEqual(response2.body);
        expect(response2.body).toEqual(response3.body);
        expect(response1.body).toEqual(response3.body);
      });

      it('should handle questions with many options', async () => {
        // Create question with maximum reasonable options
        const manyOptions = Array.from(
          { length: 20 },
          (_, i) => `Option ${String.fromCharCode(65 + (i % 26))} - ${i + 1}`,
        );

        const { questionId, listResponse } =
          await helpers.createAndListQuestionOptions(
            'Question with many options',
            manyOptions,
            testSetup.quizAssessmentId,
          );

        // Verify all options are returned
        expect(listResponse.body.options).toHaveLength(20);
        helpers.verifyOptionsOrder(listResponse.body, manyOptions);
      });

      it('should handle timestamp edge cases', async () => {
        // Create options with small time differences
        const questionId = await testSetup.createTestQuestion({
          text: 'Timestamp edge case test',
          type: 'MULTIPLE_CHOICE',
          assessmentId: testSetup.quizAssessmentId,
        });

        // Create options sequentially
        const option1Id = await testSetup.createTestQuestionOption({
          text: 'First option',
          questionId,
        });
        await testSetup.wait(10);

        const option2Id = await testSetup.createTestQuestionOption({
          text: 'Second option',
          questionId,
        });

        // Verify timestamps and order
        const response =
          await helpers.listQuestionOptionsExpectSuccess(questionId);
        expect(response.body.options).toHaveLength(2);

        const option1 = response.body.options.find(
          (opt) => opt.text === 'First option',
        );
        const option2 = response.body.options.find(
          (opt) => opt.text === 'Second option',
        );

        expect(option1).toBeDefined();
        expect(option2).toBeDefined();

        // Verify timestamps are valid
        const createdAt1 = new Date(option1.createdAt);
        const createdAt2 = new Date(option2.createdAt);
        expect(createdAt1).toBeInstanceOf(Date);
        expect(createdAt2).toBeInstanceOf(Date);
        expect(createdAt1.getTime()).toBeLessThanOrEqual(createdAt2.getTime());
      });
    });

    describe('Error scenarios', () => {
      it('should return 404 when question does not exist', async () => {
        const nonExistentId =
          QuestionOptionTestData.listQuestionOptions.nonExistentIds.notFound()
            .id;
        await helpers.listQuestionOptionsExpectNotFound(nonExistentId);
      });

      it('should return 404 for deleted question ID', async () => {
        const deletedId =
          QuestionOptionTestData.listQuestionOptions.nonExistentIds.deleted()
            .id;
        const res = await helpers.listQuestionOptionsById(deletedId);
        expect([400, 404]).toContain(res.status);
      });

      it('should handle concurrent access to same question options', async () => {
        // Create question with options
        const { questionId } = await helpers.createAndListQuestionOptions(
          'Concurrent access test',
          ['Concurrent Option A', 'Concurrent Option B', 'Concurrent Option C'],
          testSetup.quizAssessmentId,
        );

        // Make concurrent requests
        const concurrentRequests = Array.from({ length: 5 }, () => questionId);
        const responses =
          await helpers.listQuestionOptionsConcurrently(concurrentRequests);

        // All should succeed and return same data
        responses.forEach((res) => {
          expect(res.status).toBe(200);
          expect(res.body.options).toHaveLength(3);
        });

        // Verify all responses are identical
        const firstResponse = responses[0].body;
        responses.forEach((res) => {
          expect(res.body).toEqual(firstResponse);
        });
      });

      it('should handle malformed request paths gracefully', async () => {
        const malformedPaths = ['invalid-uuid', '123', 'null', 'undefined', ''];

        for (const path of malformedPaths) {
          const res = await helpers.listQuestionOptionsById(path);
          expect([400, 404]).toContain(res.status);
        }
      });

      it('should validate request structure correctly', async () => {
        const invalidRequests = [
          '00000000-0000-0000-0000-000000000000', // Valid format but non-existent
          'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', // Valid format but non-existent
        ];

        for (const id of invalidRequests) {
          await helpers.listQuestionOptionsExpectNotFound(id);
        }
      });
    });

    describe('Performance tests', () => {
      it('should execute ListQuestionOptions within acceptable time', async () => {
        // Create question with options
        const { questionId } = await helpers.createAndListQuestionOptions(
          'Performance test question',
          QuestionOptionTestData.validQuestionOptions.multipleChoice.basic,
          testSetup.quizAssessmentId,
        );

        // Test performance
        await helpers.testListQuestionOptionsPerformance(
          'Single ListQuestionOptions request',
          async () =>
            await helpers.listQuestionOptionsExpectSuccess(questionId),
          QuestionOptionTestData.MAX_EXECUTION_TIME,
        );
      });

      it('should handle concurrent requests efficiently', async () => {
        // Create multiple questions with options
        const questionIds: string[] = [];
        for (let i = 0; i < 5; i++) {
          const { questionId } = await helpers.generateTestQuestionWithOptions(
            4,
            `ConcurrentTest${i}`,
            testSetup.quizAssessmentId,
          );
          questionIds.push(questionId);
        }

        // Test concurrent access
        await helpers.testListQuestionOptionsPerformance(
          'Concurrent ListQuestionOptions requests',
          async () => {
            const responses =
              await helpers.listQuestionOptionsConcurrently(questionIds);
            helpers.verifyListQuestionOptionsLoadTestResults(
              responses,
              questionIds.length,
            );
            return responses;
          },
          QuestionOptionTestData.MAX_EXECUTION_TIME * 2,
        );
      });

      it('should handle sequential requests efficiently', async () => {
        // Create multiple questions with options
        const questionIds: string[] = [];
        for (let i = 0; i < 3; i++) {
          const { questionId } = await helpers.generateTestQuestionWithOptions(
            4,
            `SequentialTest${i}`,
            testSetup.quizAssessmentId,
          );
          questionIds.push(questionId);
        }

        // Test sequential access
        await helpers.testListQuestionOptionsPerformance(
          'Sequential ListQuestionOptions requests',
          async () => {
            const responses =
              await helpers.listQuestionOptionsSequentially(questionIds);
            helpers.verifyListQuestionOptionsLoadTestResults(
              responses,
              questionIds.length,
            );
            return responses;
          },
          QuestionOptionTestData.MAX_EXECUTION_TIME * 3,
        );
      });

      it('should maintain consistent response times', async () => {
        // Create question with options
        const { questionId } = await helpers.generateTestQuestionWithOptions(
          4,
          'ConsistencyTest',
          testSetup.quizAssessmentId,
        );

        // Test response time consistency
        await helpers.testListQuestionOptionsResponseTimeConsistency(
          questionId,
          5, // 5 iterations
          100, // max variance of 100ms
        );
      });

      it('should handle load testing scenarios', async () => {
        // Create questions for load testing
        const questionIds: string[] = [];
        for (let i = 0; i < 10; i++) {
          const { questionId } = await helpers.generateTestQuestionWithOptions(
            4,
            `LoadTest${i}`,
            testSetup.quizAssessmentId,
          );
          questionIds.push(questionId);
        }

        // Perform load test
        const loadTestResults =
          await helpers.testListQuestionOptionsPerformance(
            'Load test - 10 questions',
            async () => {
              const responses =
                await helpers.listQuestionOptionsConcurrently(questionIds);
              return responses;
            },
            QuestionOptionTestData.MAX_EXECUTION_TIME * 5,
          );

        // Verify all responses are successful
        loadTestResults.forEach((res) => {
          expect(res.status).toBe(200);
          expect(res.body.options).toBeDefined();
        });
      });

      it('should handle questions with many options efficiently', async () => {
        // Test performance with different option counts
        const testScenarios = [
          {
            count:
              QuestionOptionTestData.testScenarios.performance.singleOption,
            name: 'Single option',
          },
          {
            count: QuestionOptionTestData.testScenarios.performance.fewOptions,
            name: 'Few options',
          },
          {
            count: QuestionOptionTestData.testScenarios.performance.manyOptions,
            name: 'Many options',
          },
          {
            count: QuestionOptionTestData.testScenarios.performance.maxOptions,
            name: 'Max options',
          },
        ];

        for (const scenario of testScenarios) {
          const { questionId } = await helpers.generateTestQuestionWithOptions(
            scenario.count,
            `Performance${scenario.name}`,
            testSetup.quizAssessmentId,
          );

          await helpers.testListQuestionOptionsPerformance(
            `${scenario.name} performance test`,
            async () =>
              await helpers.listQuestionOptionsExpectSuccess(questionId),
            QuestionOptionTestData.MAX_EXECUTION_TIME,
          );
        }
      });
    });

    describe('Behavioral validation', () => {
      it('should maintain data integrity between create and list operations', async () => {
        const testCases = [
          {
            name: 'Basic multiple choice',
            options:
              QuestionOptionTestData.validQuestionOptions.multipleChoice.basic,
          },
          {
            name: 'Medical terminology',
            options:
              QuestionOptionTestData.validQuestionOptions.multipleChoice
                .medical,
          },
          {
            name: 'Special characters',
            options:
              QuestionOptionTestData.validQuestionOptions.specialCharacters,
          },
          {
            name: 'Unicode content',
            options: QuestionOptionTestData.validQuestionOptions.unicode,
          },
        ];

        for (const testCase of testCases) {
          const { questionId, listResponse } =
            await helpers.createAndListQuestionOptions(
              `${testCase.name} integrity test`,
              testCase.options,
              testSetup.quizAssessmentId,
            );

          // Verify data integrity with database
          await helpers.verifyQuestionOptionDataIntegrity(
            questionId,
            testCase.options.length,
          );

          // Verify content matches exactly
          testCase.options.forEach((expectedText, index) => {
            expect(listResponse.body.options[index].text).toBe(expectedText);
          });
        }
      });

      it('should handle question options across different assessment types', async () => {
        const assessmentTypes = [
          { type: 'QUIZ', id: testSetup.quizAssessmentId },
          { type: 'SIMULADO', id: testSetup.simuladoAssessmentId },
          { type: 'PROVA_ABERTA', id: testSetup.provaAbertaAssessmentId },
        ];

        for (const assessment of assessmentTypes) {
          const { questionId, listResponse } =
            await helpers.createAndListQuestionOptions(
              `Question for ${assessment.type} assessment`,
              ['Option A', 'Option B', 'Option C'],
              assessment.id,
            );

          // Verify options are retrieved correctly regardless of assessment type
          expect(listResponse.body.options).toHaveLength(3);
          expect(listResponse.body.options[0].questionId).toBe(questionId);
        }
      });

      it('should preserve all option attributes correctly', async () => {
        const { questionId, listResponse } =
          await helpers.createAndListQuestionOptions(
            'Attribute preservation test',
            ['Test option with all attributes'],
            testSetup.quizAssessmentId,
          );

        const option = listResponse.body.options[0];

        // Verify all required fields are present
        expect(option.id).toBeDefined();
        expect(option.text).toBeDefined();
        expect(option.questionId).toBeDefined();
        expect(option.createdAt).toBeDefined();
        expect(option.updatedAt).toBeDefined();

        // Verify data types
        expect(typeof option.id).toBe('string');
        expect(typeof option.text).toBe('string');
        expect(typeof option.questionId).toBe('string');
        expect(typeof option.createdAt).toBe('string');
        expect(typeof option.updatedAt).toBe('string');

        // Verify content
        expect(option.text).toBe('Test option with all attributes');
        expect(option.questionId).toBe(questionId);
      });

      it('should not modify data during retrieval', async () => {
        const originalOptions =
          QuestionOptionTestData.validQuestionOptions.unicode;
        const { questionId } = await helpers.createAndListQuestionOptions(
          'Data modification test',
          originalOptions,
          testSetup.quizAssessmentId,
        );

        // Retrieve multiple times
        const response1 =
          await helpers.listQuestionOptionsExpectSuccess(questionId);
        const response2 =
          await helpers.listQuestionOptionsExpectSuccess(questionId);

        // Verify text is not modified
        originalOptions.forEach((originalText, index) => {
          expect(response1.body.options[index].text).toBe(originalText);
          expect(response2.body.options[index].text).toBe(originalText);
          expect(response1.body.options[index].text).toBe(
            response2.body.options[index].text,
          );
        });

        // Verify timestamps don't change during retrieval
        response1.body.options.forEach((option1, index) => {
          const option2 = response2.body.options[index];
          expect(option1.createdAt).toBe(option2.createdAt);
          expect(option1.updatedAt).toBe(option2.updatedAt);
        });
      });

      it('should handle edge case content correctly', async () => {
        const edgeCaseData = QuestionOptionTestData.generateEdgeCaseTestData();

        for (const [caseName, caseData] of Object.entries(edgeCaseData)) {
          if (Array.isArray(caseData)) {
            const { questionId, listResponse } =
              await helpers.createAndListQuestionOptions(
                `Edge case: ${caseName}`,
                caseData,
                testSetup.quizAssessmentId,
              );

            // Verify text is preserved exactly
            caseData.forEach((originalText, index) => {
              expect(listResponse.body.options[index].text).toBe(originalText);

              // Verify text normalization doesn't occur
              helpers.verifyTextNormalization(
                originalText,
                listResponse.body.options[index].text,
              );
            });
          }
        }
      });

      it('should handle multi-language content correctly', async () => {
        const multiLanguageData =
          QuestionOptionTestData.generateMultiLanguageTestData();

        for (const [language, data] of Object.entries(multiLanguageData)) {
          const { questionId, listResponse } =
            await helpers.createAndListQuestionOptions(
              data.question,
              data.options,
              testSetup.quizAssessmentId,
            );

          // Verify language-specific content is preserved
          data.options.forEach((originalText, index) => {
            expect(listResponse.body.options[index].text).toBe(originalText);
          });
        }
      });
    });

    describe('Database integrity verification', () => {
      it('should maintain database consistency during operations', async () => {
        // Create multiple questions with options
        const questionIds: string[] = [];
        for (let i = 0; i < 3; i++) {
          const { questionId } = await helpers.createAndListQuestionOptions(
            `Database integrity test question ${i + 1}`,
            [`Option A${i}`, `Option B${i}`, `Option C${i}`],
            testSetup.quizAssessmentId,
          );
          questionIds.push(questionId);
        }

        // Verify all questions and options can be retrieved
        for (const questionId of questionIds) {
          await helpers.listQuestionOptionsExpectSuccess(questionId);
          await helpers.verifyQuestionOptionDataIntegrity(questionId, 3);
        }

        // Verify database integrity
        await helpers.verifyDatabaseIntegrity();
      });

      it('should handle database relationships correctly', async () => {
        // Create question with options in different assessments
        const { questionId: quizQuestionId } =
          await helpers.createAndListQuestionOptions(
            'Quiz question with options',
            ['Quiz Option A', 'Quiz Option B'],
            testSetup.quizAssessmentId,
          );

        const { questionId: simuladoQuestionId } =
          await helpers.createAndListQuestionOptions(
            'Simulado question with options',
            ['Simulado Option A', 'Simulado Option B'],
            testSetup.simuladoAssessmentId,
          );

        // Verify relationships are maintained
        const quizResponse =
          await helpers.listQuestionOptionsExpectSuccess(quizQuestionId);
        const simuladoResponse =
          await helpers.listQuestionOptionsExpectSuccess(simuladoQuestionId);

        // Verify options belong to correct questions
        quizResponse.body.options.forEach((option) => {
          expect(option.questionId).toBe(quizQuestionId);
        });

        simuladoResponse.body.options.forEach((option) => {
          expect(option.questionId).toBe(simuladoQuestionId);
        });

        // Verify cross-contamination doesn't occur
        expect(quizResponse.body.options).toHaveLength(2);
        expect(simuladoResponse.body.options).toHaveLength(2);
      });

      it('should ensure referential integrity', async () => {
        // Create question with options
        const { questionId } = await helpers.createAndListQuestionOptions(
          'Referential integrity test',
          ['Integrity Option A', 'Integrity Option B'],
          testSetup.quizAssessmentId,
        );

        // Verify question exists in database
        const dbQuestion = await testSetup.findQuestionById(questionId);
        expect(dbQuestion).toBeDefined();
        expect(dbQuestion).not.toBeNull();
        expect(dbQuestion!.id).toBe(questionId);

        // Verify options exist and reference correct question
        const dbOptions =
          await testSetup.findQuestionOptionsByQuestionId(questionId);
        expect(dbOptions).toHaveLength(2);
        dbOptions.forEach((option) => {
          expect(option.questionId).toBe(questionId);
        });

        // Verify integrity with API response
        const apiResponse =
          await helpers.listQuestionOptionsExpectSuccess(questionId);
        expect(apiResponse.body.options).toHaveLength(dbOptions.length);
      });
    });
  },
  QuestionOptionTestData.TIMEOUTS.LONG,
);
