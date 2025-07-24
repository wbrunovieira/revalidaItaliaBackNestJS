// src/infra/controllers/tests/question-option/post-create-question-option.controller.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { right, left } from '@/core/either';
import { QuestionOptionControllerTestSetup } from './shared/question-option-controller-test-setup';
import { QuestionOptionControllerTestHelpers } from './shared/question-option-controller-test-helpers';
import { QuestionOptionControllerTestData } from './shared/question-option-controller-test-data';
import { InvalidInputError } from '@/domain/assessment/application/use-cases/errors/invalid-input-error';
import { QuestionNotFoundError } from '@/domain/assessment/application/use-cases/errors/question-not-found-error';
import { RepositoryError } from '@/domain/assessment/application/use-cases/errors/repository-error';

describe('QuestionOptionController - createOption', () => {
  let testSetup: QuestionOptionControllerTestSetup;
  let testHelpers: QuestionOptionControllerTestHelpers;

  beforeEach(() => {
    testSetup = new QuestionOptionControllerTestSetup();
    testHelpers = new QuestionOptionControllerTestHelpers(testSetup);
  });

  describe('Success Cases', () => {
    it('should create a question option successfully', async () => {
      const questionId =
        QuestionOptionControllerTestData.VALID_QUESTION_IDS.MULTIPLE_CHOICE;
      const dto = QuestionOptionControllerTestData.VALID_DTOS.SIMPLE_OPTION;
      const expectedResponse =
        QuestionOptionControllerTestData.SUCCESS_RESPONSES.SIMPLE_OPTION;

      testSetup.createQuestionOptionUseCase.execute.mockResolvedValueOnce(
        right(expectedResponse),
      );

      const result = await testSetup.controller.createOption(questionId, dto);

      expect(result).toEqual(expectedResponse);
      testHelpers.expectUseCaseToHaveBeenCalledWith({
        text: dto.text,
        questionId,
      });
      testHelpers.expectUseCaseToHaveBeenCalledOnce();
    });

    it('should create a question option with special characters', async () => {
      const questionId =
        QuestionOptionControllerTestData.VALID_QUESTION_IDS.MULTIPLE_CHOICE;
      const dto =
        QuestionOptionControllerTestData.VALID_DTOS.OPTION_WITH_SPECIAL_CHARS;
      const expectedResponse =
        QuestionOptionControllerTestData.SUCCESS_RESPONSES
          .OPTION_WITH_SPECIAL_CHARS;

      testSetup.createQuestionOptionUseCase.execute.mockResolvedValueOnce(
        right(expectedResponse),
      );

      const result = await testSetup.controller.createOption(questionId, dto);

      expect(result).toEqual(expectedResponse);
      expect(result.questionOption.text).toBe(
        'São Paulo (Brasil) - R$ 1.500,00',
      );
    });

    it('should create a question option for open question', async () => {
      const questionId =
        QuestionOptionControllerTestData.VALID_QUESTION_IDS.OPEN_QUESTION;
      const dto = QuestionOptionControllerTestData.VALID_DTOS.MEDICAL_OPTION;
      const expectedResponse =
        QuestionOptionControllerTestData.SUCCESS_RESPONSES.MEDICAL_OPTION;

      testSetup.createQuestionOptionUseCase.execute.mockResolvedValueOnce(
        right(expectedResponse),
      );

      const result = await testSetup.controller.createOption(questionId, dto);

      expect(result).toEqual(expectedResponse);
      expect(result.questionOption.questionId).toBe(questionId);
    });

    it('should create a question option with long text', async () => {
      const questionId =
        QuestionOptionControllerTestData.VALID_QUESTION_IDS.MULTIPLE_CHOICE;
      const dto = QuestionOptionControllerTestData.VALID_DTOS.LONG_OPTION;
      const expectedResponse = {
        questionOption: {
          id: '550e8400-e29b-41d4-a716-446655440103',
          text: dto.text,
          questionId,
          createdAt: new Date('2024-01-01T12:00:00Z'),
          updatedAt: new Date('2024-01-01T12:00:00Z'),
        },
      };

      testSetup.createQuestionOptionUseCase.execute.mockResolvedValueOnce(
        right(expectedResponse),
      );

      const result = await testSetup.controller.createOption(questionId, dto);

      expect(result).toEqual(expectedResponse);
      expect(result.questionOption.text.length).toBeGreaterThan(100);
    });
  });

  describe('Error Cases', () => {
    it('should throw BadRequestException for invalid input', async () => {
      const questionId =
        QuestionOptionControllerTestData.VALID_QUESTION_IDS.MULTIPLE_CHOICE;
      const dto = QuestionOptionControllerTestData.INVALID_DTOS.EMPTY_TEXT;
      const error = new InvalidInputError(
        QuestionOptionControllerTestData.ERROR_MESSAGES.INVALID_INPUT,
      );

      testSetup.createQuestionOptionUseCase.execute.mockResolvedValueOnce(
        left(error),
      );

      await expect(
        testSetup.controller.createOption(questionId, dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for question not found', async () => {
      const questionId =
        QuestionOptionControllerTestData.INVALID_QUESTION_IDS.NOT_FOUND;
      const dto = QuestionOptionControllerTestData.VALID_DTOS.SIMPLE_OPTION;
      const error = new QuestionNotFoundError();

      testSetup.createQuestionOptionUseCase.execute.mockResolvedValueOnce(
        left(error),
      );

      await expect(
        testSetup.controller.createOption(questionId, dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException for repository error', async () => {
      const questionId =
        QuestionOptionControllerTestData.VALID_QUESTION_IDS.MULTIPLE_CHOICE;
      const dto = QuestionOptionControllerTestData.VALID_DTOS.SIMPLE_OPTION;
      const error = new RepositoryError(
        QuestionOptionControllerTestData.ERROR_MESSAGES.REPOSITORY_ERROR,
      );

      testSetup.createQuestionOptionUseCase.execute.mockResolvedValueOnce(
        left(error),
      );

      await expect(
        testSetup.controller.createOption(questionId, dto),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw InternalServerErrorException for unknown error', async () => {
      const questionId =
        QuestionOptionControllerTestData.VALID_QUESTION_IDS.MULTIPLE_CHOICE;
      const dto = QuestionOptionControllerTestData.VALID_DTOS.SIMPLE_OPTION;
      const error = new Error('Unknown error');

      testSetup.createQuestionOptionUseCase.execute.mockResolvedValueOnce(
        left(error),
      );

      await expect(
        testSetup.controller.createOption(questionId, dto),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('Parameter Validation', () => {
    it('should handle invalid question ID format', async () => {
      const questionId =
        QuestionOptionControllerTestData.INVALID_QUESTION_IDS.INVALID_UUID;
      const dto = QuestionOptionControllerTestData.VALID_DTOS.SIMPLE_OPTION;
      const error = new InvalidInputError('Question ID must be a valid UUID');

      testSetup.createQuestionOptionUseCase.execute.mockResolvedValueOnce(
        left(error),
      );

      await expect(
        testSetup.controller.createOption(questionId, dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle empty text in DTO', async () => {
      const questionId =
        QuestionOptionControllerTestData.VALID_QUESTION_IDS.MULTIPLE_CHOICE;
      const dto = QuestionOptionControllerTestData.INVALID_DTOS.EMPTY_TEXT;
      const error = new InvalidInputError('Option text cannot be empty');

      testSetup.createQuestionOptionUseCase.execute.mockResolvedValueOnce(
        left(error),
      );

      await expect(
        testSetup.controller.createOption(questionId, dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle whitespace-only text in DTO', async () => {
      const questionId =
        QuestionOptionControllerTestData.VALID_QUESTION_IDS.MULTIPLE_CHOICE;
      const dto = QuestionOptionControllerTestData.INVALID_DTOS.WHITESPACE_TEXT;
      const error = new InvalidInputError('Option text cannot be empty');

      testSetup.createQuestionOptionUseCase.execute.mockResolvedValueOnce(
        left(error),
      );

      await expect(
        testSetup.controller.createOption(questionId, dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle text that is too long', async () => {
      const questionId =
        QuestionOptionControllerTestData.VALID_QUESTION_IDS.MULTIPLE_CHOICE;
      const dto = QuestionOptionControllerTestData.INVALID_DTOS.TOO_LONG_TEXT;
      const error = new InvalidInputError(
        'Option text must be less than 500 characters',
      );

      testSetup.createQuestionOptionUseCase.execute.mockResolvedValueOnce(
        left(error),
      );

      await expect(
        testSetup.controller.createOption(questionId, dto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Use Case Integration', () => {
    it('should pass correct parameters to use case', async () => {
      const questionId =
        QuestionOptionControllerTestData.VALID_QUESTION_IDS.MULTIPLE_CHOICE;
      const dto = QuestionOptionControllerTestData.VALID_DTOS.SIMPLE_OPTION;
      const expectedResponse =
        QuestionOptionControllerTestData.SUCCESS_RESPONSES.SIMPLE_OPTION;

      testSetup.createQuestionOptionUseCase.execute.mockResolvedValueOnce(
        right(expectedResponse),
      );

      await testSetup.controller.createOption(questionId, dto);

      expect(
        testSetup.createQuestionOptionUseCase.execute,
      ).toHaveBeenCalledWith({
        text: dto.text,
        questionId,
      });
    });

    it('should handle use case response correctly', async () => {
      const questionId =
        QuestionOptionControllerTestData.VALID_QUESTION_IDS.MULTIPLE_CHOICE;
      const dto = QuestionOptionControllerTestData.VALID_DTOS.SIMPLE_OPTION;
      const expectedResponse =
        QuestionOptionControllerTestData.SUCCESS_RESPONSES.SIMPLE_OPTION;

      testSetup.createQuestionOptionUseCase.execute.mockResolvedValueOnce(
        right(expectedResponse),
      );

      const result = await testSetup.controller.createOption(questionId, dto);

      expect(result).toEqual(expectedResponse);
      expect(result.questionOption.id).toBeDefined();
      expect(result.questionOption.text).toBe(dto.text);
      expect(result.questionOption.questionId).toBe(questionId);
      expect(result.questionOption.createdAt).toBeInstanceOf(Date);
      expect(result.questionOption.updatedAt).toBeInstanceOf(Date);
    });

    it('should not call use case multiple times for single request', async () => {
      const questionId =
        QuestionOptionControllerTestData.VALID_QUESTION_IDS.MULTIPLE_CHOICE;
      const dto = QuestionOptionControllerTestData.VALID_DTOS.SIMPLE_OPTION;
      const expectedResponse =
        QuestionOptionControllerTestData.SUCCESS_RESPONSES.SIMPLE_OPTION;

      testSetup.createQuestionOptionUseCase.execute.mockResolvedValueOnce(
        right(expectedResponse),
      );

      await testSetup.controller.createOption(questionId, dto);

      testHelpers.expectUseCaseToHaveBeenCalledOnce();
    });
  });
});
