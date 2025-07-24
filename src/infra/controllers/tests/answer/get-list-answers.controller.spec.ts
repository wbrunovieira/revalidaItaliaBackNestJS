// src/infra/controllers/tests/answer/get-list-answers.controller.spec.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';

import { AnswerControllerTestSetup } from './shared/answer-controller-test-setup';
import { AnswerControllerTestData } from './shared/answer-controller-test-data';

import { InvalidInputError } from '@/domain/assessment/application/use-cases/errors/invalid-input-error';
import { QuestionNotFoundError } from '@/domain/assessment/application/use-cases/errors/question-not-found-error';
import { RepositoryError } from '@/domain/assessment/application/use-cases/errors/repository-error';
import { left, right } from '@/core/either';

describe('AnswerController - GET /answers (List)', () => {
  let setup: AnswerControllerTestSetup;

  beforeEach(() => {
    setup = new AnswerControllerTestSetup();
    setup.resetMocks();
  });

  describe('Success scenarios', () => {
    it('should return answers with default pagination when no parameters provided', async () => {
      // Arrange
      const expectedResponse =
        AnswerControllerTestData.listAnswersResponses.singlePage();
      setup.listAnswersUseCase.execute.mockResolvedValue(
        right(expectedResponse),
      );

      // Act
      const result = await setup.controller.list();

      // Assert
      expect(setup.listAnswersUseCase.execute).toHaveBeenCalledWith({
        page: undefined,
        limit: undefined,
        questionId: undefined,
      });
      expect(result).toEqual(expectedResponse);
    });

    it('should return answers with custom pagination', async () => {
      // Arrange
      const request =
        AnswerControllerTestData.listAnswersRequests.withPagination();
      const expectedResponse =
        AnswerControllerTestData.listAnswersResponses.middlePage();
      setup.listAnswersUseCase.execute.mockResolvedValue(
        right(expectedResponse),
      );

      // Act
      const result = await setup.controller.list('1', '10');

      // Assert
      expect(setup.listAnswersUseCase.execute).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        questionId: undefined,
      });
      expect(result).toEqual(expectedResponse);
    });

    it('should return answers filtered by questionId', async () => {
      // Arrange
      const expectedResponse =
        AnswerControllerTestData.listAnswersResponses.singlePage();
      setup.listAnswersUseCase.execute.mockResolvedValue(
        right(expectedResponse),
      );

      // Act
      const result = await setup.controller.list(
        undefined,
        undefined,
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      );

      // Assert
      expect(setup.listAnswersUseCase.execute).toHaveBeenCalledWith({
        page: undefined,
        limit: undefined,
        questionId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      });
      expect(result).toEqual(expectedResponse);
    });

    it('should return answers with all parameters', async () => {
      // Arrange
      const expectedResponse =
        AnswerControllerTestData.listAnswersResponses.middlePage();
      setup.listAnswersUseCase.execute.mockResolvedValue(
        right(expectedResponse),
      );

      // Act
      const result = await setup.controller.list(
        '2',
        '5',
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      );

      // Assert
      expect(setup.listAnswersUseCase.execute).toHaveBeenCalledWith({
        page: 2,
        limit: 5,
        questionId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      });
      expect(result).toEqual(expectedResponse);
    });

    it('should return empty list when no answers found', async () => {
      // Arrange
      const expectedResponse =
        AnswerControllerTestData.listAnswersResponses.empty();
      setup.listAnswersUseCase.execute.mockResolvedValue(
        right(expectedResponse),
      );

      // Act
      const result = await setup.controller.list();

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(result.answers).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it('should handle large result sets with pagination', async () => {
      // Arrange
      const expectedResponse =
        AnswerControllerTestData.listAnswersResponses.multiplePages();
      setup.listAnswersUseCase.execute.mockResolvedValue(
        right(expectedResponse),
      );

      // Act
      const result = await setup.controller.list('1', '10');

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(result.answers).toHaveLength(10);
      expect(result.pagination.total).toBe(25);
      expect(result.pagination.totalPages).toBe(3);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrevious).toBe(false);
    });

    it('should handle last page correctly', async () => {
      // Arrange
      const expectedResponse =
        AnswerControllerTestData.listAnswersResponses.lastPage();
      setup.listAnswersUseCase.execute.mockResolvedValue(
        right(expectedResponse),
      );

      // Act
      const result = await setup.controller.list('3', '10');

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrevious).toBe(true);
    });

    it('should convert string parameters to numbers', async () => {
      // Arrange
      const expectedResponse =
        AnswerControllerTestData.listAnswersResponses.singlePage();
      setup.listAnswersUseCase.execute.mockResolvedValue(
        right(expectedResponse),
      );

      // Act
      await setup.controller.list('5', '20');

      // Assert
      expect(setup.listAnswersUseCase.execute).toHaveBeenCalledWith({
        page: 5,
        limit: 20,
        questionId: undefined,
      });
    });
  });

  describe('Error scenarios', () => {
    it('should throw BadRequestException when input validation fails', async () => {
      // Arrange
      const invalidInputError = new InvalidInputError(
        'Page must be at least 1',
      );
      setup.listAnswersUseCase.execute.mockResolvedValue(
        left(invalidInputError),
      );

      // Act & Assert
      await expect(setup.controller.list('0', '10')).rejects.toThrow(
        BadRequestException,
      );
      expect(setup.listAnswersUseCase.execute).toHaveBeenCalledWith({
        page: 0,
        limit: 10,
        questionId: undefined,
      });
    });

    it('should throw NotFoundException when question not found', async () => {
      // Arrange
      const questionNotFoundError = new QuestionNotFoundError();
      setup.listAnswersUseCase.execute.mockResolvedValue(
        left(questionNotFoundError),
      );

      // Act & Assert
      await expect(
        setup.controller.list(undefined, undefined, 'non-existent-question-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException for repository errors', async () => {
      // Arrange
      const repositoryError = new RepositoryError('Database connection failed');
      setup.listAnswersUseCase.execute.mockResolvedValue(left(repositoryError));

      // Act & Assert
      await expect(setup.controller.list()).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw InternalServerErrorException for unknown errors', async () => {
      // Arrange
      const unknownError = new Error('Unknown error') as any;
      setup.listAnswersUseCase.execute.mockResolvedValue(left(unknownError));

      // Act & Assert
      await expect(setup.controller.list()).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should validate BadRequestException error details for invalid input', async () => {
      // Arrange
      const invalidInputError = new InvalidInputError(
        'Limit cannot exceed 100',
        ['limit must be at most 100', 'page must be at least 1'],
      );
      setup.listAnswersUseCase.execute.mockResolvedValue(
        left(invalidInputError),
      );

      // Act & Assert
      try {
        await setup.controller.list('1', '150');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.getResponse()).toEqual({
          error: 'INVALID_INPUT',
          message: 'Invalid input data',
          details: ['limit must be at most 100', 'page must be at least 1'],
        });
      }
    });

    it('should validate NotFoundException error format for question not found', async () => {
      // Arrange
      const questionNotFoundError = new QuestionNotFoundError();
      setup.listAnswersUseCase.execute.mockResolvedValue(
        left(questionNotFoundError),
      );

      // Act & Assert
      try {
        await setup.controller.list(
          undefined,
          undefined,
          'invalid-question-id',
        );
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.getResponse()).toEqual({
          error: 'QUESTION_NOT_FOUND',
          message: 'Question not found',
        });
      }
    });

    it('should validate InternalServerErrorException format for repository errors', async () => {
      // Arrange
      const repositoryError = new RepositoryError('Database timeout');
      setup.listAnswersUseCase.execute.mockResolvedValue(left(repositoryError));

      // Act & Assert
      try {
        await setup.controller.list();
      } catch (error) {
        expect(error).toBeInstanceOf(InternalServerErrorException);
        expect(error.getResponse()).toEqual({
          error: 'INTERNAL_ERROR',
          message: 'Database timeout',
        });
      }
    });
  });

  describe('Parameter handling', () => {
    it('should handle undefined string parameters correctly', async () => {
      // Arrange
      const expectedResponse =
        AnswerControllerTestData.listAnswersResponses.singlePage();
      setup.listAnswersUseCase.execute.mockResolvedValue(
        right(expectedResponse),
      );

      // Act
      await setup.controller.list(undefined, undefined, undefined);

      // Assert
      expect(setup.listAnswersUseCase.execute).toHaveBeenCalledWith({
        page: undefined,
        limit: undefined,
        questionId: undefined,
      });
    });

    it('should handle empty string parameters correctly', async () => {
      // Arrange
      const expectedResponse =
        AnswerControllerTestData.listAnswersResponses.singlePage();
      setup.listAnswersUseCase.execute.mockResolvedValue(
        right(expectedResponse),
      );

      // Act
      await setup.controller.list('', '', '');

      // Assert
      expect(setup.listAnswersUseCase.execute).toHaveBeenCalledWith({
        page: undefined, // Empty string is falsy, so page ? Number(page) : undefined = undefined
        limit: undefined,
        questionId: '',
      });
    });

    it('should convert valid numeric strings to numbers', async () => {
      // Arrange
      const expectedResponse =
        AnswerControllerTestData.listAnswersResponses.singlePage();
      setup.listAnswersUseCase.execute.mockResolvedValue(
        right(expectedResponse),
      );

      // Act
      await setup.controller.list(
        '1',
        '10',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      );

      // Assert
      expect(setup.listAnswersUseCase.execute).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        questionId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      });
    });

    it('should handle non-numeric strings as NaN', async () => {
      // Arrange
      const expectedResponse =
        AnswerControllerTestData.listAnswersResponses.singlePage();
      setup.listAnswersUseCase.execute.mockResolvedValue(
        right(expectedResponse),
      );

      // Act
      await setup.controller.list('not-a-number', 'also-not-a-number');

      // Assert
      expect(setup.listAnswersUseCase.execute).toHaveBeenCalledWith({
        page: NaN,
        limit: NaN,
        questionId: undefined,
      });
    });

    it('should handle decimal strings by converting to integers', async () => {
      // Arrange
      const expectedResponse =
        AnswerControllerTestData.listAnswersResponses.singlePage();
      setup.listAnswersUseCase.execute.mockResolvedValue(
        right(expectedResponse),
      );

      // Act
      await setup.controller.list('1.5', '10.9');

      // Assert
      expect(setup.listAnswersUseCase.execute).toHaveBeenCalledWith({
        page: 1.5, // Note: Number() preserves decimals
        limit: 10.9,
        questionId: undefined,
      });
    });
  });

  describe('Use case interaction', () => {
    it('should call use case with correct parameters once', async () => {
      // Arrange
      const expectedResponse =
        AnswerControllerTestData.listAnswersResponses.singlePage();
      setup.listAnswersUseCase.execute.mockResolvedValue(
        right(expectedResponse),
      );

      // Act
      await setup.controller.list('2', '5', 'test-question-id');

      // Assert
      expect(setup.listAnswersUseCase.execute).toHaveBeenCalledTimes(1);
      expect(setup.listAnswersUseCase.execute).toHaveBeenCalledWith({
        page: 2,
        limit: 5,
        questionId: 'test-question-id',
      });
    });

    it('should not call other use cases', async () => {
      // Arrange
      const expectedResponse =
        AnswerControllerTestData.listAnswersResponses.singlePage();
      setup.listAnswersUseCase.execute.mockResolvedValue(
        right(expectedResponse),
      );

      // Act
      await setup.controller.list();

      // Assert
      expect(setup.getAnswerUseCase.execute).not.toHaveBeenCalled();
      expect(setup.createAnswerUseCase.execute).not.toHaveBeenCalled();
    });

    it('should pass through use case response unchanged on success', async () => {
      // Arrange
      const expectedResponse =
        AnswerControllerTestData.listAnswersResponses.multiplePages();
      setup.listAnswersUseCase.execute.mockResolvedValue(
        right(expectedResponse),
      );

      // Act
      const result = await setup.controller.list();

      // Assert
      expect(result).toBe(expectedResponse); // Exact same reference
    });
  });

  describe('Edge cases', () => {
    it('should handle zero values for pagination', async () => {
      // Arrange
      const expectedResponse =
        AnswerControllerTestData.listAnswersResponses.empty();
      setup.listAnswersUseCase.execute.mockResolvedValue(
        right(expectedResponse),
      );

      // Act
      await setup.controller.list('0', '0');

      // Assert
      expect(setup.listAnswersUseCase.execute).toHaveBeenCalledWith({
        page: 0,
        limit: 0,
        questionId: undefined,
      });
    });

    it('should handle negative values for pagination', async () => {
      // Arrange
      const expectedResponse =
        AnswerControllerTestData.listAnswersResponses.empty();
      setup.listAnswersUseCase.execute.mockResolvedValue(
        right(expectedResponse),
      );

      // Act
      await setup.controller.list('-1', '-5');

      // Assert
      expect(setup.listAnswersUseCase.execute).toHaveBeenCalledWith({
        page: -1,
        limit: -5,
        questionId: undefined,
      });
    });

    it('should handle very large numbers', async () => {
      // Arrange
      const expectedResponse =
        AnswerControllerTestData.listAnswersResponses.empty();
      setup.listAnswersUseCase.execute.mockResolvedValue(
        right(expectedResponse),
      );

      // Act
      await setup.controller.list('999999999', '999999999');

      // Assert
      expect(setup.listAnswersUseCase.execute).toHaveBeenCalledWith({
        page: 999999999,
        limit: 999999999,
        questionId: undefined,
      });
    });

    it('should handle special characters in questionId', async () => {
      // Arrange
      const expectedResponse =
        AnswerControllerTestData.listAnswersResponses.empty();
      setup.listAnswersUseCase.execute.mockResolvedValue(
        right(expectedResponse),
      );

      // Act
      await setup.controller.list(undefined, undefined, 'special@chars#$%');

      // Assert
      expect(setup.listAnswersUseCase.execute).toHaveBeenCalledWith({
        page: undefined,
        limit: undefined,
        questionId: 'special@chars#$%',
      });
    });
  });

  describe('Performance scenarios', () => {
    it('should handle maximum allowed limit', async () => {
      // Arrange
      const expectedResponse =
        AnswerControllerTestData.listAnswersResponses.multiplePages();
      setup.listAnswersUseCase.execute.mockResolvedValue(
        right(expectedResponse),
      );

      // Act
      await setup.controller.list('1', '100');

      // Assert
      expect(setup.listAnswersUseCase.execute).toHaveBeenCalledWith({
        page: 1,
        limit: 100,
        questionId: undefined,
      });
    });

    it('should handle minimum values', async () => {
      // Arrange
      const expectedResponse =
        AnswerControllerTestData.listAnswersResponses.singlePage();
      setup.listAnswersUseCase.execute.mockResolvedValue(
        right(expectedResponse),
      );

      // Act
      await setup.controller.list('1', '1');

      // Assert
      expect(setup.listAnswersUseCase.execute).toHaveBeenCalledWith({
        page: 1,
        limit: 1,
        questionId: undefined,
      });
    });

    it('should handle concurrent calls efficiently', async () => {
      // Arrange
      const expectedResponse =
        AnswerControllerTestData.listAnswersResponses.singlePage();
      setup.listAnswersUseCase.execute.mockResolvedValue(
        right(expectedResponse),
      );

      // Act
      const promises = Array.from({ length: 10 }, () =>
        setup.controller.list('1', '10'),
      );
      const results = await Promise.all(promises);

      // Assert
      expect(setup.listAnswersUseCase.execute).toHaveBeenCalledTimes(10);
      results.forEach((result) => {
        expect(result).toEqual(expectedResponse);
      });
    });
  });
});
