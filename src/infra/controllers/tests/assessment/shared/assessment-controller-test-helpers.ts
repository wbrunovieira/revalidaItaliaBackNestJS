// src/infra/controllers/tests/assessment/shared/assessment-controller-test-helpers.ts

import { right, left } from '@/core/either';
import { InvalidInputError } from '@/domain/assessment/application/use-cases/errors/invalid-input-error';
import { AssessmentNotFoundError } from '@/domain/assessment/application/use-cases/errors/assessment-not-found-error';
import { RepositoryError } from '@/domain/assessment/application/use-cases/errors/repository-error';
import { BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';

export class AssessmentControllerTestHelpers {
  static async expectInvalidInputError(
    executeMethod: () => Promise<any>,
    expectedDetails?: string[],
  ): Promise<void> {
    await expect(executeMethod()).rejects.toThrow(BadRequestException);
    
    try {
      await executeMethod();
    } catch (error) {
      if (error instanceof BadRequestException) {
        const response = error.getResponse() as any;
        expect(response.error).toBe('INVALID_INPUT');
        expect(response.message).toBe('Invalid input data');
        if (expectedDetails) {
          expect(response.details).toEqual(expectedDetails);
        }
      }
    }
  }

  static async expectAssessmentNotFoundError(
    executeMethod: () => Promise<any>,
  ): Promise<void> {
    await expect(executeMethod()).rejects.toThrow(NotFoundException);
    
    try {
      await executeMethod();
    } catch (error) {
      if (error instanceof NotFoundException) {
        const response = error.getResponse() as any;
        expect(response.error).toBe('ASSESSMENT_NOT_FOUND');
        expect(response.message).toBe('Assessment not found');
      }
    }
  }

  static async expectRepositoryError(
    executeMethod: () => Promise<any>,
    expectedMessage?: string,
  ): Promise<void> {
    await expect(executeMethod()).rejects.toThrow(InternalServerErrorException);
    
    try {
      await executeMethod();
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        const response = error.getResponse() as any;
        expect(response.error).toBe('REPOSITORY_ERROR');
        if (expectedMessage) {
          expect(response.message).toBe(expectedMessage);
        }
      }
    }
  }

  static mockUseCaseSuccess<T>(useCase: any, response: T): void {
    useCase.execute.mockResolvedValue(right(response));
  }

  static mockUseCaseError(useCase: any, error: Error): void {
    useCase.execute.mockResolvedValue(left(error));
  }

  static mockUseCaseUnexpectedError(useCase: any, error: Error): void {
    useCase.execute.mockRejectedValue(error);
  }

  static createValidUUID(): string {
    return '123e4567-e89b-12d3-a456-426614174000';
  }

  static createInvalidUUID(): string {
    return 'invalid-uuid';
  }
}