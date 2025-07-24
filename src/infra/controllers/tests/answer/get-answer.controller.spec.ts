// src/infra/controllers/tests/answer/get-answer.controller.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AnswerControllerTestSetup } from './shared/answer-controller-test-setup';
import { AnswerControllerTestHelpers } from './shared/answer-controller-test-helpers';
import { AnswerControllerTestData } from './shared/answer-controller-test-data';

describe('AnswerController - getById', () => {
  let testSetup: AnswerControllerTestSetup;
  let testHelpers: AnswerControllerTestHelpers;

  beforeEach(() => {
    testSetup = new AnswerControllerTestSetup();
    testHelpers = new AnswerControllerTestHelpers(testSetup);
  });

  describe('Success Cases', () => {
    it('should return answer when found with valid ID', async () => {
      const params = AnswerControllerTestData.validIds.standard();
      const expectedAnswer = AnswerControllerTestData.sampleAnswers.standard;

      const result = await testHelpers.executeGetByIdExpectSuccess(
        params,
        expectedAnswer,
      );

      testHelpers.verifyGetAnswerResponseStructure(
        result,
        params.id,
        expectedAnswer,
      );
    });

    it('should return answer for multiple choice question', async () => {
      const params = AnswerControllerTestData.validIds.multipleChoice();
      const expectedAnswer =
        AnswerControllerTestData.sampleAnswers.multipleChoiceQuiz;

      const result = await testHelpers.executeGetByIdExpectSuccess(
        params,
        expectedAnswer,
      );

      expect(result.answer.correctOptionId).toBeDefined();
      expect(result.answer.correctOptionId).toBeTruthy();
    });

    it('should return answer for open question', async () => {
      const params = AnswerControllerTestData.validIds.openQuestion();
      const expectedAnswer =
        AnswerControllerTestData.sampleAnswers.openQuestionAnswer;

      const result = await testHelpers.executeGetByIdExpectSuccess(
        params,
        expectedAnswer,
      );

      expect(result.answer.correctOptionId).toBeUndefined();
    });

    it('should return answer with translations', async () => {
      const params = AnswerControllerTestData.validIds.withTranslations();
      const expectedAnswer =
        AnswerControllerTestData.sampleAnswers.medicalContent;

      const result = await testHelpers.executeGetByIdExpectSuccess(
        params,
        expectedAnswer,
      );

      expect(result.answer.translations).toBeDefined();
      expect(Array.isArray(result.answer.translations)).toBe(true);
      expect(result.answer.translations.length).toBeGreaterThan(0);
    });

    it('should return answer with special characters', async () => {
      const params = AnswerControllerTestData.validIds.withoutTranslations();
      const expectedAnswer =
        AnswerControllerTestData.sampleAnswers.withSpecialChars;

      const result = await testHelpers.executeGetByIdExpectSuccess(
        params,
        expectedAnswer,
      );

      expect(result.answer.explanation).toContain('@#$%^&*()!');
      expect(result.answer.explanation).toContain('±≤≥≠≈');
    });

    it('should return answer with unicode characters', async () => {
      const params = AnswerControllerTestData.validIds.withTranslations();
      const expectedAnswer = AnswerControllerTestData.sampleAnswers.withUnicode;

      const result = await testHelpers.executeGetByIdExpectSuccess(
        params,
        expectedAnswer,
      );

      expect(result.answer.explanation).toContain('português');
      expect(result.answer.explanation).toContain('中文');
      expect(result.answer.explanation).toContain('🎯🚀');
    });

    it('should return answer with long explanation', async () => {
      const params = AnswerControllerTestData.validIds.standard();
      const expectedAnswer =
        AnswerControllerTestData.sampleAnswers.longExplanation;

      const result = await testHelpers.executeGetByIdExpectSuccess(
        params,
        expectedAnswer,
      );

      expect(result.answer.explanation.length).toBeGreaterThan(400);
    });

    it('should return answer with medical content', async () => {
      const params = AnswerControllerTestData.validIds.medicalContent();
      const expectedAnswer =
        AnswerControllerTestData.sampleAnswers.medicalContent;

      const result = await testHelpers.executeGetByIdExpectSuccess(
        params,
        expectedAnswer,
      );

      expect(result.answer.explanation).toContain('Hypertension');
      expect(result.answer.explanation).toContain('140 mmHg');
      expect(result.answer.explanation).toContain('90 mmHg');
    });
  });

  describe('Validation Errors', () => {
    it('should throw BadRequestException for invalid UUID format', async () => {
      const params = AnswerControllerTestData.invalidIds.invalidFormat();

      await testHelpers.executeGetByIdExpectBadRequest(params);
    });

    it('should throw BadRequestException for non-UUID string', async () => {
      const params = AnswerControllerTestData.invalidIds.notUuid();

      await testHelpers.executeGetByIdExpectBadRequest(params);
    });

    it('should throw BadRequestException for too short ID', async () => {
      const params = AnswerControllerTestData.invalidIds.tooShort();

      await testHelpers.executeGetByIdExpectBadRequest(params);
    });

    it('should throw BadRequestException for too long ID', async () => {
      const params = AnswerControllerTestData.invalidIds.tooLong();

      await testHelpers.executeGetByIdExpectBadRequest(params);
    });

    it('should throw BadRequestException for wrong hyphen placement', async () => {
      const params = AnswerControllerTestData.invalidIds.wrongHyphens();

      await testHelpers.executeGetByIdExpectBadRequest(params);
    });

    it('should throw BadRequestException for missing hyphens', async () => {
      const params = AnswerControllerTestData.invalidIds.missingHyphens();

      await testHelpers.executeGetByIdExpectBadRequest(params);
    });

    it('should throw BadRequestException for special characters', async () => {
      const params = AnswerControllerTestData.invalidIds.specialChars();

      await testHelpers.executeGetByIdExpectBadRequest(params);
    });

    it('should throw BadRequestException for invalid hex characters', async () => {
      const params = AnswerControllerTestData.invalidIds.invalidChars();

      await testHelpers.executeGetByIdExpectBadRequest(params);
    });

    it('should throw BadRequestException for empty string', async () => {
      const params = AnswerControllerTestData.invalidIds.emptyString();

      await testHelpers.executeGetByIdExpectBadRequest(params);
    });

    it('should throw BadRequestException for null value', async () => {
      const params = AnswerControllerTestData.invalidIds.nullValue();

      await testHelpers.executeGetByIdExpectBadRequest(params);
    });

    it('should throw BadRequestException for undefined value', async () => {
      const params = AnswerControllerTestData.invalidIds.undefinedValue();

      await testHelpers.executeGetByIdExpectBadRequest(params);
    });

    it('should throw BadRequestException for number value', async () => {
      const params = AnswerControllerTestData.invalidIds.numberValue();

      await testHelpers.executeGetByIdExpectBadRequest(params);
    });

    it('should throw BadRequestException for boolean value', async () => {
      const params = AnswerControllerTestData.invalidIds.booleanValue();

      await testHelpers.executeGetByIdExpectBadRequest(params);
    });

    it('should throw BadRequestException for object value', async () => {
      const params = AnswerControllerTestData.invalidIds.objectValue();

      await testHelpers.executeGetByIdExpectBadRequest(params);
    });

    it('should throw BadRequestException for array value', async () => {
      const params = AnswerControllerTestData.invalidIds.arrayValue();

      await testHelpers.executeGetByIdExpectBadRequest(params);
    });

    it('should throw BadRequestException for whitespace padding', async () => {
      const params = AnswerControllerTestData.invalidIds.withWhitespace();

      await testHelpers.executeGetByIdExpectBadRequest(params);
    });

    it('should throw BadRequestException for tab characters', async () => {
      const params = AnswerControllerTestData.invalidIds.withTabs();

      await testHelpers.executeGetByIdExpectBadRequest(params);
    });

    it('should throw BadRequestException for newline characters', async () => {
      const params = AnswerControllerTestData.invalidIds.withNewlines();

      await testHelpers.executeGetByIdExpectBadRequest(params);
    });

    it('should throw BadRequestException for mixed case (depends on validation)', async () => {
      const params = AnswerControllerTestData.invalidIds.mixedCase();

      // Mixed case UUIDs might be valid - this depends on validation rules
      await testHelpers.executeGetByIdExpectBadRequest(params);
    });

    it('should throw BadRequestException for unicode characters', async () => {
      const params = AnswerControllerTestData.invalidIds.unicodeChars();

      await testHelpers.executeGetByIdExpectBadRequest(params);
    });

    it('should throw BadRequestException for emoji characters', async () => {
      const params = AnswerControllerTestData.invalidIds.emojis();

      await testHelpers.executeGetByIdExpectBadRequest(params);
    });
  });

  describe('Not Found Errors', () => {
    it('should throw NotFoundException when answer does not exist', async () => {
      const params = AnswerControllerTestData.nonExistentIds.notFound();

      await testHelpers.executeGetByIdExpectNotFound(params);
    });

    it('should throw NotFoundException for all-zeros UUID', async () => {
      const params = AnswerControllerTestData.nonExistentIds.zeros();

      await testHelpers.executeGetByIdExpectNotFound(params);
    });

    it('should throw NotFoundException for deleted answer', async () => {
      const params = AnswerControllerTestData.nonExistentIds.deleted();

      await testHelpers.executeGetByIdExpectNotFound(params);
    });
  });

  describe('Internal Server Errors', () => {
    it('should throw InternalServerErrorException on repository error', async () => {
      const params = AnswerControllerTestData.validIds.standard();

      await testHelpers.executeGetByIdExpectInternalError(params, 'repository');
    });

    it('should throw InternalServerErrorException on unknown error', async () => {
      const params = AnswerControllerTestData.validIds.standard();

      await testHelpers.executeGetByIdExpectInternalError(params, 'unknown');
    });
  });

  describe('Exception Response Structure', () => {
    it('should return proper BadRequestException structure', async () => {
      const params = AnswerControllerTestData.invalidIds.invalidFormat();

      try {
        await testHelpers.executeGetByIdExpectBadRequest(params);
      } catch (error) {
        testHelpers.verifyExceptionStructure(
          error,
          400,
          'INVALID_INPUT',
          'Invalid input data',
        );
      }
    });

    it('should return proper NotFoundException structure', async () => {
      const params = AnswerControllerTestData.nonExistentIds.notFound();

      try {
        await testHelpers.executeGetByIdExpectNotFound(params);
      } catch (error) {
        testHelpers.verifyExceptionStructure(
          error,
          404,
          'ANSWER_NOT_FOUND',
          'Answer not found',
        );
      }
    });

    it('should return proper InternalServerErrorException structure', async () => {
      const params = AnswerControllerTestData.validIds.standard();

      try {
        await testHelpers.executeGetByIdExpectInternalError(
          params,
          'repository',
        );
      } catch (error) {
        testHelpers.verifyExceptionStructure(error, 500, 'INTERNAL_ERROR');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle answer with empty translations array', async () => {
      const params = AnswerControllerTestData.validIds.withoutTranslations();
      const answerWithEmptyTranslations = {
        ...AnswerControllerTestData.sampleAnswers.standard,
        translations: [],
      };

      const result = await testHelpers.executeGetByIdExpectSuccess(
        params,
        answerWithEmptyTranslations,
      );

      expect(result.answer.translations).toEqual([]);
    });

    it('should handle answer with single translation', async () => {
      const params = AnswerControllerTestData.validIds.standard();
      const answerWithSingleTranslation = {
        ...AnswerControllerTestData.sampleAnswers.standard,
        translations: [
          {
            locale: 'pt',
            explanation: 'Única tradução em português',
          },
        ],
      };

      const result = await testHelpers.executeGetByIdExpectSuccess(
        params,
        answerWithSingleTranslation,
      );

      expect(result.answer.translations).toHaveLength(1);
      expect(result.answer.translations[0].locale).toBe('pt');
    });

    it('should handle answer with multiple translations', async () => {
      const params = AnswerControllerTestData.validIds.standard();
      const answerWithMultipleTranslations = {
        ...AnswerControllerTestData.sampleAnswers.medicalContent,
        translations: [
          { locale: 'pt', explanation: 'Explicação em português' },
          { locale: 'it', explanation: 'Spiegazione in italiano' },
          { locale: 'es', explanation: 'Explicación en español' },
        ],
      };

      const result = await testHelpers.executeGetByIdExpectSuccess(
        params,
        answerWithMultipleTranslations,
      );

      expect(result.answer.translations).toHaveLength(3);
      expect(result.answer.translations.map((t) => t.locale)).toEqual([
        'pt',
        'it',
        'es',
      ]);
    });

    it('should handle answer with minimal explanation', async () => {
      const params = AnswerControllerTestData.validIds.standard();
      const answerWithMinimalExplanation = {
        ...AnswerControllerTestData.sampleAnswers.standard,
        explanation: 'A',
      };

      const result = await testHelpers.executeGetByIdExpectSuccess(
        params,
        answerWithMinimalExplanation,
      );

      expect(result.answer.explanation).toBe('A');
    });
  });

  describe('Performance Tests', () => {
    it('should respond within acceptable time limits', async () => {
      const params = AnswerControllerTestData.validIds.standard();

      const { executionTime } = await testHelpers.testGetAnswerPerformance(
        params,
        100, // 100ms max
      );

      expect(executionTime).toBeLessThan(100);
    });

    it('should handle concurrent requests efficiently', async () => {
      const paramsArray = AnswerControllerTestData.performance.concurrent(5);

      const { executionTime } =
        await testHelpers.testConcurrentGetAnswerRequests(
          paramsArray,
          500, // 500ms max for 5 concurrent requests
        );

      expect(executionTime).toBeLessThan(500);
    });
  });

  describe('Integration with Use Case', () => {
    it('should call GetAnswerUseCase with correct parameters', async () => {
      const params = AnswerControllerTestData.validIds.standard();

      await testHelpers.executeGetByIdExpectSuccess(params);

      expect(testSetup.getAnswerUseCase.execute).toHaveBeenCalledWith({
        id: params.id,
      });
      expect(testSetup.getAnswerUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should handle use case returning Left with InvalidInputError', async () => {
      const params = AnswerControllerTestData.validIds.standard();

      await testHelpers.executeGetByIdExpectBadRequest(params);

      expect(testSetup.getAnswerUseCase.execute).toHaveBeenCalledWith({
        id: params.id,
      });
    });

    it('should handle use case returning Left with AnswerNotFoundError', async () => {
      const params = AnswerControllerTestData.validIds.standard();

      await testHelpers.executeGetByIdExpectNotFound(params);

      expect(testSetup.getAnswerUseCase.execute).toHaveBeenCalledWith({
        id: params.id,
      });
    });

    it('should handle use case returning Left with RepositoryError', async () => {
      const params = AnswerControllerTestData.validIds.standard();

      await testHelpers.executeGetByIdExpectInternalError(params, 'repository');

      expect(testSetup.getAnswerUseCase.execute).toHaveBeenCalledWith({
        id: params.id,
      });
    });

    it('should handle use case returning Left with unknown error', async () => {
      const params = AnswerControllerTestData.validIds.standard();

      await testHelpers.executeGetByIdExpectInternalError(params, 'unknown');

      expect(testSetup.getAnswerUseCase.execute).toHaveBeenCalledWith({
        id: params.id,
      });
    });
  });

  describe('Response Format Validation', () => {
    it('should return response in expected format', async () => {
      const params = AnswerControllerTestData.validIds.standard();
      const expectedAnswer = AnswerControllerTestData.sampleAnswers.standard;

      const result = await testHelpers.executeGetByIdExpectSuccess(
        params,
        expectedAnswer,
      );

      // Should match the expected response format from GetAnswerResponse
      expect(result).toEqual(
        AnswerControllerTestData.expectedResponses.withSpecificData(
          expectedAnswer,
        ),
      );
    });

    it('should return consistent response structure for multiple choice', async () => {
      const params = AnswerControllerTestData.validIds.multipleChoice();
      const expectedAnswer =
        AnswerControllerTestData.sampleAnswers.multipleChoiceQuiz;

      const result = await testHelpers.executeGetByIdExpectSuccess(
        params,
        expectedAnswer,
      );

      testHelpers.verifyGetAnswerResponseStructure(
        result,
        params.id,
        expectedAnswer,
      );
    });

    it('should return consistent response structure for open question', async () => {
      const params = AnswerControllerTestData.validIds.openQuestion();
      const expectedAnswer =
        AnswerControllerTestData.sampleAnswers.openQuestionAnswer;

      const result = await testHelpers.executeGetByIdExpectSuccess(
        params,
        expectedAnswer,
      );

      testHelpers.verifyGetAnswerResponseStructure(
        result,
        params.id,
        expectedAnswer,
      );
    });
  });
});
