// src/domain/assessment/application/use-cases/list-pending-reviews.use-case.spec.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ListPendingReviewsUseCase } from './list-pending-reviews.use-case';
import { InMemoryAttemptAnswerRepository } from '@/test/repositories/in-memory-attempt-answer-repository';
import { InMemoryAttemptRepository } from '@/test/repositories/in-memory-attempt-repository';
import { InMemoryAssessmentRepository } from '@/test/repositories/in-memory-assessment-repository';
import { InMemoryQuestionRepository } from '@/test/repositories/in-memory-question-repository';
import { InMemoryUserAggregatedViewRepository } from '@/test/repositories/in-memory-user-aggregated-view-repository';
import { AttemptAnswer } from '@/domain/assessment/enterprise/entities/attempt-answer.entity';
import { Attempt } from '@/domain/assessment/enterprise/entities/attempt.entity';
import { Assessment } from '@/domain/assessment/enterprise/entities/assessment.entity';
import { Question } from '@/domain/assessment/enterprise/entities/question.entity';
import { AttemptStatusVO } from '@/domain/assessment/enterprise/value-objects/attempt-status.vo';
import { QuestionTypeVO } from '@/domain/assessment/enterprise/value-objects/question-type.vo';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { ListPendingReviewsRequest } from '../dtos/list-pending-reviews-request.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { UserNotFoundError } from './errors/user-not-found-error';
import { InsufficientPermissionsError } from './errors/insufficient-permissions-error';
import { UserAggregatedView } from '@/domain/auth/application/repositories/i-user-aggregated-view-repository';
import { left, right } from '@/core/either';

let sut: ListPendingReviewsUseCase;
let attemptAnswerRepository: InMemoryAttemptAnswerRepository;
let attemptRepository: InMemoryAttemptRepository;
let assessmentRepository: InMemoryAssessmentRepository;
let questionRepository: InMemoryQuestionRepository;
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

