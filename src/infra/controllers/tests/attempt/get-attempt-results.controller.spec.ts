// src/infra/controllers/tests/attempt/get-attempt-results.controller.spec.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { left, right } from '@/core/either';
import { AttemptControllerTestSetup } from './shared/attempt-controller-test-setup';
import { AttemptControllerTestHelpers } from './shared/attempt-controller-test-helpers';
import { AttemptControllerTestData } from './shared/attempt-controller-test-data';
import { InvalidInputError } from '@/domain/assessment/application/use-cases/errors/invalid-input-error';
import { AttemptNotFoundError } from '@/domain/assessment/application/use-cases/errors/attempt-not-found-error';
import { AttemptNotFinalizedError } from '@/domain/assessment/application/use-cases/errors/attempt-not-finalized-error';
import { UserNotFoundError } from '@/domain/assessment/application/use-cases/errors/user-not-found-error';
import { InsufficientPermissionsError } from '@/domain/assessment/application/use-cases/errors/insufficient-permissions-error';
import { AssessmentNotFoundError } from '@/domain/assessment/application/use-cases/errors/assessment-not-found-error';
import { RepositoryError } from '@/domain/assessment/application/use-cases/errors/repository-error';

describe('AttemptController - GET /attempts/:id/results', () => {
  let setup: AttemptControllerTestSetup;
  let helpers: AttemptControllerTestHelpers;
  let data: AttemptControllerTestData;
  let mockUser: any;

  beforeEach(() => {
    setup = new AttemptControllerTestSetup();
    helpers = new AttemptControllerTestHelpers();
    data = new AttemptControllerTestData();
    setup.resetMocks();
    
    // Mock user from JWT
    mockUser = {
      sub: '550e8400-e29b-41d4-a716-446655440001',
      role: 'admin'
    };
  });

  describe('Success Cases', () => {
    it('should return attempt results successfully for QUIZ assessment', async () => {
      // Arrange
      const params = { id: data.validAttemptId };
      const mockResponse = data.createGetAttemptResultsResponse('QUIZ');
      
      setup.getAttemptResultsUseCase.execute.mockResolvedValue(right(mockResponse));

      // Act
      const result = await setup.controller.getAttemptResults(params, mockUser);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(setup.getAttemptResultsUseCase.execute).toHaveBeenCalledWith({
        attemptId: data.validAttemptId,
        requesterId: mockUser.sub,
      });
    });

    it('should return attempt results successfully for SIMULADO assessment with arguments', async () => {
      // Arrange
      const params = { id: data.validAttemptId };
      const mockResponse = data.createGetAttemptResultsResponse('SIMULADO');
      
      setup.getAttemptResultsUseCase.execute.mockResolvedValue(right(mockResponse));

      // Act
      const result = await setup.controller.getAttemptResults(params, mockUser);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(result.results.argumentResults).toBeDefined();
      expect(Array.isArray(result.results.argumentResults)).toBe(true);
    });

    it('should return attempt results successfully for PROVA_ABERTA assessment with pending review', async () => {
      // Arrange
      const params = { id: data.validAttemptId };
      const mockResponse = data.createGetAttemptResultsResponse('PROVA_ABERTA', true);
      
      setup.getAttemptResultsUseCase.execute.mockResolvedValue(right(mockResponse));

      // Act
      const result = await setup.controller.getAttemptResults(params, mockUser);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(result.results.pendingReview).toBeGreaterThan(0);
      expect(result.results.correctAnswers).toBeUndefined();
      expect(result.results.scorePercentage).toBeUndefined();
    });

    it('should return attempt results for PROVA_ABERTA assessment fully graded', async () => {
      // Arrange
      const params = { id: data.validAttemptId };
      const mockResponse = data.createGetAttemptResultsResponse('PROVA_ABERTA', false);
      
      setup.getAttemptResultsUseCase.execute.mockResolvedValue(right(mockResponse));

      // Act
      const result = await setup.controller.getAttemptResults(params, mockUser);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(result.results.pendingReview).toBe(0);
      expect(result.results.correctAnswers).toBeDefined();
      expect(result.results.scorePercentage).toBeDefined();
    });
  });

  describe('Error Cases', () => {
    it('should throw BadRequestException for invalid input', async () => {
      // Arrange
      const params = { id: data.validAttemptId };
      const error = new InvalidInputError('Invalid UUID format');
      
      setup.getAttemptResultsUseCase.execute.mockResolvedValue(left(error));

      // Act & Assert
      await expect(setup.controller.getAttemptResults(params, mockUser)).rejects.toThrow(
        BadRequestException
      );

      const thrownError = await helpers.captureException(() =>
        setup.controller.getAttemptResults(params, mockUser)
      );

      expect(thrownError.getResponse()).toEqual({
        error: 'INVALID_INPUT',
        message: 'Invalid input data',
        details: error.details,
      });
    });

    it('should throw NotFoundException for attempt not found', async () => {
      // Arrange
      const params = { id: data.nonExistentAttemptId };
      const error = new AttemptNotFoundError();
      
      setup.getAttemptResultsUseCase.execute.mockResolvedValue(left(error));

      // Act & Assert
      await expect(setup.controller.getAttemptResults(params, mockUser)).rejects.toThrow(
        NotFoundException
      );

      const thrownError = await helpers.captureException(() =>
        setup.controller.getAttemptResults(params, mockUser)
      );

      expect(thrownError.getResponse()).toEqual({
        error: 'ATTEMPT_NOT_FOUND',
        message: 'Attempt not found',
      });
    });

    it('should throw BadRequestException for attempt not finalized', async () => {
      // Arrange
      const params = { id: data.validAttemptId };
      const error = new AttemptNotFinalizedError();
      
      setup.getAttemptResultsUseCase.execute.mockResolvedValue(left(error));

      // Act & Assert
      await expect(setup.controller.getAttemptResults(params, mockUser)).rejects.toThrow(
        BadRequestException
      );

      const thrownError = await helpers.captureException(() =>
        setup.controller.getAttemptResults(params, mockUser)
      );

      expect(thrownError.getResponse()).toEqual({
        error: 'ATTEMPT_NOT_FINALIZED',
        message: 'Attempt is not finalized yet',
      });
    });

    it('should throw NotFoundException for user not found', async () => {
      // Arrange
      const params = { id: data.validAttemptId };
      const error = new UserNotFoundError();
      
      setup.getAttemptResultsUseCase.execute.mockResolvedValue(left(error));

      // Act & Assert
      await expect(setup.controller.getAttemptResults(params, mockUser)).rejects.toThrow(
        NotFoundException
      );

      const thrownError = await helpers.captureException(() =>
        setup.controller.getAttemptResults(params, mockUser)
      );

      expect(thrownError.getResponse()).toEqual({
        error: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    });

    it('should throw ForbiddenException for insufficient permissions', async () => {
      // Arrange
      const params = { id: data.validAttemptId };
      const error = new InsufficientPermissionsError();
      
      setup.getAttemptResultsUseCase.execute.mockResolvedValue(left(error));

      // Act & Assert
      await expect(setup.controller.getAttemptResults(params, mockUser)).rejects.toThrow(
        ForbiddenException
      );

      const thrownError = await helpers.captureException(() =>
        setup.controller.getAttemptResults(params, mockUser)
      );

      expect(thrownError.getResponse()).toEqual({
        error: 'INSUFFICIENT_PERMISSIONS',
        message: 'Insufficient permissions to view this attempt',
      });
    });

    it('should throw NotFoundException for assessment not found', async () => {
      // Arrange
      const params = { id: data.validAttemptId };
      const error = new AssessmentNotFoundError();
      
      setup.getAttemptResultsUseCase.execute.mockResolvedValue(left(error));

      // Act & Assert
      await expect(setup.controller.getAttemptResults(params, mockUser)).rejects.toThrow(
        NotFoundException
      );

      const thrownError = await helpers.captureException(() =>
        setup.controller.getAttemptResults(params, mockUser)
      );

      expect(thrownError.getResponse()).toEqual({
        error: 'ASSESSMENT_NOT_FOUND',
        message: 'Assessment not found',
      });
    });

    it('should throw InternalServerErrorException for repository error', async () => {
      // Arrange
      const params = { id: data.validAttemptId };
      const error = new RepositoryError('Database connection failed');
      
      setup.getAttemptResultsUseCase.execute.mockResolvedValue(left(error));

      // Act & Assert
      await expect(setup.controller.getAttemptResults(params, mockUser)).rejects.toThrow(
        InternalServerErrorException
      );

      const thrownError = await helpers.captureException(() =>
        setup.controller.getAttemptResults(params, mockUser)
      );

      expect(thrownError.getResponse()).toEqual({
        error: 'INTERNAL_ERROR',
        message: error.message,
      });
    });

    it('should throw InternalServerErrorException for unexpected error', async () => {
      // Arrange
      const params = { id: data.validAttemptId };
      const error = new Error('Unexpected error');
      
      setup.getAttemptResultsUseCase.execute.mockResolvedValue(left(error));

      // Act & Assert
      await expect(setup.controller.getAttemptResults(params, mockUser)).rejects.toThrow(
        InternalServerErrorException
      );

      const thrownError = await helpers.captureException(() =>
        setup.controller.getAttemptResults(params, mockUser)
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
      const params = { id: data.validAttemptId };
      const mockResponse = data.createGetAttemptResultsResponse('QUIZ');
      
      setup.getAttemptResultsUseCase.execute.mockResolvedValue(right(mockResponse));

      // Act
      await setup.controller.getAttemptResults(params, mockUser);

      // Assert
      expect(setup.getAttemptResultsUseCase.execute).toHaveBeenCalledTimes(1);
      expect(setup.getAttemptResultsUseCase.execute).toHaveBeenCalledWith({
        attemptId: data.validAttemptId,
        requesterId: mockUser.sub,
      });
    });

    it('should handle empty params object', async () => {
      // Arrange
      const params = { id: '' };
      const error = new InvalidInputError('Invalid UUID format');
      
      setup.getAttemptResultsUseCase.execute.mockResolvedValue(left(error));

      // Act & Assert
      await expect(setup.controller.getAttemptResults(params, mockUser)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('Response Validation', () => {
    it('should return response with all required fields for QUIZ', async () => {
      // Arrange
      const params = { id: data.validAttemptId };
      const mockResponse = data.createGetAttemptResultsResponse('QUIZ');
      
      setup.getAttemptResultsUseCase.execute.mockResolvedValue(right(mockResponse));

      // Act
      const result = await setup.controller.getAttemptResults(params, mockUser);

      // Assert
      expect(result).toHaveProperty('attempt');
      expect(result).toHaveProperty('assessment');
      expect(result).toHaveProperty('results');
      expect(result).toHaveProperty('answers');

      expect(result.attempt).toHaveProperty('id');
      expect(result.attempt).toHaveProperty('status');
      expect(result.attempt).toHaveProperty('userId');
      expect(result.attempt).toHaveProperty('assessmentId');

      expect(result.assessment).toHaveProperty('id');
      expect(result.assessment).toHaveProperty('title');
      expect(result.assessment).toHaveProperty('type');
      expect(result.assessment).toHaveProperty('passingScore');

      expect(result.results).toHaveProperty('totalQuestions');
      expect(result.results).toHaveProperty('answeredQuestions');
      expect(result.results).toHaveProperty('correctAnswers');
      expect(result.results).toHaveProperty('scorePercentage');
      expect(result.results).toHaveProperty('passed');
    });

    it('should return response with argument results for SIMULADO', async () => {
      // Arrange
      const params = { id: data.validAttemptId };
      const mockResponse = data.createGetAttemptResultsResponse('SIMULADO');
      
      setup.getAttemptResultsUseCase.execute.mockResolvedValue(right(mockResponse));

      // Act
      const result = await setup.controller.getAttemptResults(params, mockUser);

      // Assert
      expect(result.results).toHaveProperty('argumentResults');
      expect(Array.isArray(result.results.argumentResults)).toBe(true);
      
      if (result.results.argumentResults && result.results.argumentResults.length > 0) {
        const argResult = result.results.argumentResults[0];
        expect(argResult).toHaveProperty('argumentId');
        expect(argResult).toHaveProperty('argumentTitle');
        expect(argResult).toHaveProperty('totalQuestions');
        expect(argResult).toHaveProperty('correctAnswers');
        expect(argResult).toHaveProperty('scorePercentage');
      }
    });

    it('should return response with pending review fields for PROVA_ABERTA', async () => {
      // Arrange
      const params = { id: data.validAttemptId };
      const mockResponse = data.createGetAttemptResultsResponse('PROVA_ABERTA', true);
      
      setup.getAttemptResultsUseCase.execute.mockResolvedValue(right(mockResponse));

      // Act
      const result = await setup.controller.getAttemptResults(params, mockUser);

      // Assert
      expect(result.results).toHaveProperty('reviewedQuestions');
      expect(result.results).toHaveProperty('pendingReview');
      expect(result.results.pendingReview).toBeGreaterThan(0);
    });
  });
});