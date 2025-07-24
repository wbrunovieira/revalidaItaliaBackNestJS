// src/domain/assessment/application/use-cases/list-attempts.use-case.spec.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ListAttemptsUseCase } from './list-attempts.use-case';
import { InMemoryAttemptRepository } from '@/test/repositories/in-memory-attempt-repository';
import { InMemoryAssessmentRepository } from '@/test/repositories/in-memory-assessment-repository';
import { InMemoryUserAggregatedViewRepository } from '@/test/repositories/in-memory-user-aggregated-view-repository';
import { Attempt } from '@/domain/assessment/enterprise/entities/attempt.entity';
import { Assessment } from '@/domain/assessment/enterprise/entities/assessment.entity';
import { AttemptStatusVO } from '@/domain/assessment/enterprise/value-objects/attempt-status.vo';
import { ScoreVO } from '@/domain/assessment/enterprise/value-objects/score.vo';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { ListAttemptsRequest } from '../dtos/list-attempts-request.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { UserNotFoundError } from './errors/user-not-found-error';
import { InsufficientPermissionsError } from './errors/insufficient-permissions-error';
import { UserAggregatedView } from '@/domain/auth/application/repositories/i-user-aggregated-view-repository';
import { left, right } from '@/core/either';

let sut: ListAttemptsUseCase;
let attemptRepository: InMemoryAttemptRepository;
let assessmentRepository: InMemoryAssessmentRepository;
let userAggregatedViewRepository: InMemoryUserAggregatedViewRepository;

