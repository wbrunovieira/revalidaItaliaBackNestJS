// src/domain/assessment/application/use-cases/start-attempt.use-case.spec.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StartAttemptUseCase } from './start-attempt.use-case';
import { InMemoryAttemptRepository } from '@/test/repositories/in-memory-attempt-repository';
import { InMemoryAssessmentRepository } from '@/test/repositories/in-memory-assessment-repository';
import { InMemoryUserAggregatedViewRepository } from '@/test/repositories/in-memory-user-aggregated-view-repository';
import { Assessment } from '@/domain/assessment/enterprise/entities/assessment.entity';
import { Attempt } from '@/domain/assessment/enterprise/entities/attempt.entity';
import { AttemptStatusVO } from '@/domain/assessment/enterprise/value-objects/attempt-status.vo';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { StartAttemptRequest } from '../dtos/start-attempt-request.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { UserNotFoundError } from './errors/user-not-found-error';
import { AssessmentNotFoundError } from './errors/assessment-not-found-error';
import { RepositoryError } from './errors/repository-error';
import { UserAggregatedView } from '@/domain/auth/application/repositories/i-user-aggregated-view-repository';
import { left, right } from '@/core/either';

let sut: StartAttemptUseCase;
let attemptRepository: InMemoryAttemptRepository;
let assessmentRepository: InMemoryAssessmentRepository;
let userAggregatedViewRepository: InMemoryUserAggregatedViewRepository;

