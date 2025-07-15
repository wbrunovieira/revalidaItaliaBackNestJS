// src/infra/controllers/tests/attempt/post-review-open-answer.controller.spec.ts

import { describe, it, expect, beforeEach } from 'vitest';
import {
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { left, right } from '@/core/either';
import { AttemptControllerTestSetup } from './shared/attempt-controller-test-setup';
import { AttemptControllerTestHelpers } from './shared/attempt-controller-test-helpers';
import { AttemptControllerTestData } from './shared/attempt-controller-test-data';
import { InvalidInputError } from '@/domain/assessment/application/use-cases/errors/invalid-input-error';
import { AttemptAnswerNotFoundError } from '@/domain/assessment/application/use-cases/errors/attempt-answer-not-found-error';
import { UserNotFoundError } from '@/domain/assessment/application/use-cases/errors/user-not-found-error';
import { AnswerNotReviewableError } from '@/domain/assessment/application/use-cases/errors/answer-not-reviewable-error';
import { RepositoryError } from '@/domain/assessment/application/use-cases/errors/repository-error';

describe('AttemptController - POST /attempts/answers/:id/review', () => {
  let setup: AttemptControllerTestSetup;
  let helpers: AttemptControllerTestHelpers;
  let data: AttemptControllerTestData;

  beforeEach(() => {
    setup = new AttemptControllerTestSetup();
    helpers = new AttemptControllerTestHelpers();
    data = new AttemptControllerTestData();
    setup.resetMocks();
  });

  describe('Success Cases', () => {
    it('should review open answer successfully with teacher comment', async () => {
      // Arrange
      const params = AttemptControllerTestData.validReviewOpenAnswerParams();
      const body = AttemptControllerTestData.validReviewOpenAnswerBody();
      const mockResponse =
        AttemptControllerTestData.mockReviewOpenAnswerResponse();

      setup.reviewOpenAnswerUseCase.execute.mockResolvedValue(
        right(mockResponse),
      );

      // Act
      const result = await setup.controller.reviewAnswer(params, body);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(setup.reviewOpenAnswerUseCase.execute).toHaveBeenCalledWith({
        attemptAnswerId: params.id,
        reviewerId: body.reviewerId,
        isCorrect: body.isCorrect,
        teacherComment: (body as any).teacherComment,
      });
    });

    it('should review open answer successfully without teacher comment', async () => {
      // Arrange
      const params = AttemptControllerTestData.validReviewOpenAnswerParams();
      const body =
        AttemptControllerTestData.validReviewOpenAnswerBodyWithoutComment();
      const mockResponse =
        AttemptControllerTestData.mockReviewOpenAnswerResponse();

      setup.reviewOpenAnswerUseCase.execute.mockResolvedValue(
        right(mockResponse),
      );

      // Act
      const result = await setup.controller.reviewAnswer(params, body);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(setup.reviewOpenAnswerUseCase.execute).toHaveBeenCalledWith({
        attemptAnswerId: params.id,
        reviewerId: body.reviewerId,
        isCorrect: body.isCorrect,
        teacherComment: (body as any).teacherComment,
      });
    });

    it('should mark answer as incorrect', async () => {
      // Arrange
      const params = AttemptControllerTestData.validReviewOpenAnswerParams();
      const body = {
        reviewerId: '550e8400-e29b-41d4-a716-446655440003',
        isCorrect: false,
        teacherComment: 'Answer is incomplete and lacks proper explanation.',
      };
      const mockResponse = {
        attemptAnswer: {
          ...AttemptControllerTestData.mockReviewOpenAnswerResponse()
            .attemptAnswer,
          isCorrect: false,
          teacherComment: 'Answer is incomplete and lacks proper explanation.',
        },
        attemptStatus: {
          ...AttemptControllerTestData.mockReviewOpenAnswerResponse()
            .attemptStatus,
        },
      };

      setup.reviewOpenAnswerUseCase.execute.mockResolvedValue(
        right(mockResponse),
      );

      // Act
      const result = await setup.controller.reviewAnswer(params, body);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(result.attemptAnswer.isCorrect).toBe(false);
      expect(result.attemptAnswer.teacherComment).toBe(
        'Answer is incomplete and lacks proper explanation.',
      );
    });
  });

  describe('Error Cases', () => {
    it('should throw BadRequestException for invalid input', async () => {
      // Arrange
      const params = AttemptControllerTestData.validReviewOpenAnswerParams();
      const body = AttemptControllerTestData.validReviewOpenAnswerBody();
      const error = new InvalidInputError('Invalid UUID format');

      setup.reviewOpenAnswerUseCase.execute.mockResolvedValue(left(error));

      // Act & Assert
      await expect(setup.controller.reviewAnswer(params, body)).rejects.toThrow(
        BadRequestException,
      );

      const thrownError = await helpers.captureException(() =>
        setup.controller.reviewAnswer(params, body),
      );

      expect(thrownError.getResponse()).toEqual({
        error: 'INVALID_INPUT',
        message: 'Invalid input data',
        details: error.details,
      });
    });

    it('should throw NotFoundException for attempt answer not found', async () => {
      // Arrange
      const params = { id: data.nonExistentAttemptAnswerId };
      const body = AttemptControllerTestData.validReviewOpenAnswerBody();
      const error = new AttemptAnswerNotFoundError();

      setup.reviewOpenAnswerUseCase.execute.mockResolvedValue(left(error));

      // Act & Assert
      await expect(setup.controller.reviewAnswer(params, body)).rejects.toThrow(
        NotFoundException,
      );

      const thrownError = await helpers.captureException(() =>
        setup.controller.reviewAnswer(params, body),
      );

      expect(thrownError.getResponse()).toEqual({
        error: 'ATTEMPT_ANSWER_NOT_FOUND',
        message: 'Attempt answer not found',
      });
    });

    it('should throw NotFoundException for user not found', async () => {
      // Arrange
      const params = AttemptControllerTestData.validReviewOpenAnswerParams();
      const body = {
        ...AttemptControllerTestData.validReviewOpenAnswerBody(),
        reviewerId: data.nonExistentReviewerId,
      };
      const error = new UserNotFoundError();

      setup.reviewOpenAnswerUseCase.execute.mockResolvedValue(left(error));

      // Act & Assert
      await expect(setup.controller.reviewAnswer(params, body)).rejects.toThrow(
        NotFoundException,
      );

      const thrownError = await helpers.captureException(() =>
        setup.controller.reviewAnswer(params, body),
      );

      expect(thrownError.getResponse()).toEqual({
        error: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    });

    it('should throw BadRequestException for answer not reviewable', async () => {
      // Arrange
      const params = AttemptControllerTestData.validReviewOpenAnswerParams();
      const body = AttemptControllerTestData.validReviewOpenAnswerBody();
      const error = new AnswerNotReviewableError();

      setup.reviewOpenAnswerUseCase.execute.mockResolvedValue(left(error));

      // Act & Assert
      await expect(setup.controller.reviewAnswer(params, body)).rejects.toThrow(
        BadRequestException,
      );

      const thrownError = await helpers.captureException(() =>
        setup.controller.reviewAnswer(params, body),
      );

      expect(thrownError.getResponse()).toEqual({
        error: 'ANSWER_NOT_REVIEWABLE',
        message: 'Answer is not reviewable',
      });
    });

    it('should throw InternalServerErrorException for repository error', async () => {
      // Arrange
      const params = AttemptControllerTestData.validReviewOpenAnswerParams();
      const body = AttemptControllerTestData.validReviewOpenAnswerBody();
      const error = new RepositoryError('Database connection failed');

      setup.reviewOpenAnswerUseCase.execute.mockResolvedValue(left(error));

      // Act & Assert
      await expect(setup.controller.reviewAnswer(params, body)).rejects.toThrow(
        InternalServerErrorException,
      );

      const thrownError = await helpers.captureException(() =>
        setup.controller.reviewAnswer(params, body),
      );

      expect(thrownError.getResponse()).toEqual({
        error: 'INTERNAL_ERROR',
        message: error.message,
      });
    });

    it('should throw InternalServerErrorException for unexpected error', async () => {
      // Arrange
      const params = AttemptControllerTestData.validReviewOpenAnswerParams();
      const body = AttemptControllerTestData.validReviewOpenAnswerBody();
      const error = new Error('Unexpected error');

      setup.reviewOpenAnswerUseCase.execute.mockResolvedValue(left(error));

      // Act & Assert
      await expect(setup.controller.reviewAnswer(params, body)).rejects.toThrow(
        InternalServerErrorException,
      );

      const thrownError = await helpers.captureException(() =>
        setup.controller.reviewAnswer(params, body),
      );

      expect(thrownError.getResponse()).toEqual({
        error: 'INTERNAL_ERROR',
        message: 'Unexpected error occurred',
      });
    });
  });

  describe('Request Validation', () => {
    it('should call use case with correct parameters', async () => {
      // Arrange
      const params = AttemptControllerTestData.validReviewOpenAnswerParams();
      const body = AttemptControllerTestData.validReviewOpenAnswerBody();
      const mockResponse =
        AttemptControllerTestData.mockReviewOpenAnswerResponse();

      setup.reviewOpenAnswerUseCase.execute.mockResolvedValue(
        right(mockResponse),
      );

      // Act
      await setup.controller.reviewAnswer(params, body);

      // Assert
      expect(setup.reviewOpenAnswerUseCase.execute).toHaveBeenCalledTimes(1);
      expect(setup.reviewOpenAnswerUseCase.execute).toHaveBeenCalledWith({
        attemptAnswerId: params.id,
        reviewerId: body.reviewerId,
        isCorrect: body.isCorrect,
        teacherComment: (body as any).teacherComment,
      });
    });

    it('should handle empty teacher comment', async () => {
      // Arrange
      const params = AttemptControllerTestData.validReviewOpenAnswerParams();
      const body =
        AttemptControllerTestData.validReviewOpenAnswerBodyWithoutComment();
      const mockResponse =
        AttemptControllerTestData.mockReviewOpenAnswerResponse();

      setup.reviewOpenAnswerUseCase.execute.mockResolvedValue(
        right(mockResponse),
      );

      // Act
      await setup.controller.reviewAnswer(params, body);

      // Assert
      expect(setup.reviewOpenAnswerUseCase.execute).toHaveBeenCalledWith({
        attemptAnswerId: params.id,
        reviewerId: body.reviewerId,
        isCorrect: body.isCorrect,
        teacherComment: (body as any).teacherComment,
      });
    });
  });

  describe('Response Validation', () => {
    it('should return response with all required fields', async () => {
      // Arrange
      const params = AttemptControllerTestData.validReviewOpenAnswerParams();
      const body = AttemptControllerTestData.validReviewOpenAnswerBody();
      const mockResponse =
        AttemptControllerTestData.mockReviewOpenAnswerResponse();

      setup.reviewOpenAnswerUseCase.execute.mockResolvedValue(
        right(mockResponse),
      );

      // Act
      const result = await setup.controller.reviewAnswer(params, body);

      // Assert
      expect(result).toHaveProperty('attemptAnswer');

      expect(result.attemptAnswer).toHaveProperty('id');
      expect(result.attemptAnswer).toHaveProperty('attemptId');
      expect(result.attemptAnswer).toHaveProperty('questionId');
      expect(result.attemptAnswer).toHaveProperty('textAnswer');
      expect(result.attemptAnswer).toHaveProperty('status');
      expect(result.attemptAnswer).toHaveProperty('isCorrect');
      expect(result.attemptAnswer).toHaveProperty('teacherComment');
      expect(result.attemptAnswer).toHaveProperty('createdAt');
      expect(result.attemptAnswer).toHaveProperty('updatedAt');

      expect(result).toHaveProperty('attemptStatus');
      expect(result.attemptStatus).toHaveProperty('id');
      expect(result.attemptStatus).toHaveProperty('status');
      expect(result.attemptStatus).toHaveProperty('allOpenQuestionsReviewed');
    });

    it('should preserve correct/incorrect status in response', async () => {
      // Arrange
      const params = AttemptControllerTestData.validReviewOpenAnswerParams();
      const body = AttemptControllerTestData.validReviewOpenAnswerBody();
      const mockResponse =
        AttemptControllerTestData.mockReviewOpenAnswerResponse();

      setup.reviewOpenAnswerUseCase.execute.mockResolvedValue(
        right(mockResponse),
      );

      // Act
      const result = await setup.controller.reviewAnswer(params, body);

      // Assert
      expect(result.attemptAnswer.isCorrect).toBe(body.isCorrect);
      expect(result.attemptAnswer.teacherComment).toBe((body as any).teacherComment);
      expect(result.attemptAnswer.status).toBe('GRADED');
      expect(result.attemptStatus.allOpenQuestionsReviewed).toBeDefined();
    });
  });
});
