// src/infra/controllers/tests/attempt/get-list-pending-reviews.controller.spec.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AttemptController } from '../../attempt.controller';
import { ListPendingReviewsUseCase } from '@/domain/assessment/application/use-cases/list-pending-reviews.use-case';
import { InvalidInputError } from '@/domain/assessment/application/use-cases/errors/invalid-input-error';
import { UserNotFoundError } from '@/domain/assessment/application/use-cases/errors/user-not-found-error';
import { InsufficientPermissionsError } from '@/domain/assessment/application/use-cases/errors/insufficient-permissions-error';
import { RepositoryError } from '@/domain/assessment/application/use-cases/errors/repository-error';
import { right, left } from '@/core/either';
import { ListPendingReviewsQueryDto } from '../../dtos/list-pending-reviews-query.dto';

describe('AttemptController - GET /attempts/pending-review', () => {
  let controller: AttemptController;
  let listPendingReviewsUseCase: any;

  const mockTutorUser = {
    sub: '550e8400-e29b-41d4-a716-446655440002',
    email: 'tutor@example.com',
    name: 'Tutor User',
    role: 'tutor',
  };

  const mockPendingReviewsList = {
    attempts: [
      {
        id: '550e8400-e29b-41d4-a716-446655440040',
        status: 'SUBMITTED' as const,
        submittedAt: new Date('2024-01-01T11:00:00Z'),
        assessment: {
          id: '550e8400-e29b-41d4-a716-446655440030',
          title: 'Test Prova Aberta',
          type: 'PROVA_ABERTA' as const,
        },
        student: {
          id: '550e8400-e29b-41d4-a716-446655440020',
          name: 'Student User',
          email: 'student@example.com',
        },
        pendingAnswers: 3,
        totalOpenQuestions: 5,
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
    const mockListAttemptsUseCase = { execute: vi.fn() };
    listPendingReviewsUseCase = { execute: vi.fn() };

    controller = new AttemptController(
      mockStartAttemptUseCase as any,
      mockSubmitAnswerUseCase as any,
      mockSubmitAttemptUseCase as any,
      mockGetAttemptResultsUseCase as any,
      mockReviewOpenAnswerUseCase as any,
      mockListAttemptsUseCase as any,
      listPendingReviewsUseCase,
    );
  });

  describe('listPendingReviews', () => {
    it('should return pending reviews list successfully', async () => {
      // Arrange
      listPendingReviewsUseCase.execute.mockResolvedValue(
        right(mockPendingReviewsList),
      );

      const query: ListPendingReviewsQueryDto = {
        page: 1,
        pageSize: 20,
      };

      // Act
      const result = await controller.listPendingReviews(query, mockTutorUser);

      // Assert
      expect(result).toEqual(mockPendingReviewsList);
      expect(listPendingReviewsUseCase.execute).toHaveBeenCalledWith({
        requesterId: mockTutorUser.sub,
        page: 1,
        pageSize: 20,
      });
    });

    it('should use default pagination when not provided', async () => {
      // Arrange
      listPendingReviewsUseCase.execute.mockResolvedValue(
        right(mockPendingReviewsList),
      );

      const query: ListPendingReviewsQueryDto = {};

      // Act
      const result = await controller.listPendingReviews(query, mockTutorUser);

      // Assert
      expect(result).toEqual(mockPendingReviewsList);
      expect(listPendingReviewsUseCase.execute).toHaveBeenCalledWith({
        requesterId: mockTutorUser.sub,
        page: undefined,
        pageSize: undefined,
      });
    });

    it('should throw BadRequestException for invalid input error', async () => {
      // Arrange
      const invalidInputError = new InvalidInputError('Invalid input data');
      listPendingReviewsUseCase.execute.mockResolvedValue(
        left(invalidInputError),
      );

      const query: ListPendingReviewsQueryDto = {};

      // Act & Assert
      await expect(
        controller.listPendingReviews(query, mockTutorUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for user not found error', async () => {
      // Arrange
      const userNotFoundError = new UserNotFoundError();
      listPendingReviewsUseCase.execute.mockResolvedValue(
        left(userNotFoundError),
      );

      const query: ListPendingReviewsQueryDto = {};

      // Act & Assert
      await expect(
        controller.listPendingReviews(query, mockTutorUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for insufficient permissions error', async () => {
      // Arrange
      const insufficientPermissionsError = new InsufficientPermissionsError();
      listPendingReviewsUseCase.execute.mockResolvedValue(
        left(insufficientPermissionsError),
      );

      const query: ListPendingReviewsQueryDto = {};

      // Act & Assert
      await expect(
        controller.listPendingReviews(query, mockTutorUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw InternalServerErrorException for repository error', async () => {
      // Arrange
      const repositoryError = new RepositoryError('Database error');
      listPendingReviewsUseCase.execute.mockResolvedValue(
        left(repositoryError),
      );

      const query: ListPendingReviewsQueryDto = {};

      // Act & Assert
      await expect(
        controller.listPendingReviews(query, mockTutorUser),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
