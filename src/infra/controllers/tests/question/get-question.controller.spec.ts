// src/infra/controllers/tests/question/get-question.controller.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';

import { QuestionControllerTestSetup } from './shared/question-controller-test-setup';
import { QuestionControllerTestHelpers } from './shared/question-controller-test-helpers';
import { QuestionControllerTestData } from './shared/question-controller-test-data';

describe('QuestionController - GetQuestion', () => {
  let testSetup: QuestionControllerTestSetup;
  let helpers: QuestionControllerTestHelpers;

  beforeEach(() => {
    testSetup = new QuestionControllerTestSetup();
    helpers = new QuestionControllerTestHelpers(testSetup);
  });

  describe('Success scenarios', () => {
    it('should return question for valid ID', async () => {
      const requestData =
        QuestionControllerTestData.getQuestion.validIds.standard();
      const expectedQuestion = {
        id: requestData.id,
        text: 'What is the capital of Brazil?',
        type: 'MULTIPLE_CHOICE',
        assessmentId: helpers.generateUniqueId(),
      };

      const result = await helpers.executeGetByIdExpectSuccess(
        requestData.id,
        expectedQuestion,
      );

      helpers.verifyGetQuestionResponseStructure(
        result,
        requestData.id,
        expectedQuestion,
      );
    });

    it('should return multiple choice question with all fields', async () => {
      const requestData =
        QuestionControllerTestData.getQuestion.validIds.multipleChoice();
      const expectedQuestion = {
        id: requestData.id,
        text: 'Which organ performs gas exchange in the respiratory system?',
        type: 'MULTIPLE_CHOICE',
        assessmentId: helpers.generateUniqueId(),
        argumentId: helpers.generateUniqueId(),
      };

      const result = await helpers.executeGetByIdExpectSuccess(
        requestData.id,
        expectedQuestion,
      );

      helpers.verifyGetQuestionResponseStructure(
        result,
        requestData.id,
        expectedQuestion,
      );
    });

    it('should return open question with argument', async () => {
      const requestData =
        QuestionControllerTestData.getQuestion.validIds.openQuestion();
      const expectedQuestion = {
        id: requestData.id,
        text: 'Explain the pathophysiology of hypertension and discuss the current treatment guidelines.',
        type: 'OPEN',
        assessmentId: helpers.generateUniqueId(),
        argumentId: helpers.generateUniqueId(),
      };

      const result = await helpers.executeGetByIdExpectSuccess(
        requestData.id,
        expectedQuestion,
      );

      helpers.verifyGetQuestionResponseStructure(
        result,
        requestData.id,
        expectedQuestion,
      );
    });

    it('should return question without argument', async () => {
      const requestData =
        QuestionControllerTestData.getQuestion.validIds.withoutArgument();
      const expectedQuestion = {
        id: requestData.id,
        text: 'What is the correct answer?',
        type: 'MULTIPLE_CHOICE',
        assessmentId: helpers.generateUniqueId(),
        argumentId: undefined,
      };

      const result = await helpers.executeGetByIdExpectSuccess(
        requestData.id,
        expectedQuestion,
      );

      helpers.verifyGetQuestionResponseStructure(
        result,
        requestData.id,
        expectedQuestion,
      );
      expect(result.question.argumentId).toBeUndefined();
    });

    it('should handle mixed case UUID correctly', async () => {
      const mixedCaseId = 'AAAAAAAA-bbbb-CCCC-dddd-EEEEEEEEEEEE';
      const expectedQuestion = {
        id: mixedCaseId,
        text: 'Mixed case UUID test question',
        type: 'OPEN',
        assessmentId: helpers.generateUniqueId(),
      };

      const result = await helpers.executeGetByIdExpectSuccess(
        mixedCaseId,
        expectedQuestion,
      );

      helpers.verifyGetQuestionResponseStructure(
        result,
        mixedCaseId,
        expectedQuestion,
      );
    });

    it('should return question with special characters in text', async () => {
      const requestData =
        QuestionControllerTestData.getQuestion.validIds.edgeCase();
      const expectedQuestion = {
        id: requestData.id,
        text: 'Question with special chars: @#$%^&*()! and symbols: ±≤≥≠≈',
        type: 'MULTIPLE_CHOICE',
        assessmentId: helpers.generateUniqueId(),
      };

      const result = await helpers.executeGetByIdExpectSuccess(
        requestData.id,
        expectedQuestion,
      );

      helpers.verifyGetQuestionResponseStructure(
        result,
        requestData.id,
        expectedQuestion,
      );
    });

    it('should return question with unicode characters', async () => {
      const requestData =
        QuestionControllerTestData.getQuestion.validIds.standard();
      const expectedQuestion = {
        id: requestData.id,
        text: 'Questão em português 中文 العربية русский with emojis 🎯🚀',
        type: 'OPEN',
        assessmentId: helpers.generateUniqueId(),
      };

      const result = await helpers.executeGetByIdExpectSuccess(
        requestData.id,
        expectedQuestion,
      );

      helpers.verifyGetQuestionResponseStructure(
        result,
        requestData.id,
        expectedQuestion,
      );
    });

    it('should return question with newlines and formatting', async () => {
      const requestData =
        QuestionControllerTestData.getQuestion.validIds.standard();
      const expectedQuestion = {
        id: requestData.id,
        text: 'Question with\nnewlines and\ntabs\tfor formatting',
        type: 'OPEN',
        assessmentId: helpers.generateUniqueId(),
      };

      const result = await helpers.executeGetByIdExpectSuccess(
        requestData.id,
        expectedQuestion,
      );

      helpers.verifyGetQuestionResponseStructure(
        result,
        requestData.id,
        expectedQuestion,
      );
    });
  });

  describe('Validation and Invalid Input scenarios', () => {
    it('should reject invalid UUID format', async () => {
      const invalidId =
        QuestionControllerTestData.getQuestion.invalidIds.invalidFormat().id;

      await helpers.executeGetByIdExpectBadRequest(invalidId);
    });

    it('should reject non-UUID string', async () => {
      const invalidId =
        QuestionControllerTestData.getQuestion.invalidIds.notUuid().id;

      await helpers.executeGetByIdExpectBadRequest(invalidId);
    });

    it('should reject too short ID', async () => {
      const invalidId =
        QuestionControllerTestData.getQuestion.invalidIds.tooShort().id;

      await helpers.executeGetByIdExpectBadRequest(invalidId);
    });

    it('should reject too long ID', async () => {
      const invalidId =
        QuestionControllerTestData.getQuestion.invalidIds.tooLong().id;

      await helpers.executeGetByIdExpectBadRequest(invalidId);
    });

    it('should reject ID with wrong hyphen placement', async () => {
      const invalidId =
        QuestionControllerTestData.getQuestion.invalidIds.wrongHyphens().id;

      await helpers.executeGetByIdExpectBadRequest(invalidId);
    });

    it('should reject ID missing hyphens', async () => {
      const invalidId =
        QuestionControllerTestData.getQuestion.invalidIds.missingHyphens().id;

      await helpers.executeGetByIdExpectBadRequest(invalidId);
    });

    it('should reject ID with special characters', async () => {
      const invalidId =
        QuestionControllerTestData.getQuestion.invalidIds.specialChars().id;

      await helpers.executeGetByIdExpectBadRequest(invalidId);
    });

    it('should reject ID with invalid hex characters', async () => {
      const invalidId =
        QuestionControllerTestData.getQuestion.invalidIds.invalidChars().id;

      await helpers.executeGetByIdExpectBadRequest(invalidId);
    });

    it('should reject empty string ID', async () => {
      const invalidId =
        QuestionControllerTestData.getQuestion.invalidIds.emptyString().id;

      await helpers.executeGetByIdExpectBadRequest(invalidId);
    });

    it('should reject ID with whitespace', async () => {
      const invalidId =
        QuestionControllerTestData.getQuestion.invalidIds.withWhitespace().id;

      await helpers.executeGetByIdExpectBadRequest(invalidId);
    });

    it('should reject ID with tabs', async () => {
      const invalidId =
        QuestionControllerTestData.getQuestion.invalidIds.withTabs().id;

      await helpers.executeGetByIdExpectBadRequest(invalidId);
    });

    it('should reject ID with newlines', async () => {
      const invalidId =
        QuestionControllerTestData.getQuestion.invalidIds.withNewlines().id;

      await helpers.executeGetByIdExpectBadRequest(invalidId);
    });

    it('should reject ID with unicode characters', async () => {
      const invalidId =
        QuestionControllerTestData.getQuestion.invalidIds.unicodeChars().id;

      await helpers.executeGetByIdExpectBadRequest(invalidId);
    });

    it('should reject ID with emojis', async () => {
      const invalidId =
        QuestionControllerTestData.getQuestion.invalidIds.emojis().id;

      await helpers.executeGetByIdExpectBadRequest(invalidId);
    });
  });

  describe('Edge cases', () => {
    it('should handle all zeros UUID', async () => {
      const zerosId =
        QuestionControllerTestData.getQuestion.nonExistentIds.zeros().id;

      await helpers.executeGetByIdExpectNotFound(zerosId);
    });

    it('should handle all f characters UUID', async () => {
      const requestData =
        QuestionControllerTestData.getQuestion.validIds.edgeCase();
      const expectedQuestion = {
        id: requestData.id,
        text: 'Edge case question',
        type: 'MULTIPLE_CHOICE',
        assessmentId: helpers.generateUniqueId(),
      };

      const result = await helpers.executeGetByIdExpectSuccess(
        requestData.id,
        expectedQuestion,
      );

      helpers.verifyGetQuestionResponseStructure(
        result,
        requestData.id,
        expectedQuestion,
      );
    });

    it('should handle question with minimum text length', async () => {
      const requestData =
        QuestionControllerTestData.getQuestion.validIds.standard();
      const expectedQuestion = {
        id: requestData.id,
        text: '1234567890', // exactly 10 characters
        type: 'MULTIPLE_CHOICE',
        assessmentId: helpers.generateUniqueId(),
      };

      const result = await helpers.executeGetByIdExpectSuccess(
        requestData.id,
        expectedQuestion,
      );

      helpers.verifyGetQuestionResponseStructure(
        result,
        requestData.id,
        expectedQuestion,
      );
      expect(result.question.text).toHaveLength(10);
    });

    it('should handle question with maximum text length', async () => {
      const requestData =
        QuestionControllerTestData.getQuestion.validIds.standard();
      const expectedQuestion = {
        id: requestData.id,
        text: 'A'.repeat(1000), // exactly 1000 characters
        type: 'OPEN',
        assessmentId: helpers.generateUniqueId(),
      };

      const result = await helpers.executeGetByIdExpectSuccess(
        requestData.id,
        expectedQuestion,
      );

      helpers.verifyGetQuestionResponseStructure(
        result,
        requestData.id,
        expectedQuestion,
      );
      expect(result.question.text).toHaveLength(1000);
    });

    it('should handle question created and updated at same time', async () => {
      const requestData =
        QuestionControllerTestData.getQuestion.validIds.standard();
      const now = new Date();
      const expectedQuestion = {
        id: requestData.id,
        text: 'Question with same timestamps',
        type: 'MULTIPLE_CHOICE',
        assessmentId: helpers.generateUniqueId(),
        createdAt: now,
        updatedAt: now,
      };

      const result = await helpers.executeGetByIdExpectSuccess(
        requestData.id,
        expectedQuestion,
      );

      helpers.verifyGetQuestionResponseStructure(
        result,
        requestData.id,
        expectedQuestion,
      );
      expect(result.question.createdAt).toEqual(result.question.updatedAt);
    });

    it('should handle question with future timestamps', async () => {
      const requestData =
        QuestionControllerTestData.getQuestion.validIds.standard();
      const futureDate = new Date('2030-01-01T00:00:00.000Z');
      const expectedQuestion = {
        id: requestData.id,
        text: 'Question with future timestamp',
        type: 'OPEN',
        assessmentId: helpers.generateUniqueId(),
        createdAt: futureDate,
        updatedAt: futureDate,
      };

      const result = await helpers.executeGetByIdExpectSuccess(
        requestData.id,
        expectedQuestion,
      );

      helpers.verifyGetQuestionResponseStructure(
        result,
        requestData.id,
        expectedQuestion,
      );
    });
  });

  describe('Error scenarios', () => {
    it('should throw NotFoundException when question does not exist', async () => {
      const nonExistentId =
        QuestionControllerTestData.getQuestion.nonExistentIds.notFound().id;

      await helpers.executeGetByIdExpectNotFound(nonExistentId);
    });

    it('should throw NotFoundException for deleted question', async () => {
      const deletedId =
        QuestionControllerTestData.getQuestion.nonExistentIds.deleted().id;

      await helpers.executeGetByIdExpectNotFound(deletedId);
    });

    it('should throw InternalServerErrorException on repository error', async () => {
      const validId =
        QuestionControllerTestData.getQuestion.validIds.standard().id;

      await helpers.executeGetByIdExpectInternalError(validId, 'repository');
    });

    it('should throw InternalServerErrorException on unknown error', async () => {
      const validId =
        QuestionControllerTestData.getQuestion.validIds.standard().id;

      await helpers.executeGetByIdExpectInternalError(validId, 'unknown');
    });

    it('should handle repository timeout error', async () => {
      const validId =
        QuestionControllerTestData.getQuestion.validIds.standard().id;

      helpers.mockGetQuestionRepositoryError('Database timeout');

      await expect(testSetup.controller.getById(validId)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(testSetup.getUseCase.execute).toHaveBeenCalledWith({
        id: validId,
      });
    });

    it('should handle repository connection error', async () => {
      const validId =
        QuestionControllerTestData.getQuestion.validIds.standard().id;

      helpers.mockGetQuestionRepositoryError('Connection refused');

      await expect(testSetup.controller.getById(validId)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(testSetup.getUseCase.execute).toHaveBeenCalledWith({
        id: validId,
      });
    });

    it('should handle validation error with multiple details', async () => {
      const invalidId =
        QuestionControllerTestData.getQuestion.invalidIds.invalidFormat().id;

      helpers.mockGetQuestionValidationError([
        'ID must be a valid UUID',
        'ID cannot be empty',
        'Invalid format',
      ]);

      await expect(testSetup.controller.getById(invalidId)).rejects.toThrow(
        BadRequestException,
      );

      expect(testSetup.getUseCase.execute).toHaveBeenCalledWith({
        id: invalidId,
      });
    });
  });

  describe('Request format validation', () => {
    it('should handle number as ID parameter', async () => {
      const numberId =
        QuestionControllerTestData.getQuestion.invalidIds.numberValue().id;

      // Controller will receive number as string in path parameter
      await helpers.executeGetByIdExpectBadRequest(numberId.toString());
    });

    it('should handle boolean as ID parameter', async () => {
      const booleanId =
        QuestionControllerTestData.getQuestion.invalidIds.booleanValue().id;

      // Controller will receive boolean as string in path parameter
      await helpers.executeGetByIdExpectBadRequest(booleanId.toString());
    });
  });

  describe('Performance tests', () => {
    it('should execute getById within acceptable time', async () => {
      const validId =
        QuestionControllerTestData.getQuestion.validIds.standard().id;

      const { executionTime } = await helpers.testGetQuestionPerformance(
        validId,
        100,
      );

      expect(executionTime).toBeLessThan(100);
    });

    it('should handle concurrent requests efficiently', async () => {
      const concurrentIds = [
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      ];

      const { executionTime } = await helpers.testConcurrentGetQuestionRequests(
        concurrentIds,
        500,
      );

      expect(executionTime).toBeLessThan(500);
    });
  });

  describe('Behavioral validation', () => {
    it('should call use case with exact ID parameter', async () => {
      const testId =
        QuestionControllerTestData.getQuestion.validIds.standard().id;

      await helpers.executeGetByIdExpectSuccess(testId);

      expect(testSetup.getUseCase.execute).toHaveBeenCalledWith({ id: testId });
      expect(testSetup.getUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should preserve ID case sensitivity', async () => {
      const mixedCaseId = 'AAAABBBB-cccc-DDDD-eeee-FFFFGGGGHHHHJ'; // Invalid hex J

      await helpers.executeGetByIdExpectBadRequest(mixedCaseId);

      expect(testSetup.getUseCase.execute).toHaveBeenCalledWith({
        id: mixedCaseId,
      });
    });

    it('should not modify request data', async () => {
      const originalId =
        QuestionControllerTestData.getQuestion.validIds.standard().id;
      const idCopy = originalId.slice(); // Create copy

      await helpers.executeGetByIdExpectSuccess(originalId);

      expect(originalId).toBe(idCopy); // Ensure original wasn't modified
    });

    it('should return consistent response structure', async () => {
      const testId =
        QuestionControllerTestData.getQuestion.validIds.standard().id;

      const result1 = await helpers.executeGetByIdExpectSuccess(testId);
      testSetup.resetMocks();
      const result2 = await helpers.executeGetByIdExpectSuccess(testId);

      expect(Object.keys(result1)).toEqual(Object.keys(result2));
      expect(Object.keys(result1.question)).toEqual(
        Object.keys(result2.question),
      );
    });

    it('should handle rapid successive requests', async () => {
      const testId =
        QuestionControllerTestData.getQuestion.validIds.standard().id;

      // Mock success for multiple calls
      for (let i = 0; i < 3; i++) {
        helpers.mockGetQuestionSuccess({ id: testId });
      }

      const promises = [
        testSetup.controller.getById(testId),
        testSetup.controller.getById(testId),
        testSetup.controller.getById(testId),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.success).toBe(true);
        expect(result.question.id).toBe(testId);
      });

      expect(testSetup.getUseCase.execute).toHaveBeenCalledTimes(3);
    });
  });

  describe('Comprehensive error testing', () => {
    it('should test all invalid ID formats systematically', async () => {
      await helpers.testInvalidIdFormats();
    });

    it('should test all error scenarios for a valid ID', async () => {
      const validId =
        QuestionControllerTestData.getQuestion.validIds.standard().id;

      await helpers.testAllGetQuestionErrorScenarios(validId);
    });
  });
});
