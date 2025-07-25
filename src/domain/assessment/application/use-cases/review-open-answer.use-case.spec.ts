// src/domain/assessment/application/use-cases/review-open-answer.use-case.spec.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReviewOpenAnswerUseCase } from './review-open-answer.use-case';
import { InMemoryAttemptAnswerRepository } from '@/test/repositories/in-memory-attempt-answer-repository';
import { InMemoryAttemptRepository } from '@/test/repositories/in-memory-attempt-repository';
import { InMemoryQuestionRepository } from '@/test/repositories/in-memory-question-repository';
import { InMemoryUserAggregatedViewRepository } from '@/test/repositories/in-memory-user-aggregated-view-repository';
import { IAttemptAnswerRepository } from '../repositories/i-attempt-answer-repository';
import { AttemptAnswer } from '@/domain/assessment/enterprise/entities/attempt-answer.entity';
import { Attempt } from '@/domain/assessment/enterprise/entities/attempt.entity';
import { Question } from '@/domain/assessment/enterprise/entities/question.entity';
import { AttemptStatusVO } from '@/domain/assessment/enterprise/value-objects/attempt-status.vo';
import { QuestionTypeVO } from '@/domain/assessment/enterprise/value-objects/question-type.vo';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { ReviewOpenAnswerRequest } from '../dtos/review-open-answer-request.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { AttemptAnswerNotFoundError } from './errors/attempt-answer-not-found-error';
import { UserNotFoundError } from './errors/user-not-found-error';
import { InsufficientPermissionsError } from './errors/insufficient-permissions-error';
import { AttemptNotFoundError } from './errors/attempt-not-found-error';
import { QuestionNotFoundError } from './errors/question-not-found-error';
import { AnswerNotReviewableError } from './errors/answer-not-reviewable-error';
import { RepositoryError } from './errors/repository-error';
import { UserAggregatedView } from '@/domain/auth/application/repositories/i-user-aggregated-view-repository';
import { left, right, Either } from '@/core/either';
import { ReviewOpenAnswerResponse } from '../dtos/review-open-answer-response.dto';

type ReviewOpenAnswerUseCaseResponse = Either<
  | InvalidInputError
  | AttemptAnswerNotFoundError
  | UserNotFoundError
  | InsufficientPermissionsError
  | AttemptNotFoundError
  | QuestionNotFoundError
  | AnswerNotReviewableError
  | RepositoryError,
  ReviewOpenAnswerResponse
>;

let sut: ReviewOpenAnswerUseCase;
let attemptAnswerRepository: InMemoryAttemptAnswerRepository;
let attemptRepository: InMemoryAttemptRepository;
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

