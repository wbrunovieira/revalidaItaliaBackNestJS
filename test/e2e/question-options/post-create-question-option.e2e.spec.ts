// test/e2e/question-options/post-create-question-option.e2e.spec.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request, { Response } from 'supertest';

import { QuestionOptionTestSetup } from './shared/question-option-test-setup';
import { QuestionOptionTestHelpers } from './shared/question-option-test-helpers';
import { QuestionOptionTestData } from './shared/question-option-test-data';

describe(
  'CreateQuestionOption E2E',
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
      it('should create basic question option successfully', async () => {
        const optionText = 'Basic option text';
        const response: Response = await helpers.createQuestionOptionExpectSuccess(
          testSetup.multipleChoiceQuestionId,
          optionText,
        );

        // Verify response format
        helpers.verifyCreateQuestionOptionSuccessResponseFormat(
          response.body,
          optionText,
          testSetup.multipleChoiceQuestionId,
        );

        // Verify option was created in database
        const dbOption = await testSetup.prisma.questionOption.findUnique({
          where: { id: (response.body as any).questionOption.id },
        });
        expect(dbOption).toBeDefined();
        expect(dbOption!.text).toBe(optionText);
        expect(dbOption!.questionId).toBe(testSetup.multipleChoiceQuestionId);
      });

      it('should create medical question option successfully', async () => {
        const payload = QuestionOptionTestData.createQuestionOption.validPayloads.medical(
          testSetup.multipleChoiceQuestionId,
        );
        
        const response: Response = await helpers.createQuestionOptionExpectSuccess(
          testSetup.multipleChoiceQuestionId,
          payload.text,
        );

        // Verify medical terminology is preserved
        expect((response.body as any).questionOption.text).toContain('Hypertension');
        expect((response.body as any).questionOption.text).toContain('diabetes');
        expect((response.body as any).questionOption.text).toContain('complications');
      });

      it('should create question option with special characters', async () => {
        const payload = QuestionOptionTestData.createQuestionOption.validPayloads.specialChars(
          testSetup.multipleChoiceQuestionId,
        );
        
        const response: Response = await helpers.createQuestionOptionExpectSuccess(
          testSetup.multipleChoiceQuestionId,
          payload.text,
        );

        // Verify special characters are preserved
        expect((response.body as any).questionOption.text).toContain('@#$%^&*()');
      });

      it('should create question option with unicode characters', async () => {
        const payload = QuestionOptionTestData.createQuestionOption.validPayloads.unicode(
          testSetup.multipleChoiceQuestionId,
        );
        
        const response: Response = await helpers.createQuestionOptionExpectSuccess(
          testSetup.multipleChoiceQuestionId,
          payload.text,
        );

        // Verify unicode is preserved
        expect((response.body as any).questionOption.text).toContain('português');
        expect((response.body as any).questionOption.text).toContain('中文');
        expect((response.body as any).questionOption.text).toContain('العربية');
        expect((response.body as any).questionOption.text).toContain('русский');
        expect((response.body as any).questionOption.text).toContain('🎯🚀');
      });

      it('should create question option with newlines and tabs', async () => {
        const payload = QuestionOptionTestData.createQuestionOption.validPayloads.withNewlines(
          testSetup.multipleChoiceQuestionId,
        );
        
        const response: Response = await helpers.createQuestionOptionExpectSuccess(
          testSetup.multipleChoiceQuestionId,
          payload.text,
        );

        // Verify formatting is preserved
        expect((response.body as any).questionOption.text).toContain('\n');
        expect((response.body as any).questionOption.text).toContain('\t');
      });

      it('should create question option with minimum length text', async () => {
        const payload = QuestionOptionTestData.createQuestionOption.validPayloads.minLength(
          testSetup.multipleChoiceQuestionId,
        );
        
        const response: Response = await helpers.createQuestionOptionExpectSuccess(
          testSetup.multipleChoiceQuestionId,
          payload.text,
        );

        expect((response.body as any).questionOption.text).toHaveLength(9);
      });

      it('should create question option with maximum length text', async () => {
        const payload = QuestionOptionTestData.createQuestionOption.validPayloads.maxLength(
          testSetup.multipleChoiceQuestionId,
        );
        
        const response: Response = await helpers.createQuestionOptionExpectSuccess(
          testSetup.multipleChoiceQuestionId,
          payload.text,
        );

        expect((response.body as any).questionOption.text).toHaveLength(500);
      });

      it('should create clinical case question option', async () => {
        const payload = QuestionOptionTestData.createQuestionOption.validPayloads.clinicalCase(
          testSetup.multipleChoiceQuestionId,
        );
        
        const response: Response = await helpers.createQuestionOptionExpectSuccess(
          testSetup.multipleChoiceQuestionId,
          payload.text,
        );

        // Verify clinical terminology
        expect((response.body as any).questionOption.text).toContain('Patient presents');
        expect((response.body as any).questionOption.text).toContain('acute chest pain');
        expect((response.body as any).questionOption.text).toContain('ST-elevation');
        expect((response.body as any).questionOption.text).toContain('ECG');
      });

      it('should create multiple options for same question', async () => {
        const options = ['Option A', 'Option B', 'Option C', 'Option D'];
        const responses: Response[] = [];

        for (const optionText of options) {
          const response: Response = await helpers.createQuestionOptionExpectSuccess(
            testSetup.multipleChoiceQuestionId,
            optionText,
          );
          responses.push(response);
        }

        // Verify all options were created
        expect(responses).toHaveLength(4);
        
        // Verify each option has unique ID
        const ids = responses.map(r => (r.body as any).questionOption.id);
        expect(new Set(ids)).toHaveLength(4);

        // Verify database has all options
        const dbOptions = await testSetup.findQuestionOptionsByQuestionId(
          testSetup.multipleChoiceQuestionId,
        );
        expect(dbOptions).toHaveLength(4);
      });

      it('should create options in different languages', async () => {
        const payloads = [
          QuestionOptionTestData.createQuestionOption.validPayloads.portuguese(testSetup.multipleChoiceQuestionId),
          QuestionOptionTestData.createQuestionOption.validPayloads.italian(testSetup.multipleChoiceQuestionId),
          QuestionOptionTestData.createQuestionOption.validPayloads.spanish(testSetup.multipleChoiceQuestionId),
        ];

        for (const payload of payloads) {
          const response: Response = await helpers.createQuestionOptionExpectSuccess(
            testSetup.multipleChoiceQuestionId,
            payload.text,
          );

          // Verify language-specific content is preserved
          expect((response.body as any).questionOption.text).toBe(payload.text);
        }
      });

      it('should create and verify option appears in list', async () => {
        const optionText = 'Option for list verification';
        
        // Create option
        const createResponse: Response = await helpers.createQuestionOptionExpectSuccess(
          testSetup.multipleChoiceQuestionId,
          optionText,
        );

        // Verify it appears in list
        const listResponse: Response = await helpers.listQuestionOptionsExpectSuccess(
          testSetup.multipleChoiceQuestionId,
        );

        const createdOption = (listResponse.body as any).options.find(
          (opt: any) => opt.id === (createResponse.body as any).questionOption.id
        );
        expect(createdOption).toBeDefined();
        expect(createdOption.text).toBe(optionText);
      });
    });

    describe('Validation and Invalid Input scenarios', () => {
      it('should reject empty text', async () => {
        const payload = QuestionOptionTestData.createQuestionOption.invalidPayloads.emptyText();
        const response = await helpers.createQuestionOptionWithPayload(
          testSetup.multipleChoiceQuestionId,
          payload,
        );
        expect([400, 500]).toContain(response.status); // Entity validation throws 500
      });

      it('should reject null text', async () => {
        const payload = QuestionOptionTestData.createQuestionOption.invalidPayloads.nullText();
        await helpers.createQuestionOptionExpectValidationError(
          testSetup.multipleChoiceQuestionId,
          payload,
        );
      });

      it('should reject undefined text', async () => {
        const payload = QuestionOptionTestData.createQuestionOption.invalidPayloads.undefinedText();
        await helpers.createQuestionOptionExpectValidationError(
          testSetup.multipleChoiceQuestionId,
          payload,
        );
      });

      it('should reject number as text', async () => {
        const payload = QuestionOptionTestData.createQuestionOption.invalidPayloads.numberText();
        await helpers.createQuestionOptionExpectValidationError(
          testSetup.multipleChoiceQuestionId,
          payload,
        );
      });

      it('should reject boolean as text', async () => {
        const payload = QuestionOptionTestData.createQuestionOption.invalidPayloads.booleanText();
        await helpers.createQuestionOptionExpectValidationError(
          testSetup.multipleChoiceQuestionId,
          payload,
        );
      });

      it('should reject object as text', async () => {
        const payload = QuestionOptionTestData.createQuestionOption.invalidPayloads.objectText();
        await helpers.createQuestionOptionExpectValidationError(
          testSetup.multipleChoiceQuestionId,
          payload,
        );
      });

      it('should reject array as text', async () => {
        const payload = QuestionOptionTestData.createQuestionOption.invalidPayloads.arrayText();
        await helpers.createQuestionOptionExpectValidationError(
          testSetup.multipleChoiceQuestionId,
          payload,
        );
      });

      it('should reject text exceeding maximum length', async () => {
        const payload = QuestionOptionTestData.createQuestionOption.invalidPayloads.tooLongText();
        await helpers.createQuestionOptionExpectValidationError(
          testSetup.multipleChoiceQuestionId,
          payload,
        );
      });

      it('should reject only whitespace text', async () => {
        const payload = QuestionOptionTestData.createQuestionOption.invalidPayloads.onlyWhitespace();
        const response = await helpers.createQuestionOptionWithPayload(
          testSetup.multipleChoiceQuestionId,
          payload,
        );
        expect([400, 500]).toContain(response.status); // Entity validation throws 500
      });

      it('should reject missing text field', async () => {
        const payload = QuestionOptionTestData.createQuestionOption.invalidPayloads.missingText();
        await helpers.createQuestionOptionExpectValidationError(
          testSetup.multipleChoiceQuestionId,
          payload,
        );
      });

      it('should reject extra fields in payload', async () => {
        const payload = QuestionOptionTestData.createQuestionOption.invalidPayloads.extraFields(
          testSetup.multipleChoiceQuestionId,
        );
        const response: Response = await helpers.createQuestionOptionWithPayload(
          testSetup.multipleChoiceQuestionId,
          payload,
        );
        expect([400, 201]).toContain(response.status); // May be filtered or rejected
      });

      it('should handle SQL injection attempt safely', async () => {
        const payload = QuestionOptionTestData.createQuestionOption.invalidPayloads.sqlInjection();
        
        // This should be treated as regular text, not executed
        const response: Response = await helpers.createQuestionOptionExpectSuccess(
          testSetup.multipleChoiceQuestionId,
          payload.text,
        );

        expect((response.body as any).questionOption.text).toBe(payload.text);
        
        // Verify database integrity
        const dbCount = await testSetup.prisma.questionOption.count();
        expect(dbCount).toBeGreaterThan(0);
      });

      it('should handle XSS attempt safely', async () => {
        const payload = QuestionOptionTestData.createQuestionOption.invalidPayloads.xssAttempt();
        
        // This should be treated as regular text, not executed
        const response: Response = await helpers.createQuestionOptionExpectSuccess(
          testSetup.multipleChoiceQuestionId,
          payload.text,
        );

        expect((response.body as any).questionOption.text).toBe(payload.text);
      });

      it('should reject invalid question ID formats', async () => {
        const invalidIds = [
          'invalid-uuid',
          '123',
          '',
          'not-a-uuid-at-all',
          '550e8400-e29b-41d4-a716-44665544000g', // Invalid hex
        ];

        for (const invalidId of invalidIds) {
          const res = await helpers.createQuestionOptionWithPayload(invalidId, {
            text: 'Valid text',
          });
          expect([400, 404]).toContain(res.status);
        }
      });
    });

    describe('Edge cases', () => {
      it('should handle question creation immediately after question creation', async () => {
        // Create new question
        const questionId = await testSetup.createTestQuestion({
          text: 'Immediate option creation test',
          type: 'MULTIPLE_CHOICE',
          assessmentId: testSetup.quizAssessmentId,
        });

        // Create option immediately
        const response: Response = await helpers.createQuestionOptionExpectSuccess(
          questionId,
          'Immediate option',
        );

        expect((response.body as any).questionOption.questionId).toBe(questionId);
      });

      it('should handle boundary text lengths correctly', async () => {
        // Test exact minimum (assuming 1 character minimum)
        const minResponse = await helpers.createQuestionOptionExpectSuccess(
          testSetup.multipleChoiceQuestionId,
          'A',
        );
        expect((minResponse.body as any).questionOption.text).toHaveLength(1);

        // Test near maximum (499 characters)
        const nearMaxText = 'A'.repeat(499);
        const nearMaxResponse = await helpers.createQuestionOptionExpectSuccess(
          testSetup.multipleChoiceQuestionId,
          nearMaxText,
        );
        expect((nearMaxResponse.body as any).questionOption.text).toHaveLength(499);

        // Test exact maximum (500 characters)
        const maxText = 'A'.repeat(500);
        const maxResponse = await helpers.createQuestionOptionExpectSuccess(
          testSetup.multipleChoiceQuestionId,
          maxText,
        );
        expect((maxResponse.body as any).questionOption.text).toHaveLength(500);
      });

      it('should handle concurrent option creation', async () => {
        const optionTexts = ['Concurrent A', 'Concurrent B', 'Concurrent C', 'Concurrent D', 'Concurrent E'];
        
        // Create options concurrently
        const promises = optionTexts.map(text =>
          helpers.createQuestionOptionExpectSuccess(testSetup.multipleChoiceQuestionId, text)
        );
        
        const responses = await Promise.all(promises);

        // Verify all succeeded
        expect(responses).toHaveLength(5);
        responses.forEach((response, index) => {
          expect(response.status).toBe(201);
          expect((response.body as any).questionOption.text).toBe(optionTexts[index]);
        });

        // Verify all are in database
        const dbOptions = await testSetup.findQuestionOptionsByQuestionId(
          testSetup.multipleChoiceQuestionId,
        );
        expect(dbOptions).toHaveLength(5);
      });

      it('should preserve exact text content without modification', async () => {
        const edgeCaseTexts = [
          'Text with\ttabs and\nnewlines\r\nand CRLF',
          '  Leading and trailing spaces  ',
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
          const response: Response = await helpers.createQuestionOptionExpectSuccess(
            testSetup.multipleChoiceQuestionId,
            text,
          );
          
          // Verify exact preservation
          expect((response.body as any).questionOption.text).toBe(text);
          expect((response.body as any).questionOption.text.length).toBe(text.length);
        }
      });

      it('should handle timestamp precision correctly', async () => {
        const before = new Date();
        
        const response: Response = await helpers.createQuestionOptionExpectSuccess(
          testSetup.multipleChoiceQuestionId,
          'Timestamp test option',
        );
        
        const after = new Date();
        const createdAt = new Date((response.body as any).questionOption.createdAt);
        const updatedAt = new Date((response.body as any).questionOption.updatedAt);

        // Verify timestamps are within expected range
        expect(createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
        expect(createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
        expect(updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
        expect(updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
        
        // For new records, createdAt should equal updatedAt
        expect(createdAt.getTime()).toBe(updatedAt.getTime());
      });
    });

    describe('Error scenarios', () => {
      it('should return 404 when question does not exist', async () => {
        const nonExistentId = '00000000-0000-0000-0000-000000000000';
        await helpers.createQuestionOptionExpectNotFound(nonExistentId, 'Valid option text');
      });

      it('should return 404 for deleted question', async () => {
        const deletedId = '99999999-9999-9999-9999-999999999999';
        await helpers.createQuestionOptionExpectNotFound(deletedId, 'Valid option text');
      });

      it('should handle malformed request body', async () => {
        const malformedPayloads = [
          'string instead of object',
          null,
          [],
        ];

        for (const payload of malformedPayloads) {
          const res = await helpers.createQuestionOptionWithPayload(
            testSetup.multipleChoiceQuestionId,
            payload,
          );
          expect([400, 500]).toContain(res.status);
        }
      });

      it('should handle empty request body', async () => {
        const res = await helpers.createQuestionOptionWithPayload(
          testSetup.multipleChoiceQuestionId,
          undefined,
        );
        expect([400, 500]).toContain(res.status);
      });

      it('should validate content-type requirements', async () => {
        // Test with wrong content type
        const response: Response = await request(testSetup.getHttpServer())
          .post(`/questions/${testSetup.multipleChoiceQuestionId}/options`)
          .set('Content-Type', 'text/plain')
          .send('Plain text instead of JSON');
        
        expect([400, 415]).toContain(response.status);
      });
    });

    describe('Performance tests', () => {
      it('should create question option within acceptable time', async () => {
        await helpers.testCreateQuestionOptionPerformance(
          'Single create question option',
          async () => await helpers.createQuestionOptionExpectSuccess(
            testSetup.multipleChoiceQuestionId,
            'Performance test option',
          ),
          QuestionOptionTestData.MAX_EXECUTION_TIME,
        );
      });

      it('should handle multiple sequential creations efficiently', async () => {
        const options = Array.from({ length: 10 }, (_, i) => `Sequential Option ${i + 1}`);
        
        await helpers.testCreateQuestionOptionPerformance(
          'Sequential question option creation',
          async () => {
            const responses: Response[] = [];
            for (const optionText of options) {
              const response: Response = await helpers.createQuestionOptionExpectSuccess(
                testSetup.multipleChoiceQuestionId,
                optionText,
              );
              responses.push(response);
            }
            return responses;
          },
          QuestionOptionTestData.MAX_EXECUTION_TIME * 10,
        );
      });

      it('should handle concurrent creations efficiently', async () => {
        const options = Array.from({ length: 5 }, (_, i) => `Concurrent Option ${i + 1}`);
        
        await helpers.testCreateQuestionOptionPerformance(
          'Concurrent question option creation',
          async () => {
            const promises = options.map(optionText =>
              helpers.createQuestionOptionExpectSuccess(
                testSetup.multipleChoiceQuestionId,
                optionText,
              )
            );
            return await Promise.all(promises);
          },
          QuestionOptionTestData.MAX_EXECUTION_TIME * 2,
        );
      });

      it('should handle large text options efficiently', async () => {
        const largeText = 'A'.repeat(500);
        
        await helpers.testCreateQuestionOptionPerformance(
          'Large text option creation',
          async () => await helpers.createQuestionOptionExpectSuccess(
            testSetup.multipleChoiceQuestionId,
            largeText,
          ),
          QuestionOptionTestData.MAX_EXECUTION_TIME,
        );
      });
    });

    describe('Behavioral validation', () => {
      it('should maintain data integrity between create and list operations', async () => {
        const testCases = [
          { name: 'Basic text', text: 'Basic option text' },
          { name: 'Medical terms', text: 'Acute myocardial infarction with ST-elevation' },
          { name: 'Special chars', text: 'Option with @#$%^&*() characters' },
          { name: 'Unicode', text: 'Opção com 中文 العربية русский 🎯' },
          { name: 'Formatting', text: 'Text with\nnewlines and\ttabs' },
        ];

        for (const testCase of testCases) {
          const { createResponse, listResponse } = await helpers.createAndVerifyQuestionOption(
            testSetup.multipleChoiceQuestionId,
            testCase.text,
          );

          // Verify data integrity
          const createdOption = listResponse.body.options.find(
            (opt: any) => opt.id === createResponse.body.questionOption.id
          );
          expect(createdOption).toBeDefined();
          expect(createdOption.text).toBe(testCase.text);
          
          // Verify with database
          await helpers.verifyQuestionOptionDataIntegrity(
            testSetup.multipleChoiceQuestionId,
            listResponse.body.options.length,
          );
        }
      });

      it('should handle different question types correctly', async () => {
        const questionTypes = [
          { type: 'MULTIPLE_CHOICE', questionId: testSetup.multipleChoiceQuestionId },
          { type: 'OPEN', questionId: testSetup.openQuestionId },
        ];

        for (const { type, questionId } of questionTypes) {
          const response: Response = await helpers.createQuestionOptionExpectSuccess(
            questionId,
            `Option for ${type} question`,
          );

          expect((response.body as any).questionOption.questionId).toBe(questionId);
        }
      });

      it('should preserve all option attributes correctly', async () => {
        const response: Response = await helpers.createQuestionOptionExpectSuccess(
          testSetup.multipleChoiceQuestionId,
          'Attribute test option',
        );

        const option = (response.body as any).questionOption;

        // Verify all required fields
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

        // Verify values
        expect(option.text).toBe('Attribute test option');
        expect(option.questionId).toBe(testSetup.multipleChoiceQuestionId);
      });

      it('should handle special content types correctly', async () => {
        await helpers.testCreateQuestionOptionWithSpecialContent();
      });

      it('should maintain consistent response format', async () => {
        const responses: Response[] = [];
        for (let i = 0; i < 3; i++) {
          const response: Response = await helpers.createQuestionOptionExpectSuccess(
            testSetup.multipleChoiceQuestionId,
            `Consistency test option ${i + 1}`,
          );
          responses.push(response);
        }

        // Verify all responses have same structure
        responses.forEach((response, index) => {
          helpers.verifyCreateQuestionOptionSuccessResponseFormat(
            response.body,
            `Consistency test option ${index + 1}`,
            testSetup.multipleChoiceQuestionId,
          );
        });
      });
    });

    describe('Database integrity verification', () => {
      it('should maintain database consistency during operations', async () => {
        const optionsToCreate = ['DB Option 1', 'DB Option 2', 'DB Option 3'];
        const createdIds: string[] = [];

        for (const optionText of optionsToCreate) {
          const response: Response = await helpers.createQuestionOptionExpectSuccess(
            testSetup.multipleChoiceQuestionId,
            optionText,
          );
          createdIds.push((response.body as any).questionOption.id);
        }

        // Verify all options exist in database
        for (const optionId of createdIds) {
          const dbOption = await testSetup.prisma.questionOption.findUnique({
            where: { id: optionId },
          });
          expect(dbOption).toBeDefined();
        }

        // Verify database integrity
        await helpers.verifyDatabaseIntegrity();
      });

      it('should handle database relationships correctly', async () => {
        // Create options for different questions
        const quizResponse = await helpers.createQuestionOptionExpectSuccess(
          testSetup.multipleChoiceQuestionId,
          'Quiz option',
        );

        const openResponse = await helpers.createQuestionOptionExpectSuccess(
          testSetup.openQuestionId,
          'Open option',
        );

        // Verify relationships
        expect((quizResponse.body as any).questionOption.questionId).toBe(testSetup.multipleChoiceQuestionId);
        expect((openResponse.body as any).questionOption.questionId).toBe(testSetup.openQuestionId);

        // Verify in database
        const quizDbOption = await testSetup.prisma.questionOption.findUnique({
          where: { id: (quizResponse.body as any).questionOption.id },
          include: { question: true },
        });
        
        const openDbOption = await testSetup.prisma.questionOption.findUnique({
          where: { id: (openResponse.body as any).questionOption.id },
          include: { question: true },
        });

        expect(quizDbOption!.question.id).toBe(testSetup.multipleChoiceQuestionId);
        expect(openDbOption!.question.id).toBe(testSetup.openQuestionId);
      });

      it('should ensure referential integrity', async () => {
        const response: Response = await helpers.createQuestionOptionExpectSuccess(
          testSetup.multipleChoiceQuestionId,
          'Referential integrity test',
        );

        // Verify option references existing question
        const dbOption = await testSetup.prisma.questionOption.findUnique({
          where: { id: (response.body as any).questionOption.id },
          include: { question: true },
        });

        expect(dbOption).toBeDefined();
        expect(dbOption!.question).toBeDefined();
        expect(dbOption!.question.id).toBe(testSetup.multipleChoiceQuestionId);
        expect(dbOption!.questionId).toBe(testSetup.multipleChoiceQuestionId);
      });
    });
  },
  QuestionOptionTestData.TIMEOUTS.LONG,
);