// Helper function to create test users
function createTestUser(overrides: Partial<UserAggregatedView> = {}): UserAggregatedView {
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

describe('ListAttemptsUseCase', () => {
  beforeEach(() => {
    attemptRepository = new InMemoryAttemptRepository();
    assessmentRepository = new InMemoryAssessmentRepository();
    userAggregatedViewRepository = new InMemoryUserAggregatedViewRepository();

    sut = new ListAttemptsUseCase(
      attemptRepository,
      assessmentRepository,
      userAggregatedViewRepository,
    );
  });

  // Success Cases
  describe('Success Cases', () => {
    it('should list attempts successfully for admin user', async () => {
      // Arrange
      const adminUser = createTestUser({
        identityId: '550e8400-e29b-41d4-a716-446655440010',
        fullName: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
      });

      const studentUser = createTestUser({
        identityId: '550e8400-e29b-41d4-a716-446655440020',
        fullName: 'Student User',
        email: 'student@example.com',
        role: 'student',
      });

      const assessment = Assessment.create({
        slug: 'test-assessment',
        title: 'Test Assessment',
        type: 'QUIZ',
        passingScore: 70,
        timeLimitInMinutes: 60,
      }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440030'));

      const attempt = Attempt.create({
        status: new AttemptStatusVO('SUBMITTED'),
        score: new ScoreVO(85),
        startedAt: new Date('2024-01-01T10:00:00Z'),
        submittedAt: new Date('2024-01-01T11:00:00Z'),
        identityId: '550e8400-e29b-41d4-a716-446655440020',
        assessmentId: '550e8400-e29b-41d4-a716-446655440030',
      }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440040'));

      await userAggregatedViewRepository.create(adminUser);
      await userAggregatedViewRepository.create(studentUser);
      await assessmentRepository.create(assessment);
      await attemptRepository.create(attempt);

      const request: ListAttemptsRequest = {
        requesterId: '550e8400-e29b-41d4-a716-446655440010',
        page: 1,
        pageSize: 20,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const response = result.value;
        expect(response.attempts).toHaveLength(1);
        expect(response.attempts[0].id).toBe('550e8400-e29b-41d4-a716-446655440040');
        expect(response.attempts[0].status).toBe('SUBMITTED');
        expect(response.attempts[0].score).toBe(85);
        expect(response.attempts[0].assessment.title).toBe('Test Assessment');
        expect(response.attempts[0].student?.name).toBe('Student User');
        expect(response.pagination.page).toBe(1);
        expect(response.pagination.pageSize).toBe(20);
      }
    });

    it('should list only own attempts for student user', async () => {
      // Arrange
      const studentUser = createTestUser({
        identityId: '550e8400-e29b-41d4-a716-446655440020',
        fullName: 'Student User',
        email: 'student@example.com',
        role: 'student',
      });

      const otherStudentUser = createTestUser({
        identityId: '550e8400-e29b-41d4-a716-446655440021',
        fullName: 'Other Student',
        email: 'other@example.com',
        role: 'student',
      });

      const assessment = Assessment.create({
        slug: 'test-assessment',
        title: 'Test Assessment',
        type: 'QUIZ',
        passingScore: 70,
        timeLimitInMinutes: 60,
      }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440030'));

      const studentAttempt = Attempt.create({
        status: new AttemptStatusVO('SUBMITTED'),
        startedAt: new Date('2024-01-01T10:00:00Z'),
        identityId: '550e8400-e29b-41d4-a716-446655440020',
        assessmentId: '550e8400-e29b-41d4-a716-446655440030',
      }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440041'));

      const otherAttempt = Attempt.create({
        status: new AttemptStatusVO('SUBMITTED'),
        startedAt: new Date('2024-01-01T10:00:00Z'),
        identityId: '550e8400-e29b-41d4-a716-446655440021',
        assessmentId: '550e8400-e29b-41d4-a716-446655440030',
      }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440042'));

      await userAggregatedViewRepository.create(studentUser);
      await userAggregatedViewRepository.create(otherStudentUser);
      await assessmentRepository.create(assessment);
      await attemptRepository.create(studentAttempt);
      await attemptRepository.create(otherAttempt);

      const request: ListAttemptsRequest = {
        requesterId: '550e8400-e29b-41d4-a716-446655440020',
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const response = result.value;
        expect(response.attempts).toHaveLength(1);
        expect(response.attempts[0].id).toBe('550e8400-e29b-41d4-a716-446655440041');
        expect(response.attempts[0].identityId).toBe('550e8400-e29b-41d4-a716-446655440020');
      }
    });

    it('should filter attempts by status', async () => {
      // Arrange
      const adminUser = createTestUser({
        identityId: '550e8400-e29b-41d4-a716-446655440010',
        fullName: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
      });

      const studentUser = createTestUser({
        identityId: '550e8400-e29b-41d4-a716-446655440020',
        fullName: 'Student User',
        email: 'student@example.com',
        role: 'student',
      });

      const assessment = Assessment.create({
        slug: 'test-assessment',
        title: 'Test Assessment',
        type: 'QUIZ',
        passingScore: 70,
        timeLimitInMinutes: 60,
      }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440030'));

      const submittedAttempt = Attempt.create({
        status: new AttemptStatusVO('SUBMITTED'),
        startedAt: new Date('2024-01-01T10:00:00Z'),
        identityId: '550e8400-e29b-41d4-a716-446655440020',
        assessmentId: '550e8400-e29b-41d4-a716-446655440030',
      }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440041'));

      const inProgressAttempt = Attempt.create({
        status: new AttemptStatusVO('IN_PROGRESS'),
        startedAt: new Date('2024-01-01T10:00:00Z'),
        identityId: '550e8400-e29b-41d4-a716-446655440020',
        assessmentId: '550e8400-e29b-41d4-a716-446655440030',
      }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440042'));

      await userAggregatedViewRepository.create(adminUser);
      await userAggregatedViewRepository.create(studentUser);
      await assessmentRepository.create(assessment);
      await attemptRepository.create(submittedAttempt);
      await attemptRepository.create(inProgressAttempt);

      const request: ListAttemptsRequest = {
        requesterId: '550e8400-e29b-41d4-a716-446655440010',
        status: 'SUBMITTED',
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const response = result.value;
        expect(response.attempts).toHaveLength(1);
        expect(response.attempts[0].status).toBe('SUBMITTED');
      }
    });

    it('should allow tutor to view all attempts', async () => {
      // Arrange
      const tutorUser = createTestUser({
        identityId: '550e8400-e29b-41d4-a716-446655440010',
        fullName: 'Tutor User',
        email: 'tutor@example.com',
        role: 'tutor',
      });

      const studentUser = createTestUser({
        identityId: '550e8400-e29b-41d4-a716-446655440020',
        fullName: 'Student User',
        email: 'student@example.com',
        role: 'student',
      });

      const assessment = Assessment.create({
        slug: 'test-assessment',
        title: 'Test Assessment',
        type: 'QUIZ',
      }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440030'));

      const attempt = Attempt.create({
        status: new AttemptStatusVO('GRADED'),
        score: new ScoreVO(90),
        startedAt: new Date(),
        submittedAt: new Date(),
        gradedAt: new Date(),
        identityId: studentUser.identityId,
        assessmentId: assessment.id.toString(),
      });

      await userAggregatedViewRepository.create(tutorUser);
      await userAggregatedViewRepository.create(studentUser);
      await assessmentRepository.create(assessment);
      await attemptRepository.create(attempt);

      const request: ListAttemptsRequest = {
        requesterId: tutorUser.identityId,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attempts).toHaveLength(1);
        expect(result.value.attempts[0].student?.name).toBe('Student User');
      }
    });

    it('should return empty list when no attempts found', async () => {
      // Arrange
      const adminUser = createTestUser({
        identityId: '550e8400-e29b-41d4-a716-446655440010',
        fullName: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
      });

      await userAggregatedViewRepository.create(adminUser);

      const request: ListAttemptsRequest = {
        requesterId: '550e8400-e29b-41d4-a716-446655440010',
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const response = result.value;
        expect(response.attempts).toHaveLength(0);
        expect(response.pagination.total).toBe(0);
      }
    });

    it('should paginate results correctly', async () => {
      // Arrange
      const adminUser = createTestUser({
        identityId: '550e8400-e29b-41d4-a716-446655440010',
        role: 'admin',
      });

      const assessment = Assessment.create({
        slug: 'test-assessment',
        title: 'Test Assessment',
        type: 'QUIZ',
      }, new UniqueEntityID());

      await userAggregatedViewRepository.create(adminUser);
      await assessmentRepository.create(assessment);

      // Create 5 attempts
      for (let i = 0; i < 5; i++) {
        const attempt = Attempt.create({
          status: new AttemptStatusVO('SUBMITTED'),
          startedAt: new Date(),
          identityId: adminUser.identityId,
          assessmentId: assessment.id.toString(),
        });
        await attemptRepository.create(attempt);
      }

      const request: ListAttemptsRequest = {
        requesterId: adminUser.identityId,
        page: 1,
        pageSize: 2,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attempts).toHaveLength(2);
        expect(result.value.pagination.page).toBe(1);
        expect(result.value.pagination.pageSize).toBe(2);
      }
    });
  });

  // Validation Errors
  describe('Validation Errors', () => {
    it('should return InvalidInputError for invalid requester ID', async () => {
      // Arrange
      const request = {
        requesterId: 'invalid-id', // Not a valid UUID
      } as ListAttemptsRequest;

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('should return InvalidInputError for invalid page number', async () => {
      // Arrange
      const request: ListAttemptsRequest = {
        requesterId: '550e8400-e29b-41d4-a716-446655440000',
        page: -1,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('should return InvalidInputError for invalid page size', async () => {
      // Arrange
      const request: ListAttemptsRequest = {
        requesterId: '550e8400-e29b-41d4-a716-446655440000',
        pageSize: 0,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('should return InvalidInputError for invalid status', async () => {
      // Arrange
      const request = {
        requesterId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'INVALID_STATUS',
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
    it('should return UserNotFoundError for non-existent requester', async () => {
      // Arrange
      const request: ListAttemptsRequest = {
        requesterId: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID but non-existent
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(UserNotFoundError);
    });

    it('should return InsufficientPermissionsError when student tries to access other user attempts', async () => {
      // Arrange
      const studentUser = createTestUser({
        identityId: '550e8400-e29b-41d4-a716-446655440020',
        fullName: 'Student User',
        email: 'student@example.com',
        role: 'student',
      });

      await userAggregatedViewRepository.create(studentUser);

      const request: ListAttemptsRequest = {
        requesterId: '550e8400-e29b-41d4-a716-446655440020',
        identityId: '550e8400-e29b-41d4-a716-446655440001', // Trying to access other user's attempts
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InsufficientPermissionsError);
    });
  });

  // Repository Errors
  describe('Repository Errors', () => {
    it('should handle repository error when fetching user', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      vi.spyOn(userAggregatedViewRepository, 'findByIdentityId').mockResolvedValueOnce(left(error));

      const request: ListAttemptsRequest = {
        requesterId: '550e8400-e29b-41d4-a716-446655440000',
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(UserNotFoundError);
    });

    it('should handle repository error when fetching attempts', async () => {
      // Arrange
      const user = createTestUser({ role: 'admin' });
      await userAggregatedViewRepository.create(user);

      const error = new Error('Database error');
      vi.spyOn(attemptRepository, 'findWithFilters').mockResolvedValueOnce(left(error));

      const request: ListAttemptsRequest = {
        requesterId: user.identityId,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value.message).toContain('Failed to fetch attempts');
      }
    });

    it('should handle unexpected errors gracefully', async () => {
      // Arrange
      const user = createTestUser({ role: 'admin' });
      await userAggregatedViewRepository.create(user);

      vi.spyOn(attemptRepository, 'findWithFilters').mockRejectedValueOnce(new Error('Unexpected error'));

      const request: ListAttemptsRequest = {
        requesterId: user.identityId,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value.message).toContain('An unexpected error occurred');
      }
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('should handle attempts with missing assessments gracefully', async () => {
      // Arrange
      const adminUser = createTestUser({ role: 'admin' });
      await userAggregatedViewRepository.create(adminUser);

      const attempt = Attempt.create({
        status: new AttemptStatusVO('SUBMITTED'),
        startedAt: new Date(),
        identityId: adminUser.identityId,
        assessmentId: 'non-existent-assessment',
      });

      await attemptRepository.create(attempt);

      const request: ListAttemptsRequest = {
        requesterId: adminUser.identityId,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attempts).toHaveLength(0); // Attempt skipped due to missing assessment
      }
    });

    it('should handle attempts with missing students gracefully', async () => {
      // Arrange
      const adminUser = createTestUser({ role: 'admin' });
      await userAggregatedViewRepository.create(adminUser);

      const assessment = Assessment.create({
        slug: 'test',
        title: 'Test',
        type: 'QUIZ',
      });
      await assessmentRepository.create(assessment);

      const attempt = Attempt.create({
        status: new AttemptStatusVO('SUBMITTED'),
        startedAt: new Date(),
        identityId: 'non-existent-user',
        assessmentId: assessment.id.toString(),
      });

      await attemptRepository.create(attempt);

      const request: ListAttemptsRequest = {
        requesterId: adminUser.identityId,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        // The attempt shows up but without student info
        expect(result.value.attempts).toHaveLength(1);
        expect(result.value.attempts[0].student).toBeUndefined();
      }
    });

    it('should handle null values in user aggregated view', async () => {
      // Arrange
      const user = createTestUser({
        phone: null,
        birthDate: null,
        profileImageUrl: null,
        bio: null,
        profession: null,
        specialization: null,
        lastLogin: null,
        lockedUntil: null,
      });
      await userAggregatedViewRepository.create(user);

      const request: ListAttemptsRequest = {
        requesterId: user.identityId,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
    });

    it('should handle maximum page size appropriately', async () => {
      // Arrange
      const adminUser = createTestUser({ role: 'admin' });
      await userAggregatedViewRepository.create(adminUser);

      const request: ListAttemptsRequest = {
        requesterId: adminUser.identityId,
        pageSize: 1000, // Very large page size
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true); // Should fail validation
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });
  });

  // Performance Tests
  describe('Performance Tests', () => {
    it('should handle large number of attempts efficiently', async () => {
      // Arrange
      const adminUser = createTestUser({ role: 'admin' });
      await userAggregatedViewRepository.create(adminUser);

      const assessment = Assessment.create({
        slug: 'test',
        title: 'Test',
        type: 'QUIZ',
      });
      await assessmentRepository.create(assessment);

      // Create 100 attempts
      const start = Date.now();
      for (let i = 0; i < 100; i++) {
        const attempt = Attempt.create({
          status: new AttemptStatusVO('SUBMITTED'),
          score: new ScoreVO(Math.floor(Math.random() * 100)),
          startedAt: new Date(),
          identityId: adminUser.identityId,
          assessmentId: assessment.id.toString(),
        });
        await attemptRepository.create(attempt);
      }

      const request: ListAttemptsRequest = {
        requesterId: adminUser.identityId,
        pageSize: 50,
      };

      // Act
      const result = await sut.execute(request);
      const duration = Date.now() - start;

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attempts).toHaveLength(50);
      }
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  // Business Rules
  describe('Business Rules', () => {
    it('should correctly identify pending answers for PROVA_ABERTA', async () => {
      // Arrange
      const adminUser = createTestUser({ role: 'admin' });
      const studentUser = createTestUser({
        identityId: '550e8400-e29b-41d4-a716-446655440020',
        role: 'student',
      });

      await userAggregatedViewRepository.create(adminUser);
      await userAggregatedViewRepository.create(studentUser);

      const assessment = Assessment.create({
        slug: 'test-prova',
        title: 'Test Prova Aberta',
        type: 'PROVA_ABERTA',
      });
      await assessmentRepository.create(assessment);

      const attempt = Attempt.create({
        status: new AttemptStatusVO('GRADING'),
        startedAt: new Date(),
        submittedAt: new Date(),
        identityId: studentUser.identityId,
        assessmentId: assessment.id.toString(),
      });
      await attemptRepository.create(attempt);

      const request: ListAttemptsRequest = {
        requesterId: adminUser.identityId,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attempts[0].pendingAnswers).toBeDefined();
        expect(result.value.attempts[0].pendingAnswers).toBe(0); // TODO: should calculate actual pending
      }
    });

    it('should not include pending answers for QUIZ and SIMULADO', async () => {
      // Arrange
      const adminUser = createTestUser({ role: 'admin' });
      const studentUser = createTestUser({ role: 'student' });

      await userAggregatedViewRepository.create(adminUser);
      await userAggregatedViewRepository.create(studentUser);

      const quizAssessment = Assessment.create({
        slug: 'test-quiz',
        title: 'Test Quiz',
        type: 'QUIZ',
      });

      const simuladoAssessment = Assessment.create({
        slug: 'test-simulado',
        title: 'Test Simulado',
        type: 'SIMULADO',
      });

      await assessmentRepository.create(quizAssessment);
      await assessmentRepository.create(simuladoAssessment);

      const quizAttempt = Attempt.create({
        status: new AttemptStatusVO('SUBMITTED'),
        startedAt: new Date(),
        identityId: studentUser.identityId,
        assessmentId: quizAssessment.id.toString(),
      });

      const simuladoAttempt = Attempt.create({
        status: new AttemptStatusVO('SUBMITTED'),
        startedAt: new Date(),
        identityId: studentUser.identityId,
        assessmentId: simuladoAssessment.id.toString(),
      });

      await attemptRepository.create(quizAttempt);
      await attemptRepository.create(simuladoAttempt);

      const request: ListAttemptsRequest = {
        requesterId: adminUser.identityId,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const quiz = result.value.attempts.find(a => a.assessment.type === 'QUIZ');
        const simulado = result.value.attempts.find(a => a.assessment.type === 'SIMULADO');
        
        expect(quiz?.pendingAnswers).toBeUndefined();
        expect(simulado?.pendingAnswers).toBeUndefined();
      }
    });

    it('should filter by assessment ID correctly', async () => {
      // Arrange
      const adminUser = createTestUser({ role: 'admin' });
      await userAggregatedViewRepository.create(adminUser);

      const assessment1 = Assessment.create({
        slug: 'assessment-1',
        title: 'Assessment 1',
        type: 'QUIZ',
      });

      const assessment2 = Assessment.create({
        slug: 'assessment-2',
        title: 'Assessment 2',
        type: 'QUIZ',
      });

      await assessmentRepository.create(assessment1);
      await assessmentRepository.create(assessment2);

      const attempt1 = Attempt.create({
        status: new AttemptStatusVO('SUBMITTED'),
        startedAt: new Date(),
        identityId: adminUser.identityId,
        assessmentId: assessment1.id.toString(),
      });

      const attempt2 = Attempt.create({
        status: new AttemptStatusVO('SUBMITTED'),
        startedAt: new Date(),
        identityId: adminUser.identityId,
        assessmentId: assessment2.id.toString(),
      });

      await attemptRepository.create(attempt1);
      await attemptRepository.create(attempt2);

      const request: ListAttemptsRequest = {
        requesterId: adminUser.identityId,
        assessmentId: assessment1.id.toString(),
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attempts).toHaveLength(1);
        expect(result.value.attempts[0].assessmentId).toBe(assessment1.id.toString());
      }
    });

    it('should auto-filter student attempts by their own identity ID', async () => {
      // Arrange
      const studentUser = createTestUser({
        identityId: '550e8400-e29b-41d4-a716-446655440020',
        role: 'student',
      });

      const otherStudent = createTestUser({
        identityId: '550e8400-e29b-41d4-a716-446655440021',
        role: 'student',
      });

      await userAggregatedViewRepository.create(studentUser);
      await userAggregatedViewRepository.create(otherStudent);

      const assessment = Assessment.create({
        slug: 'test',
        title: 'Test',
        type: 'QUIZ',
      });
      await assessmentRepository.create(assessment);

      // Create attempts for both students
      const studentAttempt = Attempt.create({
        status: new AttemptStatusVO('SUBMITTED'),
        startedAt: new Date(),
        identityId: studentUser.identityId,
        assessmentId: assessment.id.toString(),
      });

      const otherAttempt = Attempt.create({
        status: new AttemptStatusVO('SUBMITTED'),
        startedAt: new Date(),
        identityId: otherStudent.identityId,
        assessmentId: assessment.id.toString(),
      });

      await attemptRepository.create(studentAttempt);
      await attemptRepository.create(otherAttempt);

      const request: ListAttemptsRequest = {
        requesterId: studentUser.identityId,
        // Note: no identityId filter provided
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attempts).toHaveLength(1);
        expect(result.value.attempts[0].identityId).toBe(studentUser.identityId);
      }
    });
  });
});