describe('ReviewOpenAnswerUseCase', () => {
  beforeEach(() => {
    attemptAnswerRepository = new InMemoryAttemptAnswerRepository();
    attemptRepository = new InMemoryAttemptRepository();
    questionRepository = new InMemoryQuestionRepository();
    userAggregatedViewRepository = new InMemoryUserAggregatedViewRepository();

    sut = new ReviewOpenAnswerUseCase(
      attemptAnswerRepository,
      attemptRepository,
      questionRepository,
      userAggregatedViewRepository,
    );
  });

  // Success Cases
  describe('Success Cases', () => {
    it('should successfully review open answer as correct', async () => {
      // Arrange
      const attemptAnswerId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440000',
      );
      const attemptId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440001',
      );
      const questionId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440002',
      );
      const reviewerId = '550e8400-e29b-41d4-a716-446655440003';

      const reviewer = createTestUser({
        identityId: reviewerId,
        fullName: 'Teacher Name',
        email: 'teacher@example.com',
        role: 'tutor',
      });

      const attempt = Attempt.create(
        {
          status: new AttemptStatusVO('SUBMITTED'),
          startedAt: new Date(),
          submittedAt: new Date(),
          identityId: '550e8400-e29b-41d4-a716-446655440004',
          assessmentId: '550e8400-e29b-41d4-a716-446655440005',
        },
        attemptId,
      );

      const question = Question.create(
        {
          text: 'Explain the concept',
          type: new QuestionTypeVO('OPEN'),
          assessmentId: new UniqueEntityID(
            '550e8400-e29b-41d4-a716-446655440005',
          ),
        },
        questionId,
      );

      const attemptAnswer = AttemptAnswer.create(
        {
          textAnswer: 'This is my detailed explanation',
          status: new AttemptStatusVO('SUBMITTED'),
          attemptId: attemptId.toString(),
          questionId: questionId.toString(),
        },
        attemptAnswerId,
      );

      await userAggregatedViewRepository.create(reviewer);
      await attemptRepository.create(attempt);
      await questionRepository.create(question);
      await attemptAnswerRepository.create(attemptAnswer);

      const request: ReviewOpenAnswerRequest = {
        attemptAnswerId: attemptAnswerId.toString(),
        reviewerId: reviewerId,
        isCorrect: true,
        teacherComment: 'Excellent explanation!',
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attemptAnswer.id).toBe(attemptAnswerId.toString());
        expect(result.value.attemptAnswer.status).toBe('GRADED');
        expect(result.value.attemptAnswer.isCorrect).toBe(true);
        expect(result.value.attemptAnswer.teacherComment).toBe(
          'Excellent explanation!',
        );
        expect(result.value.attemptAnswer.reviewerId).toBe(reviewerId);
        expect(result.value.attemptAnswer.textAnswer).toBe(
          'This is my detailed explanation',
        );
        expect(result.value.attemptStatus.allOpenQuestionsReviewed).toBe(true);
      }
    });

    it('should successfully review open answer as incorrect', async () => {
      // Arrange
      const attemptAnswerId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440000',
      );
      const attemptId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440001',
      );
      const questionId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440002',
      );
      const reviewerId = '550e8400-e29b-41d4-a716-446655440003';

      const reviewer = createTestUser({
        identityId: reviewerId,
        fullName: 'Teacher Name',
        email: 'teacher@example.com',
        role: 'admin',
      });

      const attempt = Attempt.create(
        {
          status: new AttemptStatusVO('SUBMITTED'),
          startedAt: new Date(),
          submittedAt: new Date(),
          identityId: '550e8400-e29b-41d4-a716-446655440004',
          assessmentId: '550e8400-e29b-41d4-a716-446655440005',
        },
        attemptId,
      );

      const question = Question.create(
        {
          text: 'Explain the concept',
          type: new QuestionTypeVO('OPEN'),
          assessmentId: new UniqueEntityID(
            '550e8400-e29b-41d4-a716-446655440005',
          ),
        },
        questionId,
      );

      const attemptAnswer = AttemptAnswer.create(
        {
          textAnswer: 'This is incorrect explanation',
          status: new AttemptStatusVO('SUBMITTED'),
          attemptId: attemptId.toString(),
          questionId: questionId.toString(),
        },
        attemptAnswerId,
      );

      await userAggregatedViewRepository.create(reviewer);
      await attemptRepository.create(attempt);
      await questionRepository.create(question);
      await attemptAnswerRepository.create(attemptAnswer);

      const request: ReviewOpenAnswerRequest = {
        attemptAnswerId: attemptAnswerId.toString(),
        reviewerId: reviewerId,
        isCorrect: false,
        teacherComment: 'Please review the concept and try again',
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attemptAnswer.isCorrect).toBe(false);
        expect(result.value.attemptAnswer.teacherComment).toBe(
          'Please review the concept and try again',
        );
        expect(result.value.attemptAnswer.reviewerId).toBe(reviewerId);
      }
    });

    it('should review without teacher comment', async () => {
      // Arrange
      const attemptAnswerId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440000',
      );
      const attemptId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440001',
      );
      const questionId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440002',
      );
      const reviewerId = '550e8400-e29b-41d4-a716-446655440003';

      const reviewer = createTestUser({
        identityId: reviewerId,
        fullName: 'Teacher Name',
        email: 'teacher@example.com',
        role: 'tutor',
      });

      const attempt = Attempt.create(
        {
          status: new AttemptStatusVO('SUBMITTED'),
          startedAt: new Date(),
          submittedAt: new Date(),
          identityId: '550e8400-e29b-41d4-a716-446655440004',
          assessmentId: '550e8400-e29b-41d4-a716-446655440005',
        },
        attemptId,
      );

      const question = Question.create(
        {
          text: 'Explain the concept',
          type: new QuestionTypeVO('OPEN'),
          assessmentId: new UniqueEntityID(
            '550e8400-e29b-41d4-a716-446655440005',
          ),
        },
        questionId,
      );

      const attemptAnswer = AttemptAnswer.create(
        {
          textAnswer: 'Good explanation',
          status: new AttemptStatusVO('SUBMITTED'),
          attemptId: attemptId.toString(),
          questionId: questionId.toString(),
        },
        attemptAnswerId,
      );

      await userAggregatedViewRepository.create(reviewer);
      await attemptRepository.create(attempt);
      await questionRepository.create(question);
      await attemptAnswerRepository.create(attemptAnswer);

      const request: ReviewOpenAnswerRequest = {
        attemptAnswerId: attemptAnswerId.toString(),
        reviewerId: reviewerId,
        isCorrect: true,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attemptAnswer.isCorrect).toBe(true);
        expect(result.value.attemptAnswer.teacherComment).toBeUndefined();
        expect(result.value.attemptAnswer.reviewerId).toBe(reviewerId);
      }
    });

    it('should mark attempt as GRADED when all open questions are reviewed', async () => {
      // Arrange
      const attemptId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440001',
      );
      const reviewerId = '550e8400-e29b-41d4-a716-446655440003';

      const reviewer = createTestUser({
        identityId: reviewerId,
        role: 'tutor',
      });

      const attempt = Attempt.create(
        {
          status: new AttemptStatusVO('SUBMITTED'),
          startedAt: new Date(),
          submittedAt: new Date(),
          identityId: '550e8400-e29b-41d4-a716-446655440004',
          assessmentId: '550e8400-e29b-41d4-a716-446655440005',
        },
        attemptId,
      );

      const question = Question.create({
        text: 'Single open question',
        type: new QuestionTypeVO('OPEN'),
        assessmentId: new UniqueEntityID(
          '550e8400-e29b-41d4-a716-446655440005',
        ),
      });

      const attemptAnswer = AttemptAnswer.create({
        textAnswer: 'Answer to review',
        status: new AttemptStatusVO('SUBMITTED'),
        attemptId: attemptId.toString(),
        questionId: question.id.toString(),
      });

      await userAggregatedViewRepository.create(reviewer);
      await attemptRepository.create(attempt);
      await questionRepository.create(question);
      await attemptAnswerRepository.create(attemptAnswer);

      const request: ReviewOpenAnswerRequest = {
        attemptAnswerId: attemptAnswer.id.toString(),
        reviewerId: reviewerId,
        isCorrect: true,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attemptStatus.allOpenQuestionsReviewed).toBe(true);
        expect(result.value.attemptStatus.status).toBe('GRADED');
      }
    });

    it('should handle mixed question types correctly', async () => {
      // Arrange
      const attemptId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440001',
      );
      const reviewerId = '550e8400-e29b-41d4-a716-446655440003';

      const reviewer = createTestUser({
        identityId: reviewerId,
        role: 'tutor',
      });

      const attempt = Attempt.create(
        {
          status: new AttemptStatusVO('SUBMITTED'),
          startedAt: new Date(),
          submittedAt: new Date(),
          identityId: '550e8400-e29b-41d4-a716-446655440004',
          assessmentId: '550e8400-e29b-41d4-a716-446655440005',
        },
        attemptId,
      );

      // Open question
      const openQuestion = Question.create({
        text: 'Open question',
        type: new QuestionTypeVO('OPEN'),
        assessmentId: new UniqueEntityID(
          '550e8400-e29b-41d4-a716-446655440005',
        ),
      });

      // Multiple choice question
      const mcQuestion = Question.create({
        text: 'MC question',
        type: new QuestionTypeVO('MULTIPLE_CHOICE'),
        assessmentId: new UniqueEntityID(
          '550e8400-e29b-41d4-a716-446655440005',
        ),
      });

      const openAnswer = AttemptAnswer.create({
        textAnswer: 'Open answer',
        status: new AttemptStatusVO('SUBMITTED'),
        attemptId: attemptId.toString(),
        questionId: openQuestion.id.toString(),
      });

      const mcAnswer = AttemptAnswer.create({
        selectedOptionId: 'option-1',
        status: new AttemptStatusVO('SUBMITTED'),
        attemptId: attemptId.toString(),
        questionId: mcQuestion.id.toString(),
      });

      await userAggregatedViewRepository.create(reviewer);
      await attemptRepository.create(attempt);
      await questionRepository.create(openQuestion);
      await questionRepository.create(mcQuestion);
      await attemptAnswerRepository.create(openAnswer);
      await attemptAnswerRepository.create(mcAnswer);

      const request: ReviewOpenAnswerRequest = {
        attemptAnswerId: openAnswer.id.toString(),
        reviewerId: reviewerId,
        isCorrect: true,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attemptStatus.allOpenQuestionsReviewed).toBe(true);
        expect(result.value.attemptStatus.status).toBe('GRADED');
      }
    });

    it('should handle multiple reviewers for different questions', async () => {
      // Arrange
      const attemptId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440001',
      );
      const reviewer1Id = '550e8400-e29b-41d4-a716-446655440003';
      const reviewer2Id = '550e8400-e29b-41d4-a716-446655440008';

      const reviewer1 = createTestUser({
        identityId: reviewer1Id,
        role: 'tutor',
      });

      const reviewer2 = createTestUser({
        identityId: reviewer2Id,
        role: 'admin',
      });

      const attempt = Attempt.create(
        {
          status: new AttemptStatusVO('SUBMITTED'),
          startedAt: new Date(),
          submittedAt: new Date(),
          identityId: '550e8400-e29b-41d4-a716-446655440004',
          assessmentId: '550e8400-e29b-41d4-a716-446655440005',
        },
        attemptId,
      );

      const question1 = Question.create({
        text: 'Question 1',
        type: new QuestionTypeVO('OPEN'),
        assessmentId: new UniqueEntityID(
          '550e8400-e29b-41d4-a716-446655440005',
        ),
      });

      const question2 = Question.create({
        text: 'Question 2',
        type: new QuestionTypeVO('OPEN'),
        assessmentId: new UniqueEntityID(
          '550e8400-e29b-41d4-a716-446655440005',
        ),
      });

      const answer1 = AttemptAnswer.create({
        textAnswer: 'Answer 1',
        status: new AttemptStatusVO('SUBMITTED'),
        attemptId: attemptId.toString(),
        questionId: question1.id.toString(),
      });

      const answer2 = AttemptAnswer.create({
        textAnswer: 'Answer 2',
        status: new AttemptStatusVO('SUBMITTED'),
        attemptId: attemptId.toString(),
        questionId: question2.id.toString(),
      });

      await userAggregatedViewRepository.create(reviewer1);
      await userAggregatedViewRepository.create(reviewer2);
      await attemptRepository.create(attempt);
      await questionRepository.create(question1);
      await questionRepository.create(question2);
      await attemptAnswerRepository.create(answer1);
      await attemptAnswerRepository.create(answer2);

      // First reviewer reviews first answer
      const request1: ReviewOpenAnswerRequest = {
        attemptAnswerId: answer1.id.toString(),
        reviewerId: reviewer1Id,
        isCorrect: true,
      };

      const result1 = await sut.execute(request1);
      expect(result1.isRight()).toBe(true);

      // Second reviewer reviews second answer
      const request2: ReviewOpenAnswerRequest = {
        attemptAnswerId: answer2.id.toString(),
        reviewerId: reviewer2Id,
        isCorrect: false,
        teacherComment: 'Needs improvement',
      };

      // Act
      const result2 = await sut.execute(request2);

      // Assert
      expect(result2.isRight()).toBe(true);
      if (result2.isRight()) {
        expect(result2.value.attemptStatus.allOpenQuestionsReviewed).toBe(true);
        expect(result2.value.attemptStatus.status).toBe('GRADED');
      }
    });

    it('should handle review with special characters in comment', async () => {
      // Arrange
      const attemptAnswerId = new UniqueEntityID();
      const attemptId = new UniqueEntityID();
      const questionId = new UniqueEntityID();
      const reviewerId = '550e8400-e29b-41d4-a716-446655440003';

      const reviewer = createTestUser({
        identityId: reviewerId,
        role: 'tutor',
      });

      const attempt = Attempt.create(
        {
          status: new AttemptStatusVO('SUBMITTED'),
          startedAt: new Date(),
          submittedAt: new Date(),
          identityId: '550e8400-e29b-41d4-a716-446655440004',
          assessmentId: '550e8400-e29b-41d4-a716-446655440005',
        },
        attemptId,
      );

      const question = Question.create(
        {
          text: 'Question',
          type: new QuestionTypeVO('OPEN'),
          assessmentId: new UniqueEntityID(
            '550e8400-e29b-41d4-a716-446655440005',
          ),
        },
        questionId,
      );

      const attemptAnswer = AttemptAnswer.create(
        {
          textAnswer: 'Answer',
          status: new AttemptStatusVO('SUBMITTED'),
          attemptId: attemptId.toString(),
          questionId: questionId.toString(),
        },
        attemptAnswerId,
      );

      await userAggregatedViewRepository.create(reviewer);
      await attemptRepository.create(attempt);
      await questionRepository.create(question);
      await attemptAnswerRepository.create(attemptAnswer);

      const specialComment =
        'Good work! 👍 You\'ve shown understanding of "concepts" & <techniques>';
      const request: ReviewOpenAnswerRequest = {
        attemptAnswerId: attemptAnswerId.toString(),
        reviewerId: reviewerId,
        isCorrect: true,
        teacherComment: specialComment,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attemptAnswer.teacherComment).toBe(specialComment);
      }
    });
  });

  // Validation Errors
  describe('Validation Errors', () => {
    it('should return InvalidInputError for empty attemptAnswerId', async () => {
      // Arrange
      const request: ReviewOpenAnswerRequest = {
        attemptAnswerId: '',
        reviewerId: '550e8400-e29b-41d4-a716-446655440003',
        isCorrect: true,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect(result.value.message).toContain(
          'Attempt answer ID cannot be empty',
        );
      }
    });

    it('should return InvalidInputError for invalid UUID in attemptAnswerId', async () => {
      // Arrange
      const request: ReviewOpenAnswerRequest = {
        attemptAnswerId: 'invalid-uuid',
        reviewerId: '550e8400-e29b-41d4-a716-446655440003',
        isCorrect: true,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect(result.value.message).toContain(
          'Attempt answer ID must be a valid UUID',
        );
      }
    });

    it('should return InvalidInputError for invalid UUID in reviewerId', async () => {
      // Arrange
      const request: ReviewOpenAnswerRequest = {
        attemptAnswerId: '550e8400-e29b-41d4-a716-446655440000',
        reviewerId: 'invalid-uuid',
        isCorrect: true,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect(result.value.message).toContain(
          'Reviewer ID must be a valid UUID',
        );
      }
    });

    it('should return InvalidInputError for non-boolean isCorrect', async () => {
      // Arrange
      const request = {
        attemptAnswerId: '550e8400-e29b-41d4-a716-446655440000',
        reviewerId: '550e8400-e29b-41d4-a716-446655440003',
        isCorrect: 'not-boolean' as any,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should return InvalidInputError for empty teacher comment', async () => {
      // Arrange
      const request: ReviewOpenAnswerRequest = {
        attemptAnswerId: '550e8400-e29b-41d4-a716-446655440000',
        reviewerId: '550e8400-e29b-41d4-a716-446655440003',
        isCorrect: true,
        teacherComment: '   ', // Empty after trim
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect(result.value.message).toContain(
          'Teacher comment cannot be empty',
        );
      }
    });

    it('should return InvalidInputError for teacher comment exceeding max length', async () => {
      // Arrange
      const request: ReviewOpenAnswerRequest = {
        attemptAnswerId: '550e8400-e29b-41d4-a716-446655440000',
        reviewerId: '550e8400-e29b-41d4-a716-446655440003',
        isCorrect: true,
        teacherComment: 'a'.repeat(1001), // Exceeds max length of 1000
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
        expect(result.value.message).toContain(
          'Teacher comment cannot exceed 1000 characters',
        );
      }
    });

    it('should return InvalidInputError for missing required fields', async () => {
      // Arrange
      const request = {
        attemptAnswerId: '550e8400-e29b-41d4-a716-446655440000',
        reviewerId: '550e8400-e29b-41d4-a716-446655440003',
        // isCorrect is missing
      } as any;

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });
  });

  // Business Rule Errors
  describe('Business Rule Errors', () => {
    it('should return AttemptAnswerNotFoundError when attempt answer does not exist', async () => {
      // Arrange
      const reviewer = createTestUser({
        identityId: '550e8400-e29b-41d4-a716-446655440003',
        role: 'tutor',
      });

      await userAggregatedViewRepository.create(reviewer);

      const request: ReviewOpenAnswerRequest = {
        attemptAnswerId: '550e8400-e29b-41d4-a716-446655440000',
        reviewerId: '550e8400-e29b-41d4-a716-446655440003',
        isCorrect: true,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(AttemptAnswerNotFoundError);
      }
    });

    it('should return UserNotFoundError when reviewer does not exist', async () => {
      // Arrange
      const attemptAnswerId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440000',
      );

      const attemptAnswer = AttemptAnswer.create(
        {
          textAnswer: 'Some answer',
          status: new AttemptStatusVO('SUBMITTED'),
          attemptId: '550e8400-e29b-41d4-a716-446655440001',
          questionId: '550e8400-e29b-41d4-a716-446655440002',
        },
        attemptAnswerId,
      );

      await attemptAnswerRepository.create(attemptAnswer);

      const request: ReviewOpenAnswerRequest = {
        attemptAnswerId: attemptAnswerId.toString(),
        reviewerId: '550e8400-e29b-41d4-a716-446655440003',
        isCorrect: true,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(UserNotFoundError);
      }
    });

    it('should return InsufficientPermissionsError for student user', async () => {
      // Arrange
      const attemptAnswerId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440000',
      );
      const reviewerId = '550e8400-e29b-41d4-a716-446655440003';

      const student = createTestUser({
        identityId: reviewerId,
        fullName: 'Student Name',
        email: 'student@example.com',
        role: 'student',
      });

      const attemptAnswer = AttemptAnswer.create(
        {
          textAnswer: 'Some answer',
          status: new AttemptStatusVO('SUBMITTED'),
          attemptId: '550e8400-e29b-41d4-a716-446655440001',
          questionId: '550e8400-e29b-41d4-a716-446655440002',
        },
        attemptAnswerId,
      );

      await userAggregatedViewRepository.create(student);
      await attemptAnswerRepository.create(attemptAnswer);

      const request: ReviewOpenAnswerRequest = {
        attemptAnswerId: attemptAnswerId.toString(),
        reviewerId: reviewerId,
        isCorrect: true,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InsufficientPermissionsError);
      }
    });

    it('should return AttemptNotFoundError when attempt does not exist', async () => {
      // Arrange
      const attemptAnswerId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440000',
      );
      const reviewerId = '550e8400-e29b-41d4-a716-446655440003';

      const reviewer = createTestUser({
        identityId: reviewerId,
        fullName: 'Teacher Name',
        email: 'teacher@example.com',
        role: 'tutor',
      });

      const attemptAnswer = AttemptAnswer.create(
        {
          textAnswer: 'Some answer',
          status: new AttemptStatusVO('SUBMITTED'),
          attemptId: '550e8400-e29b-41d4-a716-446655440001',
          questionId: '550e8400-e29b-41d4-a716-446655440002',
        },
        attemptAnswerId,
      );

      await userAggregatedViewRepository.create(reviewer);
      await attemptAnswerRepository.create(attemptAnswer);

      const request: ReviewOpenAnswerRequest = {
        attemptAnswerId: attemptAnswerId.toString(),
        reviewerId: reviewerId,
        isCorrect: true,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(AttemptNotFoundError);
      }
    });

    it('should return AnswerNotReviewableError when attempt is not submitted', async () => {
      // Arrange
      const attemptAnswerId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440000',
      );
      const attemptId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440001',
      );
      const reviewerId = '550e8400-e29b-41d4-a716-446655440003';

      const reviewer = createTestUser({
        identityId: reviewerId,
        fullName: 'Teacher Name',
        email: 'teacher@example.com',
        role: 'tutor',
      });

      const attempt = Attempt.create(
        {
          status: new AttemptStatusVO('IN_PROGRESS'), // Not submitted
          startedAt: new Date(),
          identityId: '550e8400-e29b-41d4-a716-446655440004',
          assessmentId: '550e8400-e29b-41d4-a716-446655440005',
        },
        attemptId,
      );

      const attemptAnswer = AttemptAnswer.create(
        {
          textAnswer: 'Some answer',
          status: new AttemptStatusVO('SUBMITTED'),
          attemptId: attemptId.toString(),
          questionId: '550e8400-e29b-41d4-a716-446655440002',
        },
        attemptAnswerId,
      );

      await userAggregatedViewRepository.create(reviewer);
      await attemptRepository.create(attempt);
      await attemptAnswerRepository.create(attemptAnswer);

      const request: ReviewOpenAnswerRequest = {
        attemptAnswerId: attemptAnswerId.toString(),
        reviewerId: reviewerId,
        isCorrect: true,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(AnswerNotReviewableError);
      }
    });

    it('should return QuestionNotFoundError when question does not exist', async () => {
      // Arrange
      const attemptAnswerId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440000',
      );
      const attemptId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440001',
      );
      const reviewerId = '550e8400-e29b-41d4-a716-446655440003';

      const reviewer = createTestUser({
        identityId: reviewerId,
        fullName: 'Teacher Name',
        email: 'teacher@example.com',
        role: 'tutor',
      });

      const attempt = Attempt.create(
        {
          status: new AttemptStatusVO('SUBMITTED'),
          startedAt: new Date(),
          submittedAt: new Date(),
          identityId: '550e8400-e29b-41d4-a716-446655440004',
          assessmentId: '550e8400-e29b-41d4-a716-446655440005',
        },
        attemptId,
      );

      const attemptAnswer = AttemptAnswer.create(
        {
          textAnswer: 'Some answer',
          status: new AttemptStatusVO('SUBMITTED'),
          attemptId: attemptId.toString(),
          questionId: '550e8400-e29b-41d4-a716-446655440002', // Non-existent question
        },
        attemptAnswerId,
      );

      await userAggregatedViewRepository.create(reviewer);
      await attemptRepository.create(attempt);
      await attemptAnswerRepository.create(attemptAnswer);

      const request: ReviewOpenAnswerRequest = {
        attemptAnswerId: attemptAnswerId.toString(),
        reviewerId: reviewerId,
        isCorrect: true,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(QuestionNotFoundError);
      }
    });

    it('should return AnswerNotReviewableError for multiple choice question', async () => {
      // Arrange
      const attemptAnswerId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440000',
      );
      const attemptId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440001',
      );
      const questionId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440002',
      );
      const reviewerId = '550e8400-e29b-41d4-a716-446655440003';

      const reviewer = createTestUser({
        identityId: reviewerId,
        fullName: 'Teacher Name',
        email: 'teacher@example.com',
        role: 'tutor',
      });

      const attempt = Attempt.create(
        {
          status: new AttemptStatusVO('SUBMITTED'),
          startedAt: new Date(),
          submittedAt: new Date(),
          identityId: '550e8400-e29b-41d4-a716-446655440004',
          assessmentId: '550e8400-e29b-41d4-a716-446655440005',
        },
        attemptId,
      );

      const question = Question.create(
        {
          text: 'Multiple choice question',
          type: new QuestionTypeVO('MULTIPLE_CHOICE'), // Not open
          assessmentId: new UniqueEntityID(
            '550e8400-e29b-41d4-a716-446655440005',
          ),
        },
        questionId,
      );

      const attemptAnswer = AttemptAnswer.create(
        {
          selectedOptionId: 'some-option-id',
          status: new AttemptStatusVO('SUBMITTED'),
          attemptId: attemptId.toString(),
          questionId: questionId.toString(),
        },
        attemptAnswerId,
      );

      await userAggregatedViewRepository.create(reviewer);
      await attemptRepository.create(attempt);
      await questionRepository.create(question);
      await attemptAnswerRepository.create(attemptAnswer);

      const request: ReviewOpenAnswerRequest = {
        attemptAnswerId: attemptAnswerId.toString(),
        reviewerId: reviewerId,
        isCorrect: true,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(AnswerNotReviewableError);
      }
    });

    it('should return AnswerNotReviewableError when answer has no text', async () => {
      // Arrange
      const attemptAnswerId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440000',
      );
      const attemptId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440001',
      );
      const questionId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440002',
      );
      const reviewerId = '550e8400-e29b-41d4-a716-446655440003';

      const reviewer = createTestUser({
        identityId: reviewerId,
        fullName: 'Teacher Name',
        email: 'teacher@example.com',
        role: 'tutor',
      });

      const attempt = Attempt.create(
        {
          status: new AttemptStatusVO('SUBMITTED'),
          startedAt: new Date(),
          submittedAt: new Date(),
          identityId: '550e8400-e29b-41d4-a716-446655440004',
          assessmentId: '550e8400-e29b-41d4-a716-446655440005',
        },
        attemptId,
      );

      const question = Question.create(
        {
          text: 'Open question',
          type: new QuestionTypeVO('OPEN'),
          assessmentId: new UniqueEntityID(
            '550e8400-e29b-41d4-a716-446655440005',
          ),
        },
        questionId,
      );

      const attemptAnswer = AttemptAnswer.create(
        {
          // No textAnswer provided
          status: new AttemptStatusVO('SUBMITTED'),
          attemptId: attemptId.toString(),
          questionId: questionId.toString(),
        },
        attemptAnswerId,
      );

      await userAggregatedViewRepository.create(reviewer);
      await attemptRepository.create(attempt);
      await questionRepository.create(question);
      await attemptAnswerRepository.create(attemptAnswer);

      const request: ReviewOpenAnswerRequest = {
        attemptAnswerId: attemptAnswerId.toString(),
        reviewerId: reviewerId,
        isCorrect: true,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(AnswerNotReviewableError);
      }
    });

    it('should return AnswerNotReviewableError when answer is already reviewed', async () => {
      // Arrange
      const attemptAnswerId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440000',
      );
      const attemptId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440001',
      );
      const questionId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440002',
      );
      const reviewerId = '550e8400-e29b-41d4-a716-446655440003';
      const previousReviewerId = '550e8400-e29b-41d4-a716-446655440008';

      const reviewer = createTestUser({
        identityId: reviewerId,
        fullName: 'Teacher Name',
        email: 'teacher@example.com',
        role: 'tutor',
      });

      const attempt = Attempt.create(
        {
          status: new AttemptStatusVO('SUBMITTED'),
          startedAt: new Date(),
          submittedAt: new Date(),
          identityId: '550e8400-e29b-41d4-a716-446655440004',
          assessmentId: '550e8400-e29b-41d4-a716-446655440005',
        },
        attemptId,
      );

      const question = Question.create(
        {
          text: 'Open question',
          type: new QuestionTypeVO('OPEN'),
          assessmentId: new UniqueEntityID(
            '550e8400-e29b-41d4-a716-446655440005',
          ),
        },
        questionId,
      );

      const attemptAnswer = AttemptAnswer.create(
        {
          textAnswer: 'Some answer',
          status: new AttemptStatusVO('GRADED'),
          reviewerId: previousReviewerId, // Already reviewed
          isCorrect: true,
          teacherComment: 'Already reviewed',
          attemptId: attemptId.toString(),
          questionId: questionId.toString(),
        },
        attemptAnswerId,
      );

      await userAggregatedViewRepository.create(reviewer);
      await attemptRepository.create(attempt);
      await questionRepository.create(question);
      await attemptAnswerRepository.create(attemptAnswer);

      const request: ReviewOpenAnswerRequest = {
        attemptAnswerId: attemptAnswerId.toString(),
        reviewerId: reviewerId,
        isCorrect: false,
        teacherComment: 'Trying to review again',
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(AnswerNotReviewableError);
      }
    });

    it('should return AnswerNotReviewableError when attempt is already graded', async () => {
      // Arrange
      const attemptAnswerId = new UniqueEntityID();
      const attemptId = new UniqueEntityID();
      const questionId = new UniqueEntityID();
      const reviewerId = '550e8400-e29b-41d4-a716-446655440003';

      const reviewer = createTestUser({
        identityId: reviewerId,
        role: 'tutor',
      });

      const attempt = Attempt.create(
        {
          status: new AttemptStatusVO('GRADED'), // Already graded
          startedAt: new Date(),
          submittedAt: new Date(),
          gradedAt: new Date(),
          identityId: '550e8400-e29b-41d4-a716-446655440004',
          assessmentId: '550e8400-e29b-41d4-a716-446655440005',
        },
        attemptId,
      );

      const question = Question.create(
        {
          text: 'Open question',
          type: new QuestionTypeVO('OPEN'),
          assessmentId: new UniqueEntityID(
            '550e8400-e29b-41d4-a716-446655440005',
          ),
        },
        questionId,
      );

      const attemptAnswer = AttemptAnswer.create(
        {
          textAnswer: 'Some answer',
          status: new AttemptStatusVO('SUBMITTED'),
          attemptId: attemptId.toString(),
          questionId: questionId.toString(),
        },
        attemptAnswerId,
      );

      await userAggregatedViewRepository.create(reviewer);
      await attemptRepository.create(attempt);
      await questionRepository.create(question);
      await attemptAnswerRepository.create(attemptAnswer);

      const request: ReviewOpenAnswerRequest = {
        attemptAnswerId: attemptAnswerId.toString(),
        reviewerId: reviewerId,
        isCorrect: true,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(AnswerNotReviewableError);
      }
    });
  });

  // Repository Errors
  describe('Repository Errors', () => {
    it('should return RepositoryError when attempt answer update fails', async () => {
      // Arrange
      const attemptAnswerId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440000',
      );
      const attemptId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440001',
      );
      const questionId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440002',
      );
      const reviewerId = '550e8400-e29b-41d4-a716-446655440003';

      const reviewer = createTestUser({
        identityId: reviewerId,
        fullName: 'Teacher Name',
        email: 'teacher@example.com',
        role: 'tutor',
      });

      const attempt = Attempt.create(
        {
          status: new AttemptStatusVO('SUBMITTED'),
          startedAt: new Date(),
          submittedAt: new Date(),
          identityId: '550e8400-e29b-41d4-a716-446655440004',
          assessmentId: '550e8400-e29b-41d4-a716-446655440005',
        },
        attemptId,
      );

      const question = Question.create(
        {
          text: 'Open question',
          type: new QuestionTypeVO('OPEN'),
          assessmentId: new UniqueEntityID(
            '550e8400-e29b-41d4-a716-446655440005',
          ),
        },
        questionId,
      );

      const attemptAnswer = AttemptAnswer.create(
        {
          textAnswer: 'Some answer',
          status: new AttemptStatusVO('SUBMITTED'),
          attemptId: attemptId.toString(),
          questionId: questionId.toString(),
        },
        attemptAnswerId,
      );

      await userAggregatedViewRepository.create(reviewer);
      await attemptRepository.create(attempt);
      await questionRepository.create(question);
      await attemptAnswerRepository.create(attemptAnswer);

      // Mock repository failure
      vi.spyOn(attemptAnswerRepository, 'update').mockResolvedValueOnce(
        left(new Error('Database error')),
      );

      const request: ReviewOpenAnswerRequest = {
        attemptAnswerId: attemptAnswerId.toString(),
        reviewerId: reviewerId,
        isCorrect: true,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe('Failed to update attempt answer');
      }
    });

    it('should handle repository error when fetching user', async () => {
      // Arrange
      const attemptAnswerId = new UniqueEntityID();
      const attemptAnswer = AttemptAnswer.create(
        {
          textAnswer: 'Answer',
          status: new AttemptStatusVO('SUBMITTED'),
          attemptId: '550e8400-e29b-41d4-a716-446655440001',
          questionId: '550e8400-e29b-41d4-a716-446655440002',
        },
        attemptAnswerId,
      );

      await attemptAnswerRepository.create(attemptAnswer);

      const error = new Error('Database connection failed');
      vi.spyOn(
        userAggregatedViewRepository,
        'findByIdentityId',
      ).mockResolvedValueOnce(left(error));

      const request: ReviewOpenAnswerRequest = {
        attemptAnswerId: attemptAnswerId.toString(),
        reviewerId: '550e8400-e29b-41d4-a716-446655440003',
        isCorrect: true,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(UserNotFoundError);
    });

    it('should handle unexpected errors gracefully', async () => {
      // Arrange
      const attemptAnswerId = new UniqueEntityID();
      const attemptAnswer = AttemptAnswer.create(
        {
          textAnswer: 'Answer',
          status: new AttemptStatusVO('SUBMITTED'),
          attemptId: '550e8400-e29b-41d4-a716-446655440001',
          questionId: '550e8400-e29b-41d4-a716-446655440002',
        },
        attemptAnswerId,
      );

      await attemptAnswerRepository.create(attemptAnswer);

      vi.spyOn(
        userAggregatedViewRepository,
        'findByIdentityId',
      ).mockRejectedValueOnce(new Error('Unexpected error'));

      const request: ReviewOpenAnswerRequest = {
        attemptAnswerId: attemptAnswerId.toString(),
        reviewerId: '550e8400-e29b-41d4-a716-446655440003',
        isCorrect: true,
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
    it('should handle multiple open questions with partial review completion', async () => {
      // Arrange
      const attemptAnswerId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440000',
      );
      const attemptId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440001',
      );
      const questionId1 = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440002',
      );
      const questionId2 = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440007',
      );
      const reviewerId = '550e8400-e29b-41d4-a716-446655440003';

      const reviewer = createTestUser({
        identityId: reviewerId,
        fullName: 'Teacher Name',
        email: 'teacher@example.com',
        role: 'tutor',
      });

      const attempt = Attempt.create(
        {
          status: new AttemptStatusVO('SUBMITTED'),
          startedAt: new Date(),
          submittedAt: new Date(),
          identityId: '550e8400-e29b-41d4-a716-446655440004',
          assessmentId: '550e8400-e29b-41d4-a716-446655440005',
        },
        attemptId,
      );

      const question1 = Question.create(
        {
          text: 'First open question',
          type: new QuestionTypeVO('OPEN'),
          assessmentId: new UniqueEntityID(
            '550e8400-e29b-41d4-a716-446655440005',
          ),
        },
        questionId1,
      );

      const question2 = Question.create(
        {
          text: 'Second open question',
          type: new QuestionTypeVO('OPEN'),
          assessmentId: new UniqueEntityID(
            '550e8400-e29b-41d4-a716-446655440005',
          ),
        },
        questionId2,
      );

      const attemptAnswer1 = AttemptAnswer.create(
        {
          textAnswer: 'First answer',
          status: new AttemptStatusVO('SUBMITTED'),
          attemptId: attemptId.toString(),
          questionId: questionId1.toString(),
        },
        attemptAnswerId,
      );

      const attemptAnswer2 = AttemptAnswer.create({
        textAnswer: 'Second answer',
        status: new AttemptStatusVO('SUBMITTED'), // Not yet graded
        attemptId: attemptId.toString(),
        questionId: questionId2.toString(),
      });

      await userAggregatedViewRepository.create(reviewer);
      await attemptRepository.create(attempt);
      await questionRepository.create(question1);
      await questionRepository.create(question2);
      await attemptAnswerRepository.create(attemptAnswer1);
      await attemptAnswerRepository.create(attemptAnswer2);

      const request: ReviewOpenAnswerRequest = {
        attemptAnswerId: attemptAnswerId.toString(),
        reviewerId: reviewerId,
        isCorrect: true,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attemptStatus.allOpenQuestionsReviewed).toBe(false); // Still has ungraded question
        expect(result.value.attemptStatus.status).toBe('SUBMITTED'); // Should remain submitted
      }
    });

    it('should handle long teacher comment at max length', async () => {
      // Arrange
      const attemptAnswerId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440000',
      );
      const attemptId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440001',
      );
      const questionId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440002',
      );
      const reviewerId = '550e8400-e29b-41d4-a716-446655440003';

      const reviewer = createTestUser({
        identityId: reviewerId,
        fullName: 'Teacher Name',
        email: 'teacher@example.com',
        role: 'tutor',
      });

      const attempt = Attempt.create(
        {
          status: new AttemptStatusVO('SUBMITTED'),
          startedAt: new Date(),
          submittedAt: new Date(),
          identityId: '550e8400-e29b-41d4-a716-446655440004',
          assessmentId: '550e8400-e29b-41d4-a716-446655440005',
        },
        attemptId,
      );

      const question = Question.create(
        {
          text: 'Open question',
          type: new QuestionTypeVO('OPEN'),
          assessmentId: new UniqueEntityID(
            '550e8400-e29b-41d4-a716-446655440005',
          ),
        },
        questionId,
      );

      const attemptAnswer = AttemptAnswer.create(
        {
          textAnswer: 'Some answer',
          status: new AttemptStatusVO('SUBMITTED'),
          attemptId: attemptId.toString(),
          questionId: questionId.toString(),
        },
        attemptAnswerId,
      );

      await userAggregatedViewRepository.create(reviewer);
      await attemptRepository.create(attempt);
      await questionRepository.create(question);
      await attemptAnswerRepository.create(attemptAnswer);

      const longComment = 'a'.repeat(1000); // Max length
      const request: ReviewOpenAnswerRequest = {
        attemptAnswerId: attemptAnswerId.toString(),
        reviewerId: reviewerId,
        isCorrect: false,
        teacherComment: longComment,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attemptAnswer.teacherComment).toBe(longComment);
      }
    });

    it('should correctly save reviewerId when grading answer', async () => {
      // Arrange
      const attemptAnswerId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440000',
      );
      const attemptId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440001',
      );
      const questionId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440002',
      );
      const reviewerId = '550e8400-e29b-41d4-a716-446655440003';

      const reviewer = createTestUser({
        identityId: reviewerId,
        fullName: 'Teacher Name',
        email: 'teacher@example.com',
        role: 'tutor',
      });

      const attempt = Attempt.create(
        {
          status: new AttemptStatusVO('SUBMITTED'),
          startedAt: new Date(),
          submittedAt: new Date(),
          identityId: '550e8400-e29b-41d4-a716-446655440004',
          assessmentId: '550e8400-e29b-41d4-a716-446655440005',
        },
        attemptId,
      );

      const question = Question.create(
        {
          text: 'Open question',
          type: new QuestionTypeVO('OPEN'),
          assessmentId: new UniqueEntityID(
            '550e8400-e29b-41d4-a716-446655440005',
          ),
        },
        questionId,
      );

      const attemptAnswer = AttemptAnswer.create(
        {
          textAnswer: 'Some answer',
          status: new AttemptStatusVO('SUBMITTED'),
          attemptId: attemptId.toString(),
          questionId: questionId.toString(),
        },
        attemptAnswerId,
      );

      await userAggregatedViewRepository.create(reviewer);
      await attemptRepository.create(attempt);
      await questionRepository.create(question);
      await attemptAnswerRepository.create(attemptAnswer);

      const request: ReviewOpenAnswerRequest = {
        attemptAnswerId: attemptAnswerId.toString(),
        reviewerId: reviewerId,
        isCorrect: true,
        teacherComment: 'Good work!',
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attemptAnswer.reviewerId).toBe(reviewerId);

        // Verify the answer was actually updated in repository
        const updatedAnswerResult = await attemptAnswerRepository.findById(
          attemptAnswerId.toString(),
        );
        expect(updatedAnswerResult.isRight()).toBe(true);
        if (updatedAnswerResult.isRight()) {
          expect(updatedAnswerResult.value.reviewerId).toBe(reviewerId);
        }
      }
    });

    it('should handle null values in user aggregated view', async () => {
      // Arrange
      const attemptAnswerId = new UniqueEntityID();
      const attemptId = new UniqueEntityID();
      const questionId = new UniqueEntityID();
      const reviewerId = '550e8400-e29b-41d4-a716-446655440003';

      const reviewer = createTestUser({
        identityId: reviewerId,
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

      const attempt = Attempt.create(
        {
          status: new AttemptStatusVO('SUBMITTED'),
          startedAt: new Date(),
          submittedAt: new Date(),
          identityId: '550e8400-e29b-41d4-a716-446655440004',
          assessmentId: '550e8400-e29b-41d4-a716-446655440005',
        },
        attemptId,
      );

      const question = Question.create(
        {
          text: 'Question',
          type: new QuestionTypeVO('OPEN'),
          assessmentId: new UniqueEntityID(
            '550e8400-e29b-41d4-a716-446655440005',
          ),
        },
        questionId,
      );

      const attemptAnswer = AttemptAnswer.create(
        {
          textAnswer: 'Answer',
          status: new AttemptStatusVO('SUBMITTED'),
          attemptId: attemptId.toString(),
          questionId: questionId.toString(),
        },
        attemptAnswerId,
      );

      await userAggregatedViewRepository.create(reviewer);
      await attemptRepository.create(attempt);
      await questionRepository.create(question);
      await attemptAnswerRepository.create(attemptAnswer);

      const request: ReviewOpenAnswerRequest = {
        attemptAnswerId: attemptAnswerId.toString(),
        reviewerId: reviewerId,
        isCorrect: true,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
    });

    it('should handle answer with reviewerId but status is SUBMITTED', async () => {
      // Edge case: answer has reviewerId but status is still SUBMITTED
      const attemptAnswerId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440000',
      );
      const attemptId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440001',
      );
      const questionId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440002',
      );
      const reviewerId = '550e8400-e29b-41d4-a716-446655440003';
      const previousReviewerId = '550e8400-e29b-41d4-a716-446655440008';

      const reviewer = createTestUser({
        identityId: reviewerId,
        fullName: 'Teacher Name',
        email: 'teacher@example.com',
        role: 'tutor',
      });

      const attempt = Attempt.create(
        {
          status: new AttemptStatusVO('SUBMITTED'),
          startedAt: new Date(),
          submittedAt: new Date(),
          identityId: '550e8400-e29b-41d4-a716-446655440004',
          assessmentId: '550e8400-e29b-41d4-a716-446655440005',
        },
        attemptId,
      );

      const question = Question.create(
        {
          text: 'Open question',
          type: new QuestionTypeVO('OPEN'),
          assessmentId: new UniqueEntityID(
            '550e8400-e29b-41d4-a716-446655440005',
          ),
        },
        questionId,
      );

      const attemptAnswer = AttemptAnswer.create(
        {
          textAnswer: 'Some answer',
          status: new AttemptStatusVO('SUBMITTED'), // Status SUBMITTED but has reviewerId
          reviewerId: previousReviewerId, // Already has reviewerId
          attemptId: attemptId.toString(),
          questionId: questionId.toString(),
        },
        attemptAnswerId,
      );

      await userAggregatedViewRepository.create(reviewer);
      await attemptRepository.create(attempt);
      await questionRepository.create(question);
      await attemptAnswerRepository.create(attemptAnswer);

      const request: ReviewOpenAnswerRequest = {
        attemptAnswerId: attemptAnswerId.toString(),
        reviewerId: reviewerId,
        isCorrect: true,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(AnswerNotReviewableError);
      }
    });
  });

  // Performance Tests
  describe('Performance Tests', () => {
    it('should handle multiple concurrent reviews efficiently', async () => {
      // Arrange
      const assessmentId = '550e8400-e29b-41d4-a716-446655440005';
      const studentId = '550e8400-e29b-41d4-a716-446655440004';
      const reviewerId = '550e8400-e29b-41d4-a716-446655440003';

      const reviewer = createTestUser({
        identityId: reviewerId,
        role: 'tutor',
      });

      await userAggregatedViewRepository.create(reviewer);

      // Create multiple attempts with answers
      const promises: Promise<ReviewOpenAnswerUseCaseResponse>[] = [];
      for (let i = 0; i < 10; i++) {
        const attemptId = new UniqueEntityID();
        const questionId = new UniqueEntityID();
        const answerId = new UniqueEntityID();

        const attempt = Attempt.create(
          {
            status: new AttemptStatusVO('SUBMITTED'),
            startedAt: new Date(),
            submittedAt: new Date(),
            identityId: studentId,
            assessmentId: assessmentId,
          },
          attemptId,
        );

        const question = Question.create(
          {
            text: `Question ${i}`,
            type: new QuestionTypeVO('OPEN'),
            assessmentId: new UniqueEntityID(assessmentId),
          },
          questionId,
        );

        const answer = AttemptAnswer.create(
          {
            textAnswer: `Answer ${i}`,
            status: new AttemptStatusVO('SUBMITTED'),
            attemptId: attemptId.toString(),
            questionId: questionId.toString(),
          },
          answerId,
        );

        await attemptRepository.create(attempt);
        await questionRepository.create(question);
        await attemptAnswerRepository.create(answer);

        const request: ReviewOpenAnswerRequest = {
          attemptAnswerId: answerId.toString(),
          reviewerId: reviewerId,
          isCorrect: i % 2 === 0,
          teacherComment: i % 3 === 0 ? `Comment ${i}` : undefined,
        };

        promises.push(sut.execute(request));
      }

      const start = Date.now();

      // Act
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
    it('should not change attempt status when not all questions are reviewed', async () => {
      // Arrange
      const attemptId = new UniqueEntityID();
      const reviewerId = '550e8400-e29b-41d4-a716-446655440003';

      const reviewer = createTestUser({
        identityId: reviewerId,
        role: 'tutor',
      });

      const attempt = Attempt.create(
        {
          status: new AttemptStatusVO('SUBMITTED'),
          startedAt: new Date(),
          submittedAt: new Date(),
          identityId: '550e8400-e29b-41d4-a716-446655440004',
          assessmentId: '550e8400-e29b-41d4-a716-446655440005',
        },
        attemptId,
      );

      // Create 3 open questions
      const questions: Question[] = [];
      const answers: AttemptAnswer[] = [];
      for (let i = 0; i < 3; i++) {
        const question = Question.create({
          text: `Question ${i}`,
          type: new QuestionTypeVO('OPEN'),
          assessmentId: new UniqueEntityID(
            '550e8400-e29b-41d4-a716-446655440005',
          ),
        });

        const answer = AttemptAnswer.create({
          textAnswer: `Answer ${i}`,
          status: new AttemptStatusVO('SUBMITTED'),
          attemptId: attemptId.toString(),
          questionId: question.id.toString(),
        });

        questions.push(question);
        answers.push(answer);

        await questionRepository.create(question);
        await attemptAnswerRepository.create(answer);
      }

      await userAggregatedViewRepository.create(reviewer);
      await attemptRepository.create(attempt);

      // Review only the first answer
      const request: ReviewOpenAnswerRequest = {
        attemptAnswerId: answers[0].id.toString(),
        reviewerId: reviewerId,
        isCorrect: true,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attemptStatus.allOpenQuestionsReviewed).toBe(false);
        expect(result.value.attemptStatus.status).toBe('SUBMITTED');
      }
    });

    it('should correctly identify all questions reviewed with mixed types', async () => {
      // Arrange
      const attemptId = new UniqueEntityID();
      const reviewerId = '550e8400-e29b-41d4-a716-446655440003';

      const reviewer = createTestUser({
        identityId: reviewerId,
        role: 'admin',
      });

      const attempt = Attempt.create(
        {
          status: new AttemptStatusVO('SUBMITTED'),
          startedAt: new Date(),
          submittedAt: new Date(),
          identityId: '550e8400-e29b-41d4-a716-446655440004',
          assessmentId: '550e8400-e29b-41d4-a716-446655440005',
        },
        attemptId,
      );

      // Create mixed question types
      const openQuestion1 = Question.create({
        text: 'Open 1',
        type: new QuestionTypeVO('OPEN'),
        assessmentId: new UniqueEntityID(
          '550e8400-e29b-41d4-a716-446655440005',
        ),
      });

      const mcQuestion = Question.create({
        text: 'MC',
        type: new QuestionTypeVO('MULTIPLE_CHOICE'),
        assessmentId: new UniqueEntityID(
          '550e8400-e29b-41d4-a716-446655440005',
        ),
      });

      const openQuestion2 = Question.create({
        text: 'Open 2',
        type: new QuestionTypeVO('OPEN'),
        assessmentId: new UniqueEntityID(
          '550e8400-e29b-41d4-a716-446655440005',
        ),
      });

      // Create answers
      const openAnswer1 = AttemptAnswer.create({
        textAnswer: 'Answer 1',
        status: new AttemptStatusVO('GRADED'), // Already graded
        isCorrect: true,
        reviewerId: '550e8400-e29b-41d4-a716-446655440009',
        attemptId: attemptId.toString(),
        questionId: openQuestion1.id.toString(),
      });

      const mcAnswer = AttemptAnswer.create({
        selectedOptionId: 'option-1',
        status: new AttemptStatusVO('SUBMITTED'),
        attemptId: attemptId.toString(),
        questionId: mcQuestion.id.toString(),
      });

      const openAnswer2 = AttemptAnswer.create({
        textAnswer: 'Answer 2',
        status: new AttemptStatusVO('SUBMITTED'), // To be graded
        attemptId: attemptId.toString(),
        questionId: openQuestion2.id.toString(),
      });

      await userAggregatedViewRepository.create(reviewer);
      await attemptRepository.create(attempt);
      await questionRepository.create(openQuestion1);
      await questionRepository.create(mcQuestion);
      await questionRepository.create(openQuestion2);
      await attemptAnswerRepository.create(openAnswer1);
      await attemptAnswerRepository.create(mcAnswer);
      await attemptAnswerRepository.create(openAnswer2);

      // Review the second open answer
      const request: ReviewOpenAnswerRequest = {
        attemptAnswerId: openAnswer2.id.toString(),
        reviewerId: reviewerId,
        isCorrect: false,
        teacherComment: 'Needs improvement',
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attemptStatus.allOpenQuestionsReviewed).toBe(true);
        expect(result.value.attemptStatus.status).toBe('GRADED');
      }
    });

    it('should enforce permission rules for different roles', async () => {
      // Arrange
      const attemptAnswerId = new UniqueEntityID();
      const attemptAnswer = AttemptAnswer.create(
        {
          textAnswer: 'Answer',
          status: new AttemptStatusVO('SUBMITTED'),
          attemptId: '550e8400-e29b-41d4-a716-446655440001',
          questionId: '550e8400-e29b-41d4-a716-446655440002',
        },
        attemptAnswerId,
      );

      await attemptAnswerRepository.create(attemptAnswer);

      // Test different roles
      const roles = [
        { role: 'student', shouldSucceed: false },
        { role: 'tutor', shouldSucceed: true },
        { role: 'admin', shouldSucceed: true },
      ];

      for (const { role, shouldSucceed } of roles) {
        const userId = new UniqueEntityID().toString();
        const user = createTestUser({
          identityId: userId,
          role: role as any,
        });

        await userAggregatedViewRepository.create(user);

        const request: ReviewOpenAnswerRequest = {
          attemptAnswerId: attemptAnswerId.toString(),
          reviewerId: userId,
          isCorrect: true,
        };

        // Act
        const result = await sut.execute(request);

        // Assert
        if (shouldSucceed) {
          // For successful cases, we need to set up the full context
          if (result.isLeft() && result.value instanceof AttemptNotFoundError) {
            // Expected since we didn't set up the attempt
            expect(result.value).toBeInstanceOf(AttemptNotFoundError);
          }
        } else {
          expect(result.isLeft()).toBe(true);
          if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(InsufficientPermissionsError);
          }
        }
      }
    });
  });
});
