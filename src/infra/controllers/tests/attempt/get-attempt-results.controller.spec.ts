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
      expect(result.attempt).toHaveProperty('identityId');
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

  describe('Edge Cases', () => {
    it('should handle malformed attempt ID', async () => {
      // Arrange
      const params = { id: 'invalid-uuid' };
      const error = new InvalidInputError('Invalid UUID format', ['attemptId must be a valid UUID']);
      
      setup.getAttemptResultsUseCase.execute.mockResolvedValue(left(error));

      // Act & Assert
      try {
        await setup.controller.getAttemptResults(params, mockUser);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = error.getResponse();
        expect(response.error).toBe('INVALID_INPUT');
        expect(response.details).toContain('attemptId must be a valid UUID');
      }
    });

    it('should handle different user roles accessing results', async () => {
      // Arrange - Student user accessing own attempt
      const studentUser = {
        sub: '550e8400-e29b-41d4-a716-446655440001',
        role: 'student'
      };
      const params = { id: data.validAttemptId };
      const mockResponse = data.createGetAttemptResultsResponse('QUIZ');
      
      setup.getAttemptResultsUseCase.execute.mockResolvedValue(right(mockResponse));

      // Act
      const result = await setup.controller.getAttemptResults(params, studentUser);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(setup.getAttemptResultsUseCase.execute).toHaveBeenCalledWith({
        attemptId: data.validAttemptId,
        requesterId: studentUser.sub,
      });
    });

    it('should handle tutor accessing student attempt', async () => {
      // Arrange - Tutor user accessing student attempt
      const tutorUser = {
        sub: '550e8400-e29b-41d4-a716-446655440002',
        role: 'tutor'
      };
      const params = { id: data.validAttemptId };
      const mockResponse = data.createGetAttemptResultsResponse('PROVA_ABERTA', false);
      
      setup.getAttemptResultsUseCase.execute.mockResolvedValue(right(mockResponse));

      // Act
      const result = await setup.controller.getAttemptResults(params, tutorUser);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(setup.getAttemptResultsUseCase.execute).toHaveBeenCalledWith({
        attemptId: data.validAttemptId,
        requesterId: tutorUser.sub,
      });
    });

    it('should handle attempt with partial answers', async () => {
      // Arrange
      const params = { id: data.validAttemptId };
      const partialResponse = data.createGetAttemptResultsResponse('QUIZ');
      partialResponse.results.answeredQuestions = 7;
      partialResponse.results.totalQuestions = 10;
      
      setup.getAttemptResultsUseCase.execute.mockResolvedValue(right(partialResponse));

      // Act
      const result = await setup.controller.getAttemptResults(params, mockUser);

      // Assert
      expect(result.results.answeredQuestions).toBeLessThan(result.results.totalQuestions);
      expect(result.results.answeredQuestions).toBe(7);
      expect(result.results.totalQuestions).toBe(10);
    });

    it('should handle attempt with zero score', async () => {
      // Arrange
      const params = { id: data.validAttemptId };
      const zeroScoreResponse = data.createGetAttemptResultsResponse('QUIZ');
      zeroScoreResponse.attempt.score = 0;
      zeroScoreResponse.results.correctAnswers = 0;
      zeroScoreResponse.results.scorePercentage = 0;
      zeroScoreResponse.results.passed = false;
      
      setup.getAttemptResultsUseCase.execute.mockResolvedValue(right(zeroScoreResponse));

      // Act
      const result = await setup.controller.getAttemptResults(params, mockUser);

      // Assert
      expect(result.attempt.score).toBe(0);
      expect(result.results.correctAnswers).toBe(0);
      expect(result.results.scorePercentage).toBe(0);
      expect(result.results.passed).toBe(false);
    });

    it('should handle attempt with perfect score', async () => {
      // Arrange
      const params = { id: data.validAttemptId };
      const perfectScoreResponse = data.createGetAttemptResultsResponse('SIMULADO');
      perfectScoreResponse.attempt.score = 100;
      perfectScoreResponse.results.correctAnswers = perfectScoreResponse.results.totalQuestions;
      perfectScoreResponse.results.scorePercentage = 100;
      perfectScoreResponse.results.passed = true;
      
      setup.getAttemptResultsUseCase.execute.mockResolvedValue(right(perfectScoreResponse));

      // Act
      const result = await setup.controller.getAttemptResults(params, mockUser);

      // Assert
      expect(result.attempt.score).toBe(100);
      expect(result.results.correctAnswers).toBe(result.results.totalQuestions);
      expect(result.results.scorePercentage).toBe(100);
      expect(result.results.passed).toBe(true);
    });

    it('should handle attempt with time limit that was not reached', async () => {
      // Arrange
      const params = { id: data.validAttemptId };
      const timedResponse = data.createGetAttemptResultsResponse('SIMULADO');
      timedResponse.attempt.timeLimitExpiresAt = new Date('2023-01-01T12:00:00Z');
      timedResponse.results.timeSpent = 90; // minutes, less than 120 limit
      
      setup.getAttemptResultsUseCase.execute.mockResolvedValue(right(timedResponse));

      // Act
      const result = await setup.controller.getAttemptResults(params, mockUser);

      // Assert
      expect(result.attempt.timeLimitExpiresAt).toBeDefined();
      expect(result.results.timeSpent).toBeLessThan(120);
      expect(result.assessment.timeLimitInMinutes).toBe(120);
    });

    it('should handle empty answers array', async () => {
      // Arrange
      const params = { id: data.validAttemptId };
      const noAnswersResponse = data.createGetAttemptResultsResponse('QUIZ');
      noAnswersResponse.answers = [];
      
      setup.getAttemptResultsUseCase.execute.mockResolvedValue(right(noAnswersResponse));

      // Act
      const result = await setup.controller.getAttemptResults(params, mockUser);

      // Assert
      expect(result.answers).toEqual([]);
      expect(Array.isArray(result.answers)).toBe(true);
    });
  });

  describe('Data Validation', () => {
    it('should validate attempt response structure has correct types', async () => {
      // Arrange
      const params = { id: data.validAttemptId };
      const mockResponse = data.createGetAttemptResultsResponse('QUIZ');
      
      setup.getAttemptResultsUseCase.execute.mockResolvedValue(right(mockResponse));

      // Act
      const result = await setup.controller.getAttemptResults(params, mockUser);

      // Assert - Type validations
      expect(typeof result.attempt.id).toBe('string');
      expect(typeof result.attempt.status).toBe('string');
      expect(typeof result.attempt.identityId).toBe('string');
      expect(typeof result.attempt.assessmentId).toBe('string');
      expect(result.attempt.startedAt).toBeInstanceOf(Date);
      expect(result.attempt.submittedAt).toBeInstanceOf(Date);
      expect(result.attempt.gradedAt).toBeInstanceOf(Date);
      
      expect(typeof result.assessment.id).toBe('string');
      expect(typeof result.assessment.title).toBe('string');
      expect(typeof result.assessment.type).toBe('string');
      expect(typeof result.assessment.passingScore).toBe('number');
      
      expect(typeof result.results.totalQuestions).toBe('number');
      expect(typeof result.results.answeredQuestions).toBe('number');
      expect(typeof result.results.correctAnswers).toBe('number');
      expect(typeof result.results.scorePercentage).toBe('number');
      expect(typeof result.results.passed).toBe('boolean');
    });

    it('should validate argument results structure for SIMULADO', async () => {
      // Arrange
      const params = { id: data.validAttemptId };
      const mockResponse = data.createGetAttemptResultsResponse('SIMULADO');
      
      setup.getAttemptResultsUseCase.execute.mockResolvedValue(right(mockResponse));

      // Act
      const result = await setup.controller.getAttemptResults(params, mockUser);

      // Assert
      expect(result.results.argumentResults).toBeDefined();
      expect(Array.isArray(result.results.argumentResults)).toBe(true);
      
      if (result.results.argumentResults && result.results.argumentResults.length > 0) {
        result.results.argumentResults.forEach(argResult => {
          expect(typeof argResult.argumentId).toBe('string');
          expect(typeof argResult.argumentTitle).toBe('string');
          expect(typeof argResult.totalQuestions).toBe('number');
          expect(typeof argResult.correctAnswers).toBe('number');
          expect(typeof argResult.scorePercentage).toBe('number');
          
          // UUID validation
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          expect(argResult.argumentId).toMatch(uuidRegex);
        });
      }
    });

    it('should validate answers structure', async () => {
      // Arrange
      const params = { id: data.validAttemptId };
      const mockResponse = data.createGetAttemptResultsResponse('QUIZ');
      
      setup.getAttemptResultsUseCase.execute.mockResolvedValue(right(mockResponse));

      // Act
      const result = await setup.controller.getAttemptResults(params, mockUser);

      // Assert
      expect(Array.isArray(result.answers)).toBe(true);
      
      if (result.answers.length > 0) {
        result.answers.forEach(answer => {
          expect(typeof answer.id).toBe('string');
          expect(typeof answer.questionId).toBe('string');
          expect(typeof answer.questionText).toBe('string');
          expect(['MULTIPLE_CHOICE', 'OPEN']).toContain(answer.questionType);
          expect(typeof answer.isCorrect).toBe('boolean');
          expect(['IN_PROGRESS', 'SUBMITTED', 'GRADED']).toContain(answer.status);
          
          // UUID validation
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          expect(answer.id).toMatch(uuidRegex);
          expect(answer.questionId).toMatch(uuidRegex);
        });
      }
    });
  });

  describe('Error Response Consistency', () => {
    it('should return consistent error format for all error types', async () => {
      const params = { id: data.validAttemptId };
      
      const errorTestCases = [
        {
          error: new InvalidInputError('Invalid data'),
          expectedType: BadRequestException,
          expectedErrorCode: 'INVALID_INPUT',
        },
        {
          error: new AttemptNotFoundError(),
          expectedType: NotFoundException,
          expectedErrorCode: 'ATTEMPT_NOT_FOUND',
        },
        {
          error: new UserNotFoundError(),
          expectedType: NotFoundException,
          expectedErrorCode: 'USER_NOT_FOUND',
        },
        {
          error: new AssessmentNotFoundError(),
          expectedType: NotFoundException,
          expectedErrorCode: 'ASSESSMENT_NOT_FOUND',
        },
        {
          error: new InsufficientPermissionsError(),
          expectedType: ForbiddenException,
          expectedErrorCode: 'INSUFFICIENT_PERMISSIONS',
        },
        {
          error: new RepositoryError('DB error'),
          expectedType: InternalServerErrorException,
          expectedErrorCode: 'INTERNAL_ERROR',
        },
      ];

      for (const testCase of errorTestCases) {
        setup.getAttemptResultsUseCase.execute.mockResolvedValue(left(testCase.error));

        try {
          await setup.controller.getAttemptResults(params, mockUser);
          throw new Error('Expected method to throw');
        } catch (thrownError) {
          expect(thrownError).toBeInstanceOf(testCase.expectedType);
          const response = thrownError.getResponse();
          expect(response.error).toBe(testCase.expectedErrorCode);
          expect(typeof response.message).toBe('string');
        }
      }
    });
  });
});