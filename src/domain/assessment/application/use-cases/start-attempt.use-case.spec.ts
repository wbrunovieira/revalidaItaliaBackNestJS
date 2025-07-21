// src/domain/assessment/application/use-cases/start-attempt.use-case.spec.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StartAttemptUseCase } from './start-attempt.use-case';
import { InMemoryAttemptRepository } from '@/test/repositories/in-memory-attempt-repository';
import { InMemoryAssessmentRepository } from '@/test/repositories/in-memory-assessment-repository';
import { InMemoryAccountRepository } from '@/test/repositories/in-memory-account-repository';
import { IAttemptRepository } from '../repositories/i-attempt.repository';
import { IAssessmentRepository } from '../repositories/i-assessment-repository';
import { IUserAggregatedViewRepository } from '@/domain/auth/application/repositories/i-user-aggregated-view-repository';
import { Assessment } from '@/domain/assessment/enterprise/entities/assessment.entity';
import { Attempt } from '@/domain/assessment/enterprise/entities/attempt.entity';
// TODO: Update tests to use new separated entities (UserIdentity, UserProfile, UserAuthorization)
// import { User } from '@/domain/auth/enterprise/entities/user.entity';
import { AttemptStatusVO } from '@/domain/assessment/enterprise/value-objects/attempt-status.vo';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { StartAttemptRequest } from '../dtos/start-attempt-request.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { UserNotFoundError } from './errors/user-not-found-error';
import { AssessmentNotFoundError } from './errors/assessment-not-found-error';
import { AttemptAlreadyActiveError } from './errors/attempt-already-active-error';
import { RepositoryError } from './errors/repository-error';

let useCase: StartAttemptUseCase;
let attemptRepository: InMemoryAttemptRepository;
let assessmentRepository: InMemoryAssessmentRepository;
let accountRepository: InMemoryAccountRepository;

describe('StartAttemptUseCase', () => {
  beforeEach(() => {
    attemptRepository = new InMemoryAttemptRepository();
    assessmentRepository = new InMemoryAssessmentRepository();
    accountRepository = new InMemoryAccountRepository();
    useCase = new StartAttemptUseCase(
      attemptRepository,
      assessmentRepository,
      accountRepository,
    );
  });

  describe('Success Cases', () => {
    it('should start attempt for QUIZ assessment', async () => {
      // Arrange
      const userId = new UniqueEntityID('12345678-1234-1234-1234-123456789012');
      const assessmentId = new UniqueEntityID(
        '12345678-1234-1234-1234-123456789013',
      );

      const user = User.create(
        {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          cpf: '12345678901',
          role: 'student',
        },
        userId,
      );

      const assessment = Assessment.create(
        {
          slug: 'quiz-test',
          title: 'Quiz Test',
          type: 'QUIZ',
          quizPosition: 'BEFORE_LESSON',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
        },
        assessmentId,
      );

      await accountRepository.create(user);
      await assessmentRepository.create(assessment);

      const request: StartAttemptRequest = {
        userId: userId.toString(),
        assessmentId: assessmentId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attempt.id).toBeDefined();
        expect(result.value.attempt.status).toBe('IN_PROGRESS');
        expect(result.value.attempt.userId).toBe(userId.toString());
        expect(result.value.attempt.assessmentId).toBe(assessmentId.toString());
        expect(result.value.attempt.startedAt).toBeInstanceOf(Date);
        expect(result.value.attempt.timeLimitExpiresAt).toBeUndefined();
        expect(result.value.attempt.createdAt).toBeInstanceOf(Date);
        expect(result.value.attempt.updatedAt).toBeInstanceOf(Date);
      }
    });

    it('should start attempt for SIMULADO assessment with time limit', async () => {
      // Arrange
      const userId = new UniqueEntityID('12345678-1234-1234-1234-123456789012');
      const assessmentId = new UniqueEntityID(
        '12345678-1234-1234-1234-123456789013',
      );

      const user = User.create(
        {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          cpf: '12345678901',
          role: 'student',
        },
        userId,
      );

      const assessment = Assessment.create(
        {
          slug: 'simulado-test',
          title: 'Simulado Test',
          type: 'SIMULADO',
          passingScore: 70,
          timeLimitInMinutes: 120,
          randomizeQuestions: false,
          randomizeOptions: false,
        },
        assessmentId,
      );

      await accountRepository.create(user);
      await assessmentRepository.create(assessment);

      const request: StartAttemptRequest = {
        userId: userId.toString(),
        assessmentId: assessmentId.toString(),
      };

      const startTime = new Date();

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attempt.status).toBe('IN_PROGRESS');
        expect(result.value.attempt.timeLimitExpiresAt).toBeDefined();

        // Check that time limit is approximately 120 minutes from start time
        const expectedExpiresAt = new Date(
          startTime.getTime() + 120 * 60 * 1000,
        );
        const actualExpiresAt = new Date(
          result.value.attempt.timeLimitExpiresAt!,
        );
        const timeDiff = Math.abs(
          actualExpiresAt.getTime() - expectedExpiresAt.getTime(),
        );
        expect(timeDiff).toBeLessThan(5000); // Allow 5 seconds difference
      }
    });

    it('should start attempt for PROVA_ABERTA assessment', async () => {
      // Arrange
      const userId = new UniqueEntityID('12345678-1234-1234-1234-123456789012');
      const assessmentId = new UniqueEntityID(
        '12345678-1234-1234-1234-123456789013',
      );

      const user = User.create(
        {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          cpf: '12345678901',
          role: 'student',
        },
        userId,
      );

      const assessment = Assessment.create(
        {
          slug: 'prova-aberta-test',
          title: 'Prova Aberta Test',
          type: 'PROVA_ABERTA',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
        },
        assessmentId,
      );

      await accountRepository.create(user);
      await assessmentRepository.create(assessment);

      const request: StartAttemptRequest = {
        userId: userId.toString(),
        assessmentId: assessmentId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attempt.status).toBe('IN_PROGRESS');
        expect(result.value.attempt.timeLimitExpiresAt).toBeUndefined();
      }
    });
  });

  describe('Validation Errors', () => {
    it('should return InvalidInputError for empty userId', async () => {
      // Arrange
      const request: StartAttemptRequest = {
        userId: '',
        assessmentId: '12345678-1234-1234-1234-123456789012',
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should return InvalidInputError for invalid UUID in userId', async () => {
      // Arrange
      const request: StartAttemptRequest = {
        userId: 'invalid-uuid',
        assessmentId: '12345678-1234-1234-1234-123456789012',
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should return InvalidInputError for empty assessmentId', async () => {
      // Arrange
      const request: StartAttemptRequest = {
        userId: '12345678-1234-1234-1234-123456789012',
        assessmentId: '',
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should return InvalidInputError for invalid UUID in assessmentId', async () => {
      // Arrange
      const request: StartAttemptRequest = {
        userId: '12345678-1234-1234-1234-123456789012',
        assessmentId: 'invalid-uuid',
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });
  });

  describe('Business Rule Validation Errors', () => {
    it('should return UserNotFoundError when user does not exist', async () => {
      // Arrange
      const request: StartAttemptRequest = {
        userId: '12345678-1234-1234-1234-123456789012',
        assessmentId: '12345678-1234-1234-1234-123456789013',
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(UserNotFoundError);
      }
    });

    it('should return AssessmentNotFoundError when assessment does not exist', async () => {
      // Arrange
      const userId = new UniqueEntityID('12345678-1234-1234-1234-123456789012');

      const user = User.create(
        {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          cpf: '12345678901',
          role: 'student',
        },
        userId,
      );

      await accountRepository.create(user);

      const request: StartAttemptRequest = {
        userId: userId.toString(),
        assessmentId: '12345678-1234-1234-1234-123456789013',
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(AssessmentNotFoundError);
      }
    });

    it('should return AttemptAlreadyActiveError when user has active attempt', async () => {
      // Arrange
      const userId = new UniqueEntityID('12345678-1234-1234-1234-123456789012');
      const assessmentId = new UniqueEntityID(
        '12345678-1234-1234-1234-123456789013',
      );

      const user = User.create(
        {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          cpf: '12345678901',
          role: 'student',
        },
        userId,
      );

      const assessment = Assessment.create(
        {
          slug: 'quiz-test',
          title: 'Quiz Test',
          type: 'QUIZ',
          quizPosition: 'BEFORE_LESSON',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
        },
        assessmentId,
      );

      const existingAttempt = Attempt.create({
        status: new AttemptStatusVO('IN_PROGRESS'),
        startedAt: new Date(),
        userId: userId.toString(),
        assessmentId: assessmentId.toString(),
      });

      await accountRepository.create(user);
      await assessmentRepository.create(assessment);
      await attemptRepository.create(existingAttempt);

      const request: StartAttemptRequest = {
        userId: userId.toString(),
        assessmentId: assessmentId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attempt.id).toBe(existingAttempt.id.toString());
        expect(result.value.isNew).toBe(false);
        expect(result.value.attempt.status).toBe('IN_PROGRESS');
      }
    });
  });

  describe('Repository Errors', () => {
    it('should return RepositoryError when user repository fails', async () => {
      // Arrange
      const mockAccountRepository = {
        findById: vi.fn().mockResolvedValue({
          isLeft: () => true,
          isRight: () => false,
          value: new Error('Database error'),
        }),
      } as Partial<IUserAggregatedViewRepository>;

      const useCase = new StartAttemptUseCase(
        attemptRepository,
        assessmentRepository,
        mockAccountRepository as IUserAggregatedViewRepository,
      );

      const request: StartAttemptRequest = {
        userId: '12345678-1234-1234-1234-123456789012',
        assessmentId: '12345678-1234-1234-1234-123456789013',
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe('Failed to fetch user');
      }
    });

    it('should return RepositoryError when assessment repository fails', async () => {
      // Arrange
      const userId = new UniqueEntityID('12345678-1234-1234-1234-123456789012');

      const user = User.create(
        {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          cpf: '12345678901',
          role: 'student',
        },
        userId,
      );

      await accountRepository.create(user);

      const mockAssessmentRepository = {
        findById: vi.fn().mockResolvedValue({
          isLeft: () => true,
          isRight: () => false,
          value: new Error('Database error'),
        }),
      } as Partial<IAssessmentRepository>;

      const useCase = new StartAttemptUseCase(
        attemptRepository,
        mockAssessmentRepository as IAssessmentRepository,
        accountRepository,
      );

      const request: StartAttemptRequest = {
        userId: userId.toString(),
        assessmentId: '12345678-1234-1234-1234-123456789013',
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe('Failed to fetch assessment');
      }
    });

    it('should return RepositoryError when attempt creation fails', async () => {
      // Arrange
      const userId = new UniqueEntityID('12345678-1234-1234-1234-123456789012');
      const assessmentId = new UniqueEntityID(
        '12345678-1234-1234-1234-123456789013',
      );

      const user = User.create(
        {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          cpf: '12345678901',
          role: 'student',
        },
        userId,
      );

      const assessment = Assessment.create(
        {
          slug: 'quiz-test',
          title: 'Quiz Test',
          type: 'QUIZ',
          quizPosition: 'BEFORE_LESSON',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
        },
        assessmentId,
      );

      await accountRepository.create(user);
      await assessmentRepository.create(assessment);

      const mockAttemptRepository = {
        findActiveByUserAndAssessment: vi.fn().mockResolvedValue({
          isLeft: () => true,
          isRight: () => false,
          value: new Error('Active attempt not found'),
        }),
        create: vi.fn().mockResolvedValue({
          isLeft: () => true,
          isRight: () => false,
          value: new Error('Database error'),
        }),
      } as Partial<IAttemptRepository>;

      const useCase = new StartAttemptUseCase(
        mockAttemptRepository as IAttemptRepository,
        assessmentRepository,
        accountRepository,
      );

      const request: StartAttemptRequest = {
        userId: userId.toString(),
        assessmentId: assessmentId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe('Failed to create attempt');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle SIMULADO without time limit', async () => {
      // Arrange
      const userId = new UniqueEntityID('12345678-1234-1234-1234-123456789012');
      const assessmentId = new UniqueEntityID(
        '12345678-1234-1234-1234-123456789013',
      );

      const user = User.create(
        {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          cpf: '12345678901',
          role: 'student',
        },
        userId,
      );

      const assessment = Assessment.create(
        {
          slug: 'simulado-test',
          title: 'Simulado Test',
          type: 'SIMULADO',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
        },
        assessmentId,
      );

      await accountRepository.create(user);
      await assessmentRepository.create(assessment);

      const request: StartAttemptRequest = {
        userId: userId.toString(),
        assessmentId: assessmentId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attempt.status).toBe('IN_PROGRESS');
        expect(result.value.attempt.timeLimitExpiresAt).toBeUndefined();
      }
    });

    it('should allow starting new attempt after previous was submitted', async () => {
      // Arrange
      const userId = new UniqueEntityID('12345678-1234-1234-1234-123456789012');
      const assessmentId = new UniqueEntityID(
        '12345678-1234-1234-1234-123456789013',
      );

      const user = User.create(
        {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          cpf: '12345678901',
          role: 'student',
        },
        userId,
      );

      const assessment = Assessment.create(
        {
          slug: 'quiz-test',
          title: 'Quiz Test',
          type: 'QUIZ',
          quizPosition: 'BEFORE_LESSON',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
        },
        assessmentId,
      );

      // Create a submitted attempt (not IN_PROGRESS)
      const previousAttempt = Attempt.create({
        status: new AttemptStatusVO('SUBMITTED'),
        startedAt: new Date(),
        userId: userId.toString(),
        assessmentId: assessmentId.toString(),
      });

      await accountRepository.create(user);
      await assessmentRepository.create(assessment);
      await attemptRepository.create(previousAttempt);

      const request: StartAttemptRequest = {
        userId: userId.toString(),
        assessmentId: assessmentId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attempt.status).toBe('IN_PROGRESS');
        // Should be a different attempt ID
        expect(result.value.attempt.id).not.toBe(previousAttempt.id.toString());
      }
    });
  });
});