describe('ListPendingReviewsUseCase', () => {
  beforeEach(() => {
    attemptAnswerRepository = new InMemoryAttemptAnswerRepository();
    attemptRepository = new InMemoryAttemptRepository();
    assessmentRepository = new InMemoryAssessmentRepository();
    questionRepository = new InMemoryQuestionRepository();
    userAggregatedViewRepository = new InMemoryUserAggregatedViewRepository();

    sut = new ListPendingReviewsUseCase(
      attemptAnswerRepository,
      attemptRepository,
      assessmentRepository,
      questionRepository,
      userAggregatedViewRepository,
    );
  });

  // Success Cases
  describe('Success Cases', () => {
    it('should list pending reviews successfully for tutor', async () => {
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

      const assessment = Assessment.create(
        {
          slug: 'prova-aberta',
          title: 'Prova Aberta Test',
          type: 'PROVA_ABERTA',
        },
        new UniqueEntityID('550e8400-e29b-41d4-a716-446655440030'),
      );

      const question = Question.create(
        {
          text: 'What is your opinion?',
          type: new QuestionTypeVO('OPEN'),
          assessmentId: new UniqueEntityID(
            '550e8400-e29b-41d4-a716-446655440030',
          ),
        },
        new UniqueEntityID('550e8400-e29b-41d4-a716-446655440050'),
      );

      const attempt = Attempt.create(
        {
          status: new AttemptStatusVO('SUBMITTED'),
          startedAt: new Date('2024-01-01T10:00:00Z'),
          submittedAt: new Date('2024-01-01T11:00:00Z'),
          identityId: '550e8400-e29b-41d4-a716-446655440020',
          assessmentId: '550e8400-e29b-41d4-a716-446655440030',
        },
        new UniqueEntityID('550e8400-e29b-41d4-a716-446655440040'),
      );

      const attemptAnswer = AttemptAnswer.create(
        {
          textAnswer: 'This is my answer',
          status: new AttemptStatusVO('SUBMITTED'),
          attemptId: '550e8400-e29b-41d4-a716-446655440040',
          questionId: '550e8400-e29b-41d4-a716-446655440050',
        },
        new UniqueEntityID('550e8400-e29b-41d4-a716-446655440060'),
      );

      await userAggregatedViewRepository.create(tutorUser);
      await userAggregatedViewRepository.create(studentUser);
      await assessmentRepository.create(assessment);
      await questionRepository.create(question);
      await attemptRepository.create(attempt);
      await attemptAnswerRepository.create(attemptAnswer);

      const request: ListPendingReviewsRequest = {
        requesterId: '550e8400-e29b-41d4-a716-446655440010',
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const response = result.value;
        expect(response.attempts).toHaveLength(1);
        expect(response.attempts[0].id).toBe(
          '550e8400-e29b-41d4-a716-446655440040',
        );
        expect(response.attempts[0].status).toBe('SUBMITTED');
        expect(response.attempts[0].assessment.type).toBe('PROVA_ABERTA');
        expect(response.attempts[0].student?.name).toBe('Student User');
        expect(response.attempts[0].pendingAnswers).toBe(1);
        expect(response.attempts[0].totalOpenQuestions).toBe(1);
      }
    });

    it('should list pending reviews successfully for admin', async () => {
      // Arrange
      const adminUser = createTestUser({
        identityId: '550e8400-e29b-41d4-a716-446655440010',
        fullName: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
      });

      const studentUser = createTestUser({
        identityId: '550e8400-e29b-41d4-a716-446655440020',
        role: 'student',
      });

      const assessment = Assessment.create(
        {
          slug: 'prova-aberta',
          title: 'Prova Aberta Test',
          type: 'PROVA_ABERTA',
        },
        new UniqueEntityID('550e8400-e29b-41d4-a716-446655440030'),
      );

      const question = Question.create({
        text: 'Explain your answer',
        type: new QuestionTypeVO('OPEN'),
        assessmentId: new UniqueEntityID(
          '550e8400-e29b-41d4-a716-446655440030',
        ),
      });

      const attempt = Attempt.create({
        status: new AttemptStatusVO('SUBMITTED'),
        startedAt: new Date(),
        submittedAt: new Date(),
        identityId: studentUser.identityId,
        assessmentId: assessment.id.toString(),
      });

      const attemptAnswer = AttemptAnswer.create({
        textAnswer: 'My detailed answer',
        status: new AttemptStatusVO('SUBMITTED'),
        attemptId: attempt.id.toString(),
        questionId: question.id.toString(),
      });

      await userAggregatedViewRepository.create(adminUser);
      await userAggregatedViewRepository.create(studentUser);
      await assessmentRepository.create(assessment);
      await questionRepository.create(question);
      await attemptRepository.create(attempt);
      await attemptAnswerRepository.create(attemptAnswer);

      const request: ListPendingReviewsRequest = {
        requesterId: adminUser.identityId,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attempts).toHaveLength(1);
        expect(result.value.attempts[0].assessment.type).toBe('PROVA_ABERTA');
      }
    });

    it('should not include quiz or simulado assessments', async () => {
      // Arrange
      const tutorUser = createTestUser({
        identityId: '550e8400-e29b-41d4-a716-446655440010',
        role: 'tutor',
      });

      const studentUser = createTestUser({
        identityId: '550e8400-e29b-41d4-a716-446655440020',
        role: 'student',
      });

      const quizAssessment = Assessment.create(
        {
          slug: 'quiz-test',
          title: 'Quiz Test',
          type: 'QUIZ',
        },
        new UniqueEntityID('550e8400-e29b-41d4-a716-446655440031'),
      );

      const simuladoAssessment = Assessment.create(
        {
          slug: 'simulado-test',
          title: 'Simulado Test',
          type: 'SIMULADO',
        },
        new UniqueEntityID('550e8400-e29b-41d4-a716-446655440032'),
      );

      const quizAttempt = Attempt.create({
        status: new AttemptStatusVO('SUBMITTED'),
        startedAt: new Date(),
        submittedAt: new Date(),
        identityId: studentUser.identityId,
        assessmentId: quizAssessment.id.toString(),
      });

      const simuladoAttempt = Attempt.create({
        status: new AttemptStatusVO('SUBMITTED'),
        startedAt: new Date(),
        submittedAt: new Date(),
        identityId: studentUser.identityId,
        assessmentId: simuladoAssessment.id.toString(),
      });

      await userAggregatedViewRepository.create(tutorUser);
      await userAggregatedViewRepository.create(studentUser);
      await assessmentRepository.create(quizAssessment);
      await assessmentRepository.create(simuladoAssessment);
      await attemptRepository.create(quizAttempt);
      await attemptRepository.create(simuladoAttempt);

      const request: ListPendingReviewsRequest = {
        requesterId: tutorUser.identityId,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attempts).toHaveLength(0); // Quiz and Simulado should not appear
      }
    });

    it('should not include in-progress attempts', async () => {
      // Arrange
      const tutorUser = createTestUser({
        identityId: '550e8400-e29b-41d4-a716-446655440010',
        role: 'tutor',
      });

      const studentUser = createTestUser({
        identityId: '550e8400-e29b-41d4-a716-446655440020',
        role: 'student',
      });

      const assessment = Assessment.create({
        slug: 'prova-aberta',
        title: 'Prova Aberta Test',
        type: 'PROVA_ABERTA',
      });

      const inProgressAttempt = Attempt.create({
        status: new AttemptStatusVO('IN_PROGRESS'),
        startedAt: new Date(),
        identityId: studentUser.identityId,
        assessmentId: assessment.id.toString(),
      });

      await userAggregatedViewRepository.create(tutorUser);
      await userAggregatedViewRepository.create(studentUser);
      await assessmentRepository.create(assessment);
      await attemptRepository.create(inProgressAttempt);

      const request: ListPendingReviewsRequest = {
        requesterId: tutorUser.identityId,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attempts).toHaveLength(0); // In-progress attempts should not appear
      }
    });

    it('should return empty list when no pending reviews', async () => {
      // Arrange
      const tutorUser = createTestUser({
        identityId: '550e8400-e29b-41d4-a716-446655440010',
        role: 'tutor',
      });

      await userAggregatedViewRepository.create(tutorUser);

      const request: ListPendingReviewsRequest = {
        requesterId: tutorUser.identityId,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attempts).toHaveLength(0);
        expect(result.value.pagination.total).toBe(0);
      }
    });

    it('should sort attempts by submittedAt (oldest first)', async () => {
      // Arrange
      const tutorUser = createTestUser({
        identityId: '550e8400-e29b-41d4-a716-446655440010',
        role: 'tutor',
      });

      const studentUser = createTestUser({
        identityId: '550e8400-e29b-41d4-a716-446655440020',
        role: 'student',
      });

      const assessment = Assessment.create({
        slug: 'prova-aberta',
        title: 'Prova Aberta Test',
        type: 'PROVA_ABERTA',
      });

      const question = Question.create({
        text: 'What is your opinion?',
        type: new QuestionTypeVO('OPEN'),
        assessmentId: assessment.id,
      });

      // Create two attempts with different submission times
      const olderAttempt = Attempt.create(
        {
          status: new AttemptStatusVO('SUBMITTED'),
          startedAt: new Date('2024-01-01T10:00:00Z'),
          submittedAt: new Date('2024-01-01T11:00:00Z'), // Older
          identityId: studentUser.identityId,
          assessmentId: assessment.id.toString(),
        },
        new UniqueEntityID('550e8400-e29b-41d4-a716-446655440040'),
      );

      const newerAttempt = Attempt.create(
        {
          status: new AttemptStatusVO('SUBMITTED'),
          startedAt: new Date('2024-01-01T12:00:00Z'),
          submittedAt: new Date('2024-01-01T13:00:00Z'), // Newer
          identityId: studentUser.identityId,
          assessmentId: assessment.id.toString(),
        },
        new UniqueEntityID('550e8400-e29b-41d4-a716-446655440041'),
      );

      const olderAnswer = AttemptAnswer.create({
        textAnswer: 'Older answer',
        status: new AttemptStatusVO('SUBMITTED'),
        attemptId: olderAttempt.id.toString(),
        questionId: question.id.toString(),
      });

      const newerAnswer = AttemptAnswer.create({
        textAnswer: 'Newer answer',
        status: new AttemptStatusVO('SUBMITTED'),
        attemptId: newerAttempt.id.toString(),
        questionId: question.id.toString(),
      });

      await userAggregatedViewRepository.create(tutorUser);
      await userAggregatedViewRepository.create(studentUser);
      await assessmentRepository.create(assessment);
      await questionRepository.create(question);
      await attemptRepository.create(newerAttempt); // Add newer first
      await attemptRepository.create(olderAttempt); // Add older second
      await attemptAnswerRepository.create(newerAnswer);
      await attemptAnswerRepository.create(olderAnswer);

      const request: ListPendingReviewsRequest = {
        requesterId: tutorUser.identityId,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attempts).toHaveLength(2);
        // Older attempt should be first (priority for review)
        expect(result.value.attempts[0].id).toBe(olderAttempt.id.toString());
        expect(result.value.attempts[1].id).toBe(newerAttempt.id.toString());
      }
    });

    it('should paginate results correctly', async () => {
      // Arrange
      const tutorUser = createTestUser({ role: 'tutor' });
      const studentUser = createTestUser({ role: 'student' });

      const assessment = Assessment.create({
        slug: 'prova',
        title: 'Prova',
        type: 'PROVA_ABERTA',
      });

      const question = Question.create({
        text: 'Question',
        type: new QuestionTypeVO('OPEN'),
        assessmentId: assessment.id,
      });

      await userAggregatedViewRepository.create(tutorUser);
      await userAggregatedViewRepository.create(studentUser);
      await assessmentRepository.create(assessment);
      await questionRepository.create(question);

      // Create 5 attempts with answers
      for (let i = 0; i < 5; i++) {
        const attempt = Attempt.create({
          status: new AttemptStatusVO('SUBMITTED'),
          startedAt: new Date(),
          submittedAt: new Date(),
          identityId: studentUser.identityId,
          assessmentId: assessment.id.toString(),
        });

        const answer = AttemptAnswer.create({
          textAnswer: `Answer ${i}`,
          status: new AttemptStatusVO('SUBMITTED'),
          attemptId: attempt.id.toString(),
          questionId: question.id.toString(),
        });

        await attemptRepository.create(attempt);
        await attemptAnswerRepository.create(answer);
      }

      const request: ListPendingReviewsRequest = {
        requesterId: tutorUser.identityId,
        page: 1,
        pageSize: 2,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attempts).toHaveLength(2);
        expect(result.value.pagination.total).toBe(5);
        expect(result.value.pagination.totalPages).toBe(3);
      }
    });
  });

  // Validation Errors
  describe('Validation Errors', () => {
    it('should return InvalidInputError for invalid requester ID', async () => {
      // Arrange
      const request = {
        requesterId: 'invalid-id', // Not a valid UUID
      } as ListPendingReviewsRequest;

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('should return InvalidInputError for invalid page number', async () => {
      // Arrange
      const request: ListPendingReviewsRequest = {
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
      const request: ListPendingReviewsRequest = {
        requesterId: '550e8400-e29b-41d4-a716-446655440000',
        pageSize: 0,
      };

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
      const request: ListPendingReviewsRequest = {
        requesterId: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID but non-existent
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(UserNotFoundError);
    });

    it('should return InsufficientPermissionsError for student trying to access pending reviews', async () => {
      // Arrange
      const studentUser = createTestUser({
        identityId: '550e8400-e29b-41d4-a716-446655440020',
        role: 'student',
      });

      await userAggregatedViewRepository.create(studentUser);

      const request: ListPendingReviewsRequest = {
        requesterId: studentUser.identityId,
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
      vi.spyOn(
        userAggregatedViewRepository,
        'findByIdentityId',
      ).mockResolvedValueOnce(left(error));

      const request: ListPendingReviewsRequest = {
        requesterId: '550e8400-e29b-41d4-a716-446655440000',
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(UserNotFoundError);
    });

    it('should handle repository error when fetching pending answers', async () => {
      // Arrange
      const tutorUser = createTestUser({ role: 'tutor' });
      await userAggregatedViewRepository.create(tutorUser);

      const error = new Error('Database error');
      vi.spyOn(
        attemptAnswerRepository,
        'findPendingReviewsByStatus',
      ).mockResolvedValueOnce(left(error));

      const request: ListPendingReviewsRequest = {
        requesterId: tutorUser.identityId,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value.message).toContain(
          'Failed to fetch pending answers',
        );
      }
    });

    it('should handle unexpected errors gracefully', async () => {
      // Arrange
      const tutorUser = createTestUser({ role: 'tutor' });
      await userAggregatedViewRepository.create(tutorUser);

      vi.spyOn(
        attemptAnswerRepository,
        'findPendingReviewsByStatus',
      ).mockRejectedValueOnce(new Error('Unexpected error'));

      const request: ListPendingReviewsRequest = {
        requesterId: tutorUser.identityId,
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
      const tutorUser = createTestUser({ role: 'tutor' });
      const studentUser = createTestUser({ role: 'student' });

      const attempt = Attempt.create({
        status: new AttemptStatusVO('SUBMITTED'),
        startedAt: new Date(),
        submittedAt: new Date(),
        identityId: studentUser.identityId,
        assessmentId: 'non-existent-assessment',
      });

      const answer = AttemptAnswer.create({
        textAnswer: 'Answer',
        status: new AttemptStatusVO('SUBMITTED'),
        attemptId: attempt.id.toString(),
        questionId: 'some-question-id',
      });

      await userAggregatedViewRepository.create(tutorUser);
      await userAggregatedViewRepository.create(studentUser);
      await attemptRepository.create(attempt);
      await attemptAnswerRepository.create(answer);

      const request: ListPendingReviewsRequest = {
        requesterId: tutorUser.identityId,
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
      const tutorUser = createTestUser({ role: 'tutor' });

      const assessment = Assessment.create({
        slug: 'prova',
        title: 'Prova',
        type: 'PROVA_ABERTA',
      });

      const question = Question.create({
        text: 'Question',
        type: new QuestionTypeVO('OPEN'),
        assessmentId: assessment.id,
      });

      const attempt = Attempt.create({
        status: new AttemptStatusVO('SUBMITTED'),
        startedAt: new Date(),
        submittedAt: new Date(),
        identityId: 'non-existent-user',
        assessmentId: assessment.id.toString(),
      });

      const answer = AttemptAnswer.create({
        textAnswer: 'Answer',
        status: new AttemptStatusVO('SUBMITTED'),
        attemptId: attempt.id.toString(),
        questionId: question.id.toString(),
      });

      await userAggregatedViewRepository.create(tutorUser);
      await assessmentRepository.create(assessment);
      await questionRepository.create(question);
      await attemptRepository.create(attempt);
      await attemptAnswerRepository.create(answer);

      const request: ListPendingReviewsRequest = {
        requesterId: tutorUser.identityId,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attempts).toHaveLength(0); // Attempt skipped due to missing student
      }
    });

    it('should handle null values in user aggregated view', async () => {
      // Arrange
      const tutorUser = createTestUser({
        role: 'tutor',
        phone: null,
        birthDate: null,
        profileImageUrl: null,
        bio: null,
        profession: null,
        specialization: null,
        lastLogin: null,
        lockedUntil: null,
      });

      await userAggregatedViewRepository.create(tutorUser);

      const request: ListPendingReviewsRequest = {
        requesterId: tutorUser.identityId,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
    });

    it('should handle maximum page size appropriately', async () => {
      // Arrange
      const tutorUser = createTestUser({ role: 'tutor' });
      await userAggregatedViewRepository.create(tutorUser);

      const request: ListPendingReviewsRequest = {
        requesterId: tutorUser.identityId,
        pageSize: 1000, // Very large page size
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true); // Should fail validation
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('should handle graded answers correctly', async () => {
      // Arrange
      const tutorUser = createTestUser({ role: 'tutor' });
      const studentUser = createTestUser({ role: 'student' });

      const assessment = Assessment.create({
        slug: 'prova',
        title: 'Prova',
        type: 'PROVA_ABERTA',
      });

      const question = Question.create({
        text: 'Question',
        type: new QuestionTypeVO('OPEN'),
        assessmentId: assessment.id,
      });

      const attempt = Attempt.create({
        status: new AttemptStatusVO('GRADED'), // Already graded
        startedAt: new Date(),
        submittedAt: new Date(),
        gradedAt: new Date(),
        identityId: studentUser.identityId,
        assessmentId: assessment.id.toString(),
      });

      const answer = AttemptAnswer.create({
        textAnswer: 'Answer',
        status: new AttemptStatusVO('GRADED'), // Already graded
        isCorrect: true,
        attemptId: attempt.id.toString(),
        questionId: question.id.toString(),
      });

      await userAggregatedViewRepository.create(tutorUser);
      await userAggregatedViewRepository.create(studentUser);
      await assessmentRepository.create(assessment);
      await questionRepository.create(question);
      await attemptRepository.create(attempt);
      await attemptAnswerRepository.create(answer);

      const request: ListPendingReviewsRequest = {
        requesterId: tutorUser.identityId,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attempts).toHaveLength(0); // Graded answers should not appear
      }
    });
  });

  // Performance Tests
  describe('Performance Tests', () => {
    it('should handle large number of pending reviews efficiently', async () => {
      // Arrange
      const tutorUser = createTestUser({ role: 'tutor' });
      const studentUser = createTestUser({ role: 'student' });

      const assessment = Assessment.create({
        slug: 'prova',
        title: 'Prova',
        type: 'PROVA_ABERTA',
      });

      const question = Question.create({
        text: 'Question',
        type: new QuestionTypeVO('OPEN'),
        assessmentId: assessment.id,
      });

      await userAggregatedViewRepository.create(tutorUser);
      await userAggregatedViewRepository.create(studentUser);
      await assessmentRepository.create(assessment);
      await questionRepository.create(question);

      // Create 100 attempts with answers
      const start = Date.now();
      for (let i = 0; i < 100; i++) {
        const attempt = Attempt.create({
          status: new AttemptStatusVO('SUBMITTED'),
          startedAt: new Date(),
          submittedAt: new Date(Date.now() + i * 1000), // Different submission times
          identityId: studentUser.identityId,
          assessmentId: assessment.id.toString(),
        });

        const answer = AttemptAnswer.create({
          textAnswer: `Answer ${i}`,
          status: new AttemptStatusVO('SUBMITTED'),
          attemptId: attempt.id.toString(),
          questionId: question.id.toString(),
        });

        await attemptRepository.create(attempt);
        await attemptAnswerRepository.create(answer);
      }

      const request: ListPendingReviewsRequest = {
        requesterId: tutorUser.identityId,
        pageSize: 50,
      };

      // Act
      const result = await sut.execute(request);
      const duration = Date.now() - start;

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attempts).toHaveLength(50);
        expect(result.value.pagination.total).toBe(100);
      }
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  // Business Rules
  describe('Business Rules', () => {
    it('should calculate pending answers correctly', async () => {
      // Arrange
      const tutorUser = createTestUser({ role: 'tutor' });
      const studentUser = createTestUser({ role: 'student' });

      const assessment = Assessment.create({
        slug: 'prova',
        title: 'Prova',
        type: 'PROVA_ABERTA',
      });

      // Create multiple questions
      const questions: Question[] = [];
      for (let i = 0; i < 3; i++) {
        const question = Question.create({
          text: `Question ${i}`,
          type: new QuestionTypeVO('OPEN'),
          assessmentId: assessment.id,
        });
        questions.push(question);
        await questionRepository.create(question);
      }

      const attempt = Attempt.create({
        status: new AttemptStatusVO('SUBMITTED'),
        startedAt: new Date(),
        submittedAt: new Date(),
        identityId: studentUser.identityId,
        assessmentId: assessment.id.toString(),
      });

      // Create answers for only 2 questions
      for (let i = 0; i < 2; i++) {
        const answer = AttemptAnswer.create({
          textAnswer: `Answer ${i}`,
          status: new AttemptStatusVO('SUBMITTED'),
          attemptId: attempt.id.toString(),
          questionId: questions[i].id.toString(),
        });
        await attemptAnswerRepository.create(answer);
      }

      await userAggregatedViewRepository.create(tutorUser);
      await userAggregatedViewRepository.create(studentUser);
      await assessmentRepository.create(assessment);
      await attemptRepository.create(attempt);

      const request: ListPendingReviewsRequest = {
        requesterId: tutorUser.identityId,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attempts).toHaveLength(1);
        expect(result.value.attempts[0].pendingAnswers).toBe(2);
        expect(result.value.attempts[0].totalOpenQuestions).toBe(3);
      }
    });

    it('should handle mixed question types correctly', async () => {
      // Arrange
      const tutorUser = createTestUser({ role: 'tutor' });
      const studentUser = createTestUser({ role: 'student' });

      const assessment = Assessment.create({
        slug: 'prova',
        title: 'Prova',
        type: 'PROVA_ABERTA',
      });

      // Create open question
      const openQuestion = Question.create({
        text: 'Open question',
        type: new QuestionTypeVO('OPEN'),
        assessmentId: assessment.id,
      });

      // Create multiple choice question (should not count)
      const mcQuestion = Question.create({
        text: 'MC question',
        type: new QuestionTypeVO('MULTIPLE_CHOICE'),
        assessmentId: assessment.id,
      });

      const attempt = Attempt.create({
        status: new AttemptStatusVO('SUBMITTED'),
        startedAt: new Date(),
        submittedAt: new Date(),
        identityId: studentUser.identityId,
        assessmentId: assessment.id.toString(),
      });

      const answer = AttemptAnswer.create({
        textAnswer: 'Open answer',
        status: new AttemptStatusVO('SUBMITTED'),
        attemptId: attempt.id.toString(),
        questionId: openQuestion.id.toString(),
      });

      await userAggregatedViewRepository.create(tutorUser);
      await userAggregatedViewRepository.create(studentUser);
      await assessmentRepository.create(assessment);
      await questionRepository.create(openQuestion);
      await questionRepository.create(mcQuestion);
      await attemptRepository.create(attempt);
      await attemptAnswerRepository.create(answer);

      const request: ListPendingReviewsRequest = {
        requesterId: tutorUser.identityId,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attempts).toHaveLength(1);
        expect(result.value.attempts[0].totalOpenQuestions).toBe(1); // Only open questions
      }
    });

    it('should handle grading status attempts correctly', async () => {
      // Arrange
      const tutorUser = createTestUser({ role: 'tutor' });
      const studentUser = createTestUser({ role: 'student' });

      const assessment = Assessment.create({
        slug: 'prova',
        title: 'Prova',
        type: 'PROVA_ABERTA',
      });

      const question = Question.create({
        text: 'Question',
        type: new QuestionTypeVO('OPEN'),
        assessmentId: assessment.id,
      });

      const attempt = Attempt.create({
        status: new AttemptStatusVO('GRADING'), // In grading process
        startedAt: new Date(),
        submittedAt: new Date(),
        identityId: studentUser.identityId,
        assessmentId: assessment.id.toString(),
      });

      const answer = AttemptAnswer.create({
        textAnswer: 'Answer',
        status: new AttemptStatusVO('SUBMITTED'),
        attemptId: attempt.id.toString(),
        questionId: question.id.toString(),
      });

      await userAggregatedViewRepository.create(tutorUser);
      await userAggregatedViewRepository.create(studentUser);
      await assessmentRepository.create(assessment);
      await questionRepository.create(question);
      await attemptRepository.create(attempt);
      await attemptAnswerRepository.create(answer);

      const request: ListPendingReviewsRequest = {
        requesterId: tutorUser.identityId,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attempts).toHaveLength(1);
        expect(result.value.attempts[0].status).toBe('GRADING');
      }
    });
  });
});
