// src/infra/controllers/tests/attempt/post-submit-attempt.controller.spec.ts

import { describe, it, expect, beforeEach } from 'vitest';
import {
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { left, right } from '@/core/either';

import { AttemptControllerTestSetup } from './shared/attempt-controller-test-setup';
import { AttemptControllerTestData } from './shared/attempt-controller-test-data';
import { InvalidInputError } from '@/domain/assessment/application/use-cases/errors/invalid-input-error';
import { AttemptNotFoundError } from '@/domain/assessment/application/use-cases/errors/attempt-not-found-error';
import { AttemptNotActiveError } from '@/domain/assessment/application/use-cases/errors/attempt-not-active-error';
import { AssessmentNotFoundError } from '@/domain/assessment/application/use-cases/errors/assessment-not-found-error';
import { NoAnswersFoundError } from '@/domain/assessment/application/use-cases/errors/no-answers-found-error';
import { AttemptExpiredError } from '@/domain/assessment/application/use-cases/errors/attempt-expired-error';
import { RepositoryError } from '@/domain/assessment/application/use-cases/errors/repository-error';

describe('[Unit] AttemptController - POST /:id/submit (submitAttempt)', () => {
  let testSetup: AttemptControllerTestSetup;
  let controller: AttemptControllerTestSetup['controller'];
  let submitAttemptUseCase: AttemptControllerTestSetup['submitAttemptUseCase'];

  beforeEach(() => {
    testSetup = new AttemptControllerTestSetup();
    const instances = testSetup.getTestInstances();
    controller = instances.controller;
    submitAttemptUseCase = instances.submitAttemptUseCase;
    testSetup.resetMocks();
  });

  describe('Success Cases', () => {
    it('should submit attempt with automatic grading successfully', async () => {
      // Arrange
      const params = AttemptControllerTestData.validSubmitAttemptParams.withActiveAttempt();
      const expectedResponse = AttemptControllerTestData.mockSubmitAttemptResponse.autoGraded();

      submitAttemptUseCase.execute.mockResolvedValue(right(expectedResponse));

      // Act
      const result = await controller.submitAttempt(params);

      // Assert
      expect(submitAttemptUseCase.execute).toHaveBeenCalledWith({
        attemptId: params.id,
      });
      expect(result).toEqual(expectedResponse);
    });

    it('should submit attempt with manual grading (open questions)', async () => {
      // Arrange
      const params = AttemptControllerTestData.validSubmitAttemptParams.withActiveAttempt();
      const expectedResponse = AttemptControllerTestData.mockSubmitAttemptResponse.manualGrading();

      submitAttemptUseCase.execute.mockResolvedValue(right(expectedResponse));

      // Act
      const result = await controller.submitAttempt(params);

      // Assert
      expect(submitAttemptUseCase.execute).toHaveBeenCalledWith({
        attemptId: params.id,
      });
      expect(result).toEqual(expectedResponse);
    });

    it('should handle submission with partial answers', async () => {
      // Arrange
      const params = AttemptControllerTestData.validSubmitAttemptParams.withActiveAttempt();
      const expectedResponse = AttemptControllerTestData.mockSubmitAttemptResponse.partialAnswers();

      submitAttemptUseCase.execute.mockResolvedValue(right(expectedResponse));

      // Act
      const result = await controller.submitAttempt(params);

      // Assert
      expect(submitAttemptUseCase.execute).toHaveBeenCalledWith({
        attemptId: params.id,
      });
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('Error Cases - Validation', () => {
    it('should throw BadRequestException for InvalidInputError', async () => {
      // Arrange
      const params = AttemptControllerTestData.validSubmitAttemptParams.withActiveAttempt();
      const error = new InvalidInputError('Invalid input', ['attemptId must be a valid UUID']);

      submitAttemptUseCase.execute.mockResolvedValue(left(error));

      // Act & Assert
      await expect(controller.submitAttempt(params)).rejects.toThrow(BadRequestException);
      
      try {
        await controller.submitAttempt(params);
      } catch (exception) {
        expect(exception.getResponse()).toEqual({
          error: 'INVALID_INPUT',
          message: 'Invalid input data',
          details: ['attemptId must be a valid UUID'],
        });
      }
    });
  });

  describe('Error Cases - Not Found', () => {
    it('should throw NotFoundException for AttemptNotFoundError', async () => {
      // Arrange
      const params = AttemptControllerTestData.validSubmitAttemptParams.withActiveAttempt();
      const error = new AttemptNotFoundError();

      submitAttemptUseCase.execute.mockResolvedValue(left(error));

      // Act & Assert
      await expect(controller.submitAttempt(params)).rejects.toThrow(NotFoundException);
      
      try {
        await controller.submitAttempt(params);
      } catch (exception) {
        expect(exception.getResponse()).toEqual({
          error: 'ATTEMPT_NOT_FOUND',
          message: 'Attempt not found',
        });
      }
    });

    it('should throw NotFoundException for AssessmentNotFoundError', async () => {
      // Arrange
      const params = AttemptControllerTestData.validSubmitAttemptParams.withActiveAttempt();
      const error = new AssessmentNotFoundError();

      submitAttemptUseCase.execute.mockResolvedValue(left(error));

      // Act & Assert
      await expect(controller.submitAttempt(params)).rejects.toThrow(NotFoundException);
      
      try {
        await controller.submitAttempt(params);
      } catch (exception) {
        expect(exception.getResponse()).toEqual({
          error: 'ASSESSMENT_NOT_FOUND',
          message: 'Assessment not found',
        });
      }
    });
  });

  describe('Error Cases - Business Logic', () => {
    it('should throw BadRequestException for AttemptNotActiveError', async () => {
      // Arrange
      const params = AttemptControllerTestData.validSubmitAttemptParams.withActiveAttempt();
      const error = new AttemptNotActiveError();

      submitAttemptUseCase.execute.mockResolvedValue(left(error));

      // Act & Assert
      await expect(controller.submitAttempt(params)).rejects.toThrow(BadRequestException);
      
      try {
        await controller.submitAttempt(params);
      } catch (exception) {
        expect(exception.getResponse()).toEqual({
          error: 'ATTEMPT_NOT_ACTIVE',
          message: 'Attempt is not active',
        });
      }
    });

    it('should throw BadRequestException for NoAnswersFoundError', async () => {
      // Arrange
      const params = AttemptControllerTestData.validSubmitAttemptParams.withActiveAttempt();
      const error = new NoAnswersFoundError();

      submitAttemptUseCase.execute.mockResolvedValue(left(error));

      // Act & Assert
      await expect(controller.submitAttempt(params)).rejects.toThrow(BadRequestException);
      
      try {
        await controller.submitAttempt(params);
      } catch (exception) {
        expect(exception.getResponse()).toEqual({
          error: 'NO_ANSWERS_FOUND',
          message: 'No answers found for this attempt',
        });
      }
    });

    it('should throw BadRequestException for AttemptExpiredError', async () => {
      // Arrange
      const params = AttemptControllerTestData.validSubmitAttemptParams.withActiveAttempt();
      const error = new AttemptExpiredError();

      submitAttemptUseCase.execute.mockResolvedValue(left(error));

      // Act & Assert
      await expect(controller.submitAttempt(params)).rejects.toThrow(BadRequestException);
      
      try {
        await controller.submitAttempt(params);
      } catch (exception) {
        expect(exception.getResponse()).toEqual({
          error: 'ATTEMPT_EXPIRED',
          message: 'Attempt has expired',
        });
      }
    });
  });

  describe('Error Cases - Infrastructure', () => {
    it('should throw InternalServerErrorException for RepositoryError', async () => {
      // Arrange
      const params = AttemptControllerTestData.validSubmitAttemptParams.withActiveAttempt();
      const error = new RepositoryError('Database connection failed');

      submitAttemptUseCase.execute.mockResolvedValue(left(error));

      // Act & Assert
      await expect(controller.submitAttempt(params)).rejects.toThrow(InternalServerErrorException);
      
      try {
        await controller.submitAttempt(params);
      } catch (exception) {
        expect(exception.getResponse()).toEqual({
          error: 'INTERNAL_ERROR',
          message: 'Database connection failed',
        });
      }
    });

    it('should throw InternalServerErrorException for unmapped errors', async () => {
      // Arrange
      const params = AttemptControllerTestData.validSubmitAttemptParams.withActiveAttempt();
      const unmappedError = new Error('Some unexpected error');

      submitAttemptUseCase.execute.mockResolvedValue(left(unmappedError));

      // Act & Assert
      await expect(controller.submitAttempt(params)).rejects.toThrow(InternalServerErrorException);
      
      try {
        await controller.submitAttempt(params);
      } catch (exception) {
        expect(exception.getResponse()).toEqual({
          error: 'INTERNAL_ERROR',
          message: 'Unexpected error occurred',
        });
      }
    });
  });

  describe('Integration with Use Case', () => {
    it('should call submit attempt use case with correct parameters', async () => {
      // Arrange
      const params = AttemptControllerTestData.validSubmitAttemptParams.withActiveAttempt();
      const expectedResponse = AttemptControllerTestData.mockSubmitAttemptResponse.autoGraded();

      submitAttemptUseCase.execute.mockResolvedValue(right(expectedResponse));

      // Act
      await controller.submitAttempt(params);

      // Assert
      expect(submitAttemptUseCase.execute).toHaveBeenCalledTimes(1);
      expect(submitAttemptUseCase.execute).toHaveBeenCalledWith({
        attemptId: params.id,
      });
    });

    it('should return the exact response from use case on success', async () => {
      // Arrange
      const params = AttemptControllerTestData.validSubmitAttemptParams.withActiveAttempt();
      const expectedResponse = AttemptControllerTestData.mockSubmitAttemptResponse.autoGraded();

      submitAttemptUseCase.execute.mockResolvedValue(right(expectedResponse));

      // Act
      const result = await controller.submitAttempt(params);

      // Assert
      expect(result).toBe(expectedResponse);
      expect(result).toEqual(expectedResponse);
    });
  });
});