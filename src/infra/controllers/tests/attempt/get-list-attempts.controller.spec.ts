// src/infra/controllers/tests/attempt/get-list-attempts.controller.spec.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { AttemptController } from '../../attempt.controller';
import { ListAttemptsUseCase } from '@/domain/assessment/application/use-cases/list-attempts.use-case';
import { InvalidInputError } from '@/domain/assessment/application/use-cases/errors/invalid-input-error';
import { UserNotFoundError } from '@/domain/assessment/application/use-cases/errors/user-not-found-error';
import { InsufficientPermissionsError } from '@/domain/assessment/application/use-cases/errors/insufficient-permissions-error';
import { RepositoryError } from '@/domain/assessment/application/use-cases/errors/repository-error';
import { right, left } from '@/core/either';
import { ListAttemptsQueryDto } from '../../dtos/list-attempts-query.dto';

describe('AttemptController - GET /attempts', () => {
  let controller: AttemptController;
  let listAttemptsUseCase: any;

  const mockUser = {
    sub: '550e8400-e29b-41d4-a716-446655440010',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
  };

  const mockAttemptsList = {
    attempts: [
      {
        id: '550e8400-e29b-41d4-a716-446655440040',
        status: 'SUBMITTED' as const,
        score: 85,
        startedAt: new Date('2024-01-01T10:00:00Z'),
        submittedAt: new Date('2024-01-01T11:00:00Z'),
        userId: '550e8400-e29b-41d4-a716-446655440020',
        assessmentId: '550e8400-e29b-41d4-a716-446655440030',
        assessment: {
          id: '550e8400-e29b-41d4-a716-446655440030',
          title: 'Test Assessment',
          type: 'QUIZ' as const,
          passingScore: 70,
        },
        student: {
          id: '550e8400-e29b-41d4-a716-446655440020',
          name: 'Student User',
          email: 'student@example.com',
        },
        createdAt: new Date('2024-01-01T09:00:00Z'),
        updatedAt: new Date('2024-01-01T11:00:00Z'),
      },
    ],
    pagination: {
      page: 1,
      pageSize: 20,
      total: 1,
      totalPages: 1,
    },
  };

  beforeEach(() => {
    // Create mock use cases
    const mockStartAttemptUseCase = { execute: vi.fn() };
    const mockSubmitAnswerUseCase = { execute: vi.fn() };
    const mockSubmitAttemptUseCase = { execute: vi.fn() };
    const mockGetAttemptResultsUseCase = { execute: vi.fn() };
    const mockReviewOpenAnswerUseCase = { execute: vi.fn() };
    listAttemptsUseCase = { execute: vi.fn() };

    controller = new AttemptController(
      mockStartAttemptUseCase as any,
      mockSubmitAnswerUseCase as any,
      mockSubmitAttemptUseCase as any,
      mockGetAttemptResultsUseCase as any,
      mockReviewOpenAnswerUseCase as any,
      listAttemptsUseCase as any,
    );
  });

  describe('listAttempts', () => {
    it('should return attempts list successfully', async () => {
      // Arrange
      listAttemptsUseCase.execute.mockResolvedValue(right(mockAttemptsList));

      const query: ListAttemptsQueryDto = {
        page: 1,
        pageSize: 20,
      };

      // Act
      const result = await controller.listAttempts(query, mockUser);

      // Assert
      expect(result).toEqual(mockAttemptsList);
      expect(listAttemptsUseCase.execute).toHaveBeenCalledWith({
        status: undefined,
        userId: undefined,
        assessmentId: undefined,
        page: 1,
        pageSize: 20,
        requesterId: mockUser.sub,
      });
    });

    it('should return attempts filtered by status', async () => {
      // Arrange
      listAttemptsUseCase.execute.mockResolvedValue(right(mockAttemptsList));

      const query: ListAttemptsQueryDto = {
        status: 'SUBMITTED',
        page: 1,
        pageSize: 20,
      };

      // Act
      const result = await controller.listAttempts(query, mockUser);

      // Assert
      expect(result).toEqual(mockAttemptsList);
      expect(listAttemptsUseCase.execute).toHaveBeenCalledWith({
        status: 'SUBMITTED',
        userId: undefined,
        assessmentId: undefined,
        page: 1,
        pageSize: 20,
        requesterId: mockUser.sub,
      });
    });

    it('should throw BadRequestException for invalid input error', async () => {
      // Arrange
      const invalidInputError = new InvalidInputError('Invalid input data');
      listAttemptsUseCase.execute.mockResolvedValue(left(invalidInputError));

      const query: ListAttemptsQueryDto = {};

      // Act & Assert
      await expect(controller.listAttempts(query, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException for user not found error', async () => {
      // Arrange
      const userNotFoundError = new UserNotFoundError();
      listAttemptsUseCase.execute.mockResolvedValue(left(userNotFoundError));

      const query: ListAttemptsQueryDto = {};

      // Act & Assert
      await expect(controller.listAttempts(query, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException for insufficient permissions error', async () => {
      // Arrange
      const insufficientPermissionsError = new InsufficientPermissionsError();
      listAttemptsUseCase.execute.mockResolvedValue(left(insufficientPermissionsError));

      const query: ListAttemptsQueryDto = {};

      // Act & Assert
      await expect(controller.listAttempts(query, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw InternalServerErrorException for repository error', async () => {
      // Arrange
      const repositoryError = new RepositoryError('Database error');
      listAttemptsUseCase.execute.mockResolvedValue(left(repositoryError));

      const query: ListAttemptsQueryDto = {};

      // Act & Assert
      await expect(controller.listAttempts(query, mockUser)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});