// Helper function to create test users
function createTestUser(
  overrides: Partial<UserAggregatedView> = {},
): UserAggregatedView {
  const now = new Date();
  return {
    identityId: '550e8400-e29b-41d4-a716-446655440001',
    email: 'test@example.com',
    emailVerified: true,
    lastLogin: now,
    lockedUntil: null,
    profileId: '550e8400-e29b-41d4-a716-446655440002',
    fullName: 'Test User',
    nationalId: '123.456.789-00',
    phone: '+39 123 456 7890',
    birthDate: new Date('1990-01-01'),
    profileImageUrl: null,
    bio: null,
    profession: null,
    specialization: null,
    preferredLanguage: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    authorizationId: '550e8400-e29b-41d4-a716-446655440003',
    role: 'student',
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('StartAttemptUseCase', () => {
  beforeEach(() => {
    attemptRepository = new InMemoryAttemptRepository();
    assessmentRepository = new InMemoryAssessmentRepository();
    userAggregatedViewRepository = new InMemoryUserAggregatedViewRepository();

    sut = new StartAttemptUseCase(
      attemptRepository,
      assessmentRepository,
      userAggregatedViewRepository,
    );
  });

  // Success Cases
  describe('Success Cases', () => {
    it('should start attempt for QUIZ assessment', async () => {
      // Arrange
      const identityId = '12345678-1234-1234-1234-123456789012';
      const assessmentId = new UniqueEntityID(
        '12345678-1234-1234-1234-123456789013',
      );

      const user = createTestUser({
        identityId,
        fullName: 'Test User',
        email: 'test@example.com',
        role: 'student',
      });

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

      await userAggregatedViewRepository.create(user);
      await assessmentRepository.create(assessment);

      const request: StartAttemptRequest = {
        identityId: identityId,
        assessmentId: assessmentId.toString(),
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attempt.id).toBeDefined();
        expect(result.value.attempt.status).toBe('IN_PROGRESS');
        expect(result.value.attempt.identityId).toBe(identityId);
        expect(result.value.attempt.assessmentId).toBe(assessmentId.toString());
        expect(result.value.attempt.startedAt).toBeInstanceOf(Date);
        expect(result.value.attempt.timeLimitExpiresAt).toBeUndefined();
        expect(result.value.attempt.createdAt).toBeInstanceOf(Date);
        expect(result.value.attempt.updatedAt).toBeInstanceOf(Date);
        expect(result.value.isNew).toBe(true);
      }
    });

    it('should start attempt for SIMULADO assessment with time limit', async () => {
      // Arrange
      const identityId = '12345678-1234-1234-1234-123456789012';
      const assessmentId = new UniqueEntityID(
        '12345678-1234-1234-1234-123456789013',
      );

      const user = createTestUser({ identityId });

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

      await userAggregatedViewRepository.create(user);
      await assessmentRepository.create(assessment);

      const request: StartAttemptRequest = {
        identityId,
        assessmentId: assessmentId.toString(),
      };

      const startTime = new Date();

      // Act
      const result = await sut.execute(request);

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
      const identityId = '12345678-1234-1234-1234-123456789012';
      const assessmentId = new UniqueEntityID(
        '12345678-1234-1234-1234-123456789013',
      );

      const user = createTestUser({ identityId });

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

      await userAggregatedViewRepository.create(user);
      await assessmentRepository.create(assessment);

      const request: StartAttemptRequest = {
        identityId,
        assessmentId: assessmentId.toString(),
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attempt.status).toBe('IN_PROGRESS');
        expect(result.value.attempt.timeLimitExpiresAt).toBeUndefined();
      }
    });

    it('should return existing active attempt instead of creating new one', async () => {
      // Arrange
      const identityId = '12345678-1234-1234-1234-123456789012';
      const assessmentId = new UniqueEntityID(
        '12345678-1234-1234-1234-123456789013',
      );

      const user = createTestUser({ identityId });
      const assessment = Assessment.create(
        {
          slug: 'quiz-test',
          title: 'Quiz Test',
          type: 'QUIZ',
        },
        assessmentId,
      );

      const existingAttempt = Attempt.create({
        status: new AttemptStatusVO('IN_PROGRESS'),
        startedAt: new Date(),
        identityId,
        assessmentId: assessmentId.toString(),
      });

      await userAggregatedViewRepository.create(user);
      await assessmentRepository.create(assessment);
      await attemptRepository.create(existingAttempt);

      const request: StartAttemptRequest = {
        identityId,
        assessmentId: assessmentId.toString(),
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attempt.id).toBe(existingAttempt.id.toString());
        expect(result.value.isNew).toBe(false);
        expect(result.value.attempt.status).toBe('IN_PROGRESS');
      }
    });

    it('should allow different users to start attempts on same assessment', async () => {
      // Arrange
      const user1Id = '12345678-1234-1234-1234-123456789011';
      const user2Id = '12345678-1234-1234-1234-123456789012';
      const assessmentId = new UniqueEntityID(
        '12345678-1234-1234-1234-123456789013',
      );

      const user1 = createTestUser({ identityId: user1Id });
      const user2 = createTestUser({ identityId: user2Id });

      const assessment = Assessment.create(
        {
          slug: 'quiz-test',
          title: 'Quiz Test',
          type: 'QUIZ',
        },
        assessmentId,
      );

      await userAggregatedViewRepository.create(user1);
      await userAggregatedViewRepository.create(user2);
      await assessmentRepository.create(assessment);

      // Act
      const result1 = await sut.execute({
        identityId: user1Id,
        assessmentId: assessmentId.toString(),
      });

      const result2 = await sut.execute({
        identityId: user2Id,
        assessmentId: assessmentId.toString(),
      });

      // Assert
      expect(result1.isRight()).toBe(true);
      expect(result2.isRight()).toBe(true);
      if (result1.isRight() && result2.isRight()) {
        expect(result1.value.attempt.identityId).toBe(user1Id);
        expect(result2.value.attempt.identityId).toBe(user2Id);
        expect(result1.value.attempt.id).not.toBe(result2.value.attempt.id);
      }
    });
  });

  // Validation Errors
  describe('Validation Errors', () => {
    it('should return InvalidInputError for empty identityId', async () => {
      // Arrange
      const request: StartAttemptRequest = {
        identityId: '',
        assessmentId: '12345678-1234-1234-1234-123456789012',
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect(result.value.message).toContain('Identity ID cannot be empty');
      }
    });

    it('should return InvalidInputError for invalid UUID in identityId', async () => {
      // Arrange
      const request: StartAttemptRequest = {
        identityId: 'invalid-uuid',
        assessmentId: '12345678-1234-1234-1234-123456789012',
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect(result.value.message).toContain(
          'Identity ID must be a valid UUID',
        );
      }
    });

    it('should return InvalidInputError for empty assessmentId', async () => {
      // Arrange
      const request: StartAttemptRequest = {
        identityId: '12345678-1234-1234-1234-123456789012',
        assessmentId: '',
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect(result.value.message).toContain('Assessment ID cannot be empty');
      }
    });

    it('should return InvalidInputError for invalid UUID in assessmentId', async () => {
      // Arrange
      const request: StartAttemptRequest = {
        identityId: '12345678-1234-1234-1234-123456789012',
        assessmentId: 'invalid-uuid',
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect(result.value.message).toContain(
          'Assessment ID must be a valid UUID',
        );
      }
    });

    it('should return InvalidInputError for malformed request', async () => {
      // Arrange
      const request = {
        userId: '12345678-1234-1234-1234-123456789012', // wrong field name
        assessmentId: '12345678-1234-1234-1234-123456789013',
      } as any;

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });
  });

  // Business Rule Errors
  describe('Business Rule Errors', () => {
    it('should return UserNotFoundError when user does not exist', async () => {
      // Arrange
      const assessment = Assessment.create({
        slug: 'test',
        title: 'Test',
        type: 'QUIZ',
      });
      await assessmentRepository.create(assessment);

      const request: StartAttemptRequest = {
        identityId: '12345678-1234-1234-1234-123456789012',
        assessmentId: assessment.id.toString(),
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(UserNotFoundError);
      }
    });

    it('should return AssessmentNotFoundError when assessment does not exist', async () => {
      // Arrange
      const identityId = '12345678-1234-1234-1234-123456789012';
      const user = createTestUser({ identityId });
      await userAggregatedViewRepository.create(user);

      const request: StartAttemptRequest = {
        identityId,
        assessmentId: '12345678-1234-1234-1234-123456789013',
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(AssessmentNotFoundError);
      }
    });
  });

  // Repository Errors
  describe('Repository Errors', () => {
    it('should return RepositoryError when user repository fails', async () => {
      // Arrange
      const error = new Error('Database error');
      vi.spyOn(
        userAggregatedViewRepository,
        'findByIdentityId',
      ).mockResolvedValueOnce(left(error));

      const request: StartAttemptRequest = {
        identityId: '12345678-1234-1234-1234-123456789012',
        assessmentId: '12345678-1234-1234-1234-123456789013',
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe('Failed to fetch user');
      }
    });

    it('should return RepositoryError when assessment repository fails', async () => {
      // Arrange
      const identityId = '12345678-1234-1234-1234-123456789012';
      const user = createTestUser({ identityId });
      await userAggregatedViewRepository.create(user);

      const error = new Error('Database error');
      vi.spyOn(assessmentRepository, 'findById').mockResolvedValueOnce(
        left(error),
      );

      const request: StartAttemptRequest = {
        identityId,
        assessmentId: '12345678-1234-1234-1234-123456789013',
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe('Failed to fetch assessment');
      }
    });

    it('should return RepositoryError when attempt creation fails', async () => {
      // Arrange
      const identityId = '12345678-1234-1234-1234-123456789012';
      const assessmentId = new UniqueEntityID(
        '12345678-1234-1234-1234-123456789013',
      );

      const user = createTestUser({ identityId });
      const assessment = Assessment.create(
        {
          slug: 'quiz-test',
          title: 'Quiz Test',
          type: 'QUIZ',
        },
        assessmentId,
      );

      await userAggregatedViewRepository.create(user);
      await assessmentRepository.create(assessment);

      const error = new Error('Database error');
      vi.spyOn(attemptRepository, 'create').mockResolvedValueOnce(left(error));

      const request: StartAttemptRequest = {
        identityId,
        assessmentId: assessmentId.toString(),
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe('Failed to create attempt');
      }
    });

    it('should handle unexpected errors gracefully', async () => {
      // Arrange
      const user = createTestUser();
      await userAggregatedViewRepository.create(user);

      vi.spyOn(assessmentRepository, 'findById').mockRejectedValueOnce(
        new Error('Unexpected error'),
      );

      const request: StartAttemptRequest = {
        identityId: user.identityId,
        assessmentId: '12345678-1234-1234-1234-123456789013',
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(RepositoryError);
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('should handle SIMULADO without time limit', async () => {
      // Arrange
      const identityId = '12345678-1234-1234-1234-123456789012';
      const assessmentId = new UniqueEntityID(
        '12345678-1234-1234-1234-123456789013',
      );

      const user = createTestUser({ identityId });
      const assessment = Assessment.create(
        {
          slug: 'simulado-test',
          title: 'Simulado Test',
          type: 'SIMULADO',
          passingScore: 70,
          // No timeLimitInMinutes
        },
        assessmentId,
      );

      await userAggregatedViewRepository.create(user);
      await assessmentRepository.create(assessment);

      const request: StartAttemptRequest = {
        identityId,
        assessmentId: assessmentId.toString(),
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attempt.status).toBe('IN_PROGRESS');
        expect(result.value.attempt.timeLimitExpiresAt).toBeUndefined();
      }
    });

    it('should allow starting new attempt after previous was submitted', async () => {
      // Arrange
      const identityId = '12345678-1234-1234-1234-123456789012';
      const assessmentId = new UniqueEntityID(
        '12345678-1234-1234-1234-123456789013',
      );

      const user = createTestUser({ identityId });
      const assessment = Assessment.create(
        {
          slug: 'quiz-test',
          title: 'Quiz Test',
          type: 'QUIZ',
        },
        assessmentId,
      );

      // Create a submitted attempt (not IN_PROGRESS)
      const previousAttempt = Attempt.create({
        status: new AttemptStatusVO('SUBMITTED'),
        startedAt: new Date(),
        submittedAt: new Date(),
        identityId,
        assessmentId: assessmentId.toString(),
      });

      await userAggregatedViewRepository.create(user);
      await assessmentRepository.create(assessment);
      await attemptRepository.create(previousAttempt);

      const request: StartAttemptRequest = {
        identityId,
        assessmentId: assessmentId.toString(),
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attempt.status).toBe('IN_PROGRESS');
        expect(result.value.attempt.id).not.toBe(previousAttempt.id.toString());
        expect(result.value.isNew).toBe(true);
      }
    });

    it('should handle null values in user aggregated view', async () => {
      // Arrange
      const identityId = '12345678-1234-1234-1234-123456789012';
      const user = createTestUser({
        identityId,
        phone: null,
        birthDate: null,
        profileImageUrl: null,
        bio: null,
        profession: null,
        specialization: null,
        lastLogin: null,
        lockedUntil: null,
      });

      const assessment = Assessment.create({
        slug: 'test',
        title: 'Test',
        type: 'QUIZ',
      });

      await userAggregatedViewRepository.create(user);
      await assessmentRepository.create(assessment);

      const request: StartAttemptRequest = {
        identityId,
        assessmentId: assessment.id.toString(),
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
    });

    it('should handle very long time limits correctly', async () => {
      // Arrange
      const identityId = '12345678-1234-1234-1234-123456789012';
      const user = createTestUser({ identityId });

      const assessment = Assessment.create({
        slug: 'simulado-test',
        title: 'Simulado Test',
        type: 'SIMULADO',
        timeLimitInMinutes: 999, // Very long time limit
      });

      await userAggregatedViewRepository.create(user);
      await assessmentRepository.create(assessment);

      const request: StartAttemptRequest = {
        identityId,
        assessmentId: assessment.id.toString(),
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const expiresAt = result.value.attempt.timeLimitExpiresAt;
        expect(expiresAt).toBeDefined();
        if (expiresAt) {
          const now = new Date();
          const diffInHours =
            (new Date(expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60);
          expect(diffInHours).toBeCloseTo(16.65, 1); // 999 minutes = 16.65 hours
        }
      }
    });
  });

  // Performance Tests
  describe('Performance Tests', () => {
    it('should handle multiple concurrent attempt starts efficiently', async () => {
      // Arrange
      const assessment = Assessment.create({
        slug: 'quiz-test',
        title: 'Quiz Test',
        type: 'QUIZ',
      });
      await assessmentRepository.create(assessment);

      // Create 10 users
      const users: UserAggregatedView[] = [];
      for (let i = 0; i < 10; i++) {
        const user = createTestUser({
          identityId: `12345678-1234-1234-1234-12345678901${i}`,
          email: `user${i}@example.com`,
        });
        users.push(user);
        await userAggregatedViewRepository.create(user);
      }

      const start = Date.now();

      // Act - Start attempts concurrently
      const promises = users.map((user) =>
        sut.execute({
          identityId: user.identityId,
          assessmentId: assessment.id.toString(),
        }),
      );

      const results = await Promise.all(promises);
      const duration = Date.now() - start;

      // Assert
      results.forEach((result) => {
        expect(result.isRight()).toBe(true);
      });
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  // Business Rules
  describe('Business Rules', () => {
    it('should only apply time limit for SIMULADO type', async () => {
      // Arrange
      const identityId = '12345678-1234-1234-1234-123456789012';
      const user = createTestUser({ identityId });

      const quizAssessment = Assessment.create({
        slug: 'quiz',
        title: 'Quiz',
        type: 'QUIZ',
        timeLimitInMinutes: 60, // Time limit on QUIZ should be ignored
      });

      const provaAssessment = Assessment.create({
        slug: 'prova',
        title: 'Prova',
        type: 'PROVA_ABERTA',
        timeLimitInMinutes: 60, // Time limit on PROVA_ABERTA should be ignored
      });

      await userAggregatedViewRepository.create(user);
      await assessmentRepository.create(quizAssessment);
      await assessmentRepository.create(provaAssessment);

      // Act
      const quizResult = await sut.execute({
        identityId,
        assessmentId: quizAssessment.id.toString(),
      });

      const provaResult = await sut.execute({
        identityId,
        assessmentId: provaAssessment.id.toString(),
      });

      // Assert
      expect(quizResult.isRight()).toBe(true);
      expect(provaResult.isRight()).toBe(true);

      if (quizResult.isRight()) {
        expect(quizResult.value.attempt.timeLimitExpiresAt).toBeUndefined();
      }

      if (provaResult.isRight()) {
        expect(provaResult.value.attempt.timeLimitExpiresAt).toBeUndefined();
      }
    });

    it('should track attempt metadata correctly', async () => {
      // Arrange
      const identityId = '12345678-1234-1234-1234-123456789012';
      const user = createTestUser({ identityId });
      const assessment = Assessment.create({
        slug: 'test',
        title: 'Test',
        type: 'QUIZ',
      });

      await userAggregatedViewRepository.create(user);
      await assessmentRepository.create(assessment);

      const beforeStart = new Date();

      // Act
      const result = await sut.execute({
        identityId,
        assessmentId: assessment.id.toString(),
      });

      const afterStart = new Date();

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const attempt = result.value.attempt;

        // Check timestamps
        expect(attempt.startedAt.getTime()).toBeGreaterThanOrEqual(
          beforeStart.getTime(),
        );
        expect(attempt.startedAt.getTime()).toBeLessThanOrEqual(
          afterStart.getTime(),
        );
        expect(attempt.createdAt.getTime()).toBeGreaterThanOrEqual(
          beforeStart.getTime(),
        );
        expect(attempt.updatedAt.getTime()).toBeGreaterThanOrEqual(
          beforeStart.getTime(),
        );

        // Check initial state
        expect(attempt.status).toBe('IN_PROGRESS');
        expect(result.value.answeredQuestions).toBe(0);
      }
    });

    it('should handle graded and grading attempts correctly', async () => {
      // Arrange
      const identityId = '12345678-1234-1234-1234-123456789012';
      const assessmentId = new UniqueEntityID();

      const user = createTestUser({ identityId });
      const assessment = Assessment.create(
        {
          slug: 'test',
          title: 'Test',
          type: 'QUIZ',
        },
        assessmentId,
      );

      // Create attempts with different statuses
      const gradedAttempt = Attempt.create({
        status: new AttemptStatusVO('GRADED'),
        startedAt: new Date(),
        submittedAt: new Date(),
        gradedAt: new Date(),
        identityId,
        assessmentId: assessmentId.toString(),
      });

      await userAggregatedViewRepository.create(user);
      await assessmentRepository.create(assessment);
      await attemptRepository.create(gradedAttempt);

      // Act
      const result = await sut.execute({
        identityId,
        assessmentId: assessmentId.toString(),
      });

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        // Should create a new attempt since the previous one is completed
        expect(result.value.attempt.id).not.toBe(gradedAttempt.id.toString());
        expect(result.value.isNew).toBe(true);
      }
    });
  });
});
