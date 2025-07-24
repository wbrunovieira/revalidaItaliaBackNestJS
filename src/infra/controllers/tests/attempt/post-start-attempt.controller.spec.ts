// src/infra/controllers/tests/attempt/post-start-attempt.controller.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
  BadRequestException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { left, right } from '@/core/either';
import { AttemptControllerTestSetup } from './shared/attempt-controller-test-setup';
import { AttemptControllerTestData } from './shared/attempt-controller-test-data';
import { AttemptControllerTestHelpers } from './shared/attempt-controller-test-helpers';
import { InvalidInputError } from '@/domain/assessment/application/use-cases/errors/invalid-input-error';
import { UserNotFoundError } from '@/domain/assessment/application/use-cases/errors/user-not-found-error';
import { AssessmentNotFoundError } from '@/domain/assessment/application/use-cases/errors/assessment-not-found-error';
import { RepositoryError } from '@/domain/assessment/application/use-cases/errors/repository-error';
import { StartAttemptDto } from '@/domain/assessment/application/dtos/start-attempt.dto';

describe('AttemptController - startAttempt', () => {
  let testSetup: AttemptControllerTestSetup;

  beforeEach(() => {
    testSetup = new AttemptControllerTestSetup();
  });

  describe('Success Cases', () => {
    it('should start attempt successfully', async () => {
      const dto: StartAttemptDto =
        AttemptControllerTestData.validStartAttemptDto();
      const mockResponse = AttemptControllerTestData.mockStartAttemptResponse();

      testSetup.startAttemptUseCase.execute.mockResolvedValueOnce(
        right(mockResponse),
      );

      const result = await testSetup.controller.startAttempt(dto);

      AttemptControllerTestHelpers.verifyUseCaseCalledWith(
        testSetup.startAttemptUseCase,
        dto.identityId,
        dto.assessmentId,
      );
      AttemptControllerTestHelpers.verifyUseCaseCalledOnce(
        testSetup.startAttemptUseCase,
      );
      AttemptControllerTestHelpers.verifyStartAttemptResponseStructure(result);
      expect(result).toEqual(mockResponse);
    });

    it('should start attempt for quiz assessment', async () => {
      const dto: StartAttemptDto =
        AttemptControllerTestData.validStartAttemptDtoForQuiz();
      const mockResponse = AttemptControllerTestData.mockStartAttemptResponseForQuiz();

      testSetup.startAttemptUseCase.execute.mockResolvedValueOnce(
        right(mockResponse),
      );

      const result = await testSetup.controller.startAttempt(dto);

      expect(result.attempt.status).toBe('IN_PROGRESS');
      expect(result.attempt.identityId).toBe(dto.identityId);
      expect(result.attempt.assessmentId).toBe(dto.assessmentId);
      AttemptControllerTestHelpers.verifyStartAttemptResponseStructure(result);
    });

    it('should start attempt for simulado assessment with time limit', async () => {
      const dto: StartAttemptDto =
        AttemptControllerTestData.validStartAttemptDtoForSimulado();
      const mockResponse =
        AttemptControllerTestData.mockStartAttemptResponseWithTimeLimit();

      testSetup.startAttemptUseCase.execute.mockResolvedValueOnce(
        right(mockResponse),
      );

      const result = await testSetup.controller.startAttempt(dto);

      AttemptControllerTestHelpers.verifyStartAttemptResponseWithTimeLimit(
        result,
      );
      expect(result.attempt.timeLimitExpiresAt).toBeDefined();
    });
  });

  describe('Error Cases - Invalid Input', () => {
    it('should throw BadRequestException for invalid input', async () => {
      const dto: StartAttemptDto =
        AttemptControllerTestData.validStartAttemptDto();
      const invalidInputError = new InvalidInputError('Invalid input data');

      testSetup.startAttemptUseCase.execute.mockResolvedValueOnce(
        left(invalidInputError),
      );

      await expect(testSetup.controller.startAttempt(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle validation error with details', async () => {
      const dto: StartAttemptDto =
        AttemptControllerTestData.validStartAttemptDto();
      const invalidInputError = new InvalidInputError('Invalid UUID format', [
        'identityId must be a valid UUID',
        'identityId cannot be empty',
      ]);

      testSetup.startAttemptUseCase.execute.mockResolvedValueOnce(
        left(invalidInputError),
      );

      try {
        await testSetup.controller.startAttempt(dto);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = error.getResponse();
        expect(response.details).toBeDefined();
        expect(Array.isArray(response.details)).toBe(true);
      }
    });

    it('should handle invalid identityId format', async () => {
      const dto = AttemptControllerTestData.invalidStartAttemptDto.invalidIdentityId();
      const invalidInputError = new InvalidInputError('Invalid UUID format', [
        'identityId must be a valid UUID',
      ]);

      testSetup.startAttemptUseCase.execute.mockResolvedValueOnce(
        left(invalidInputError),
      );

      try {
        await testSetup.controller.startAttempt(dto);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = error.getResponse();
        expect(response.error).toBe('INVALID_INPUT');
        expect(response.message).toBe('Invalid input data');
        expect(response.details).toContain('identityId must be a valid UUID');
      }
    });

    it('should handle invalid assessmentId format', async () => {
      const dto = AttemptControllerTestData.invalidStartAttemptDto.invalidAssessmentId();
      const invalidInputError = new InvalidInputError('Invalid UUID format', [
        'assessmentId must be a valid UUID',
      ]);

      testSetup.startAttemptUseCase.execute.mockResolvedValueOnce(
        left(invalidInputError),
      );

      try {
        await testSetup.controller.startAttempt(dto);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = error.getResponse();
        expect(response.error).toBe('INVALID_INPUT');
        expect(response.message).toBe('Invalid input data');
        expect(response.details).toContain('assessmentId must be a valid UUID');
      }
    });

    it('should handle missing identityId', async () => {
      const dto = AttemptControllerTestData.invalidStartAttemptDto.missingIdentityId();
      const invalidInputError = new InvalidInputError('Missing required fields', [
        'identityId is required',
      ]);

      testSetup.startAttemptUseCase.execute.mockResolvedValueOnce(
        left(invalidInputError),
      );

      try {
        await testSetup.controller.startAttempt(dto);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = error.getResponse();
        expect(response.details).toContain('identityId is required');
      }
    });

    it('should handle missing assessmentId', async () => {
      const dto = AttemptControllerTestData.invalidStartAttemptDto.missingAssessmentId();
      const invalidInputError = new InvalidInputError('Missing required fields', [
        'assessmentId is required',
      ]);

      testSetup.startAttemptUseCase.execute.mockResolvedValueOnce(
        left(invalidInputError),
      );

      try {
        await testSetup.controller.startAttempt(dto);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = error.getResponse();
        expect(response.details).toContain('assessmentId is required');
      }
    });
  });

  describe('Error Cases - Not Found', () => {
    it('should throw NotFoundException when user not found', async () => {
      const dto: StartAttemptDto =
        AttemptControllerTestData.validStartAttemptDto();
      const userNotFoundError = new UserNotFoundError();

      testSetup.startAttemptUseCase.execute.mockResolvedValueOnce(
        left(userNotFoundError),
      );

      await expect(testSetup.controller.startAttempt(dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when assessment not found', async () => {
      const dto: StartAttemptDto =
        AttemptControllerTestData.validStartAttemptDto();
      const assessmentNotFoundError = new AssessmentNotFoundError();

      testSetup.startAttemptUseCase.execute.mockResolvedValueOnce(
        left(assessmentNotFoundError),
      );

      await expect(testSetup.controller.startAttempt(dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('Success Cases - Existing Attempt', () => {
    it('should return existing attempt when attempt already active', async () => {
      const dto: StartAttemptDto =
        AttemptControllerTestData.validStartAttemptDto();
      const existingAttemptResponse = {
        attempt: {
          id: 'existing-attempt-id',
          status: 'IN_PROGRESS' as const,
          startedAt: new Date(),
          timeLimitExpiresAt: undefined,
          identityId: dto.identityId,
          assessmentId: dto.assessmentId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        isNew: false,
        answeredQuestions: 3,
        totalQuestions: 10,
      };

      testSetup.startAttemptUseCase.execute.mockResolvedValueOnce(
        right(existingAttemptResponse),
      );

      const result = await testSetup.controller.startAttempt(dto);
      
      expect(result).toEqual(existingAttemptResponse);
      expect(result.isNew).toBe(false);
    });
  });

  describe('Error Cases - Internal Server Error', () => {
    it('should throw InternalServerErrorException for repository error', async () => {
      const dto: StartAttemptDto =
        AttemptControllerTestData.validStartAttemptDto();
      const repositoryError = new RepositoryError('Database connection failed');

      testSetup.startAttemptUseCase.execute.mockResolvedValueOnce(
        left(repositoryError),
      );

      await expect(testSetup.controller.startAttempt(dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw InternalServerErrorException for unexpected error', async () => {
      const dto: StartAttemptDto =
        AttemptControllerTestData.validStartAttemptDto();
      const unexpectedError = new Error('Unexpected error');

      testSetup.startAttemptUseCase.execute.mockResolvedValueOnce(
        left(unexpectedError),
      );

      await expect(testSetup.controller.startAttempt(dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('Use Case Integration', () => {
    it('should pass correct request to use case', async () => {
      const dto: StartAttemptDto =
        AttemptControllerTestData.validStartAttemptDto();
      const mockResponse = AttemptControllerTestData.mockStartAttemptResponse();

      testSetup.startAttemptUseCase.execute.mockResolvedValueOnce(
        right(mockResponse),
      );

      await testSetup.controller.startAttempt(dto);

      expect(testSetup.startAttemptUseCase.execute).toHaveBeenCalledWith({
        identityId: dto.identityId,
        assessmentId: dto.assessmentId,
      });
    });

    it('should handle use case rejection', async () => {
      const dto: StartAttemptDto =
        AttemptControllerTestData.validStartAttemptDto();

      testSetup.startAttemptUseCase.execute.mockRejectedValueOnce(
        new Error('Use case error'),
      );

      await expect(testSetup.controller.startAttempt(dto)).rejects.toThrow();
    });
  });

  describe('Response Validation', () => {
    it('should return response with correct data structure', async () => {
      const dto: StartAttemptDto =
        AttemptControllerTestData.validStartAttemptDto();
      const mockResponse = AttemptControllerTestData.mockStartAttemptResponse();

      testSetup.startAttemptUseCase.execute.mockResolvedValueOnce(
        right(mockResponse),
      );

      const result = await testSetup.controller.startAttempt(dto);

      expect(result).toEqual(mockResponse);
      expect(result.attempt.id).toBe(mockResponse.attempt.id);
      expect(result.attempt.identityId).toBe(dto.identityId);
      expect(result.attempt.assessmentId).toBe(dto.assessmentId);
      expect(result.attempt.status).toBe('IN_PROGRESS');
    });

    it('should maintain response integrity across multiple calls', async () => {
      const dto: StartAttemptDto =
        AttemptControllerTestData.validStartAttemptDto();
      const mockResponse = AttemptControllerTestData.mockStartAttemptResponse();

      testSetup.startAttemptUseCase.execute.mockResolvedValue(
        right(mockResponse),
      );

      const result1 = await testSetup.controller.startAttempt(dto);
      const result2 = await testSetup.controller.startAttempt(dto);

      expect(result1).toEqual(result2);
      expect(testSetup.startAttemptUseCase.execute).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined values in DTO', async () => {
      const dtoWithNull = AttemptControllerTestData.invalidStartAttemptDto.nullIdentityId();
      const invalidInputError = new InvalidInputError('Invalid input data', [
        'identityId must be a valid UUID',
        'identityId is required',
      ]);

      testSetup.startAttemptUseCase.execute.mockResolvedValueOnce(
        left(invalidInputError),
      );

      try {
        await testSetup.controller.startAttempt(dtoWithNull);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = error.getResponse();
        expect(response.error).toBe('INVALID_INPUT');
      }
    });

    it('should handle empty string values in DTO', async () => {
      const dtoWithEmpty = AttemptControllerTestData.invalidStartAttemptDto.emptyIdentityId();
      const invalidInputError = new InvalidInputError('Invalid input data', [
        'identityId must be a valid UUID',
        'identityId is required',
      ]);

      testSetup.startAttemptUseCase.execute.mockResolvedValueOnce(
        left(invalidInputError),
      );

      try {
        await testSetup.controller.startAttempt(dtoWithEmpty);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = error.getResponse();
        expect(response.error).toBe('INVALID_INPUT');
      }
    });

    it('should handle attempt that is about to expire', async () => {
      const dto: StartAttemptDto = AttemptControllerTestData.validStartAttemptDtoForSimulado();
      const expiringAttemptResponse = {
        attempt: {
          id: 'expiring-attempt-id',
          status: 'IN_PROGRESS' as const,
          startedAt: new Date(Date.now() - 119 * 60 * 1000), // Started 119 minutes ago
          timeLimitExpiresAt: new Date(Date.now() + 1 * 60 * 1000), // Expires in 1 minute
          identityId: dto.identityId,
          assessmentId: dto.assessmentId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        isNew: false,
        answeredQuestions: 8,
        totalQuestions: 10,
      };

      testSetup.startAttemptUseCase.execute.mockResolvedValueOnce(
        right(expiringAttemptResponse),
      );

      const result = await testSetup.controller.startAttempt(dto);

      expect(result.attempt.timeLimitExpiresAt).toBeDefined();
      expect(result.isNew).toBe(false);
      expect(result.answeredQuestions).toBe(8);
    });

    it('should handle assessment with no time limit', async () => {
      const dto: StartAttemptDto = AttemptControllerTestData.validStartAttemptDtoForQuiz();
      const noTimeLimitResponse = {
        attempt: {
          id: 'no-time-limit-attempt',
          status: 'IN_PROGRESS' as const,
          startedAt: new Date(),
          timeLimitExpiresAt: undefined, // No time limit
          identityId: dto.identityId,
          assessmentId: dto.assessmentId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        isNew: true,
        answeredQuestions: 0,
        totalQuestions: 5,
      };

      testSetup.startAttemptUseCase.execute.mockResolvedValueOnce(
        right(noTimeLimitResponse),
      );

      const result = await testSetup.controller.startAttempt(dto);

      expect(result.attempt.timeLimitExpiresAt).toBeUndefined();
      expect(result.isNew).toBe(true);
      expect(result.totalQuestions).toBe(5);
    });
  });

  describe('Controller Response Structure', () => {
    it('should maintain consistent error response format', async () => {
      const dto: StartAttemptDto = AttemptControllerTestData.validStartAttemptDto();
      const repositoryError = new RepositoryError('Database connection failed');

      testSetup.startAttemptUseCase.execute.mockResolvedValueOnce(
        left(repositoryError),
      );

      try {
        await testSetup.controller.startAttempt(dto);
      } catch (error) {
        expect(error).toBeInstanceOf(InternalServerErrorException);
        const response = error.getResponse();
        expect(response).toHaveProperty('error');
        expect(response).toHaveProperty('message');
        expect(response.error).toBe('INTERNAL_ERROR');
        expect(typeof response.message).toBe('string');
      }
    });

    it('should return response with correct HTTP status codes', async () => {
      const testCases = [
        {
          error: new InvalidInputError('Invalid data'),
          expectedErrorType: BadRequestException,
        },
        {
          error: new UserNotFoundError(),
          expectedErrorType: NotFoundException,
        },
        {
          error: new AssessmentNotFoundError(),
          expectedErrorType: NotFoundException,
        },
        {
          error: new RepositoryError('DB error'),
          expectedErrorType: InternalServerErrorException,
        },
      ];

      for (const testCase of testCases) {
        const dto = AttemptControllerTestData.validStartAttemptDto();
        testSetup.startAttemptUseCase.execute.mockResolvedValueOnce(
          left(testCase.error),
        );

        await expect(testSetup.controller.startAttempt(dto)).rejects.toThrow(
          testCase.expectedErrorType,
        );
      }
    });
  });
});
