// src/domain/assessment/application/use-cases/review-open-answer.use-case.spec.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReviewOpenAnswerUseCase } from './review-open-answer.use-case';
import { InMemoryAttemptAnswerRepository } from '@/test/repositories/in-memory-attempt-answer-repository';
import { InMemoryAttemptRepository } from '@/test/repositories/in-memory-attempt-repository';
import { InMemoryQuestionRepository } from '@/test/repositories/in-memory-question-repository';
import { InMemoryAccountRepository } from '@/test/repositories/in-memory-account-repository';
import { IAttemptAnswerRepository } from '../repositories/i-attempt-answer-repository';
import { IAttemptRepository } from '../repositories/i-attempt.repository';
import { IQuestionRepository } from '../repositories/i-question-repository';
import { IAccountRepository } from '@/domain/auth/application/repositories/i-account-repository';
import { AttemptAnswer } from '@/domain/assessment/enterprise/entities/attempt-answer.entity';
import { Attempt } from '@/domain/assessment/enterprise/entities/attempt.entity';
import { Question } from '@/domain/assessment/enterprise/entities/question.entity';
import { User } from '@/domain/auth/enterprise/entities/user.entity';
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

let useCase: ReviewOpenAnswerUseCase;
let attemptAnswerRepository: InMemoryAttemptAnswerRepository;
let attemptRepository: InMemoryAttemptRepository;
let questionRepository: InMemoryQuestionRepository;
let accountRepository: InMemoryAccountRepository;

describe('ReviewOpenAnswerUseCase', () => {
  beforeEach(() => {
    attemptAnswerRepository = new InMemoryAttemptAnswerRepository();
    attemptRepository = new InMemoryAttemptRepository();
    questionRepository = new InMemoryQuestionRepository();
    accountRepository = new InMemoryAccountRepository();
    useCase = new ReviewOpenAnswerUseCase(
      attemptAnswerRepository,
      attemptRepository,
      questionRepository,
      accountRepository,
    );
  });

  describe('Success Cases', () => {
    it('should successfully review open answer as correct', async () => {
      // Arrange
      const attemptAnswerId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const attemptId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');
      const questionId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440002');
      const reviewerId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440003');

      const reviewer = User.create({
        name: 'Teacher Name',
        email: 'teacher@example.com',
        password: 'password123',
        cpf: '12345678901',
        role: 'tutor',
      }, reviewerId);

      const attempt = Attempt.create({
        status: new AttemptStatusVO('SUBMITTED'),
        startedAt: new Date(),
        submittedAt: new Date(),
        userId: '550e8400-e29b-41d4-a716-446655440004',
        assessmentId: '550e8400-e29b-41d4-a716-446655440005',
      }, attemptId);

      const question = Question.create({
        text: 'Explain the concept',
        type: new QuestionTypeVO('OPEN'),
        assessmentId: new UniqueEntityID('550e8400-e29b-41d4-a716-446655440005'),
        argumentId: new UniqueEntityID('550e8400-e29b-41d4-a716-446655440006'),
      }, questionId);

      const attemptAnswer = AttemptAnswer.create({
        textAnswer: 'This is my detailed explanation',
        status: new AttemptStatusVO('SUBMITTED'),
        attemptId: attemptId.toString(),
        questionId: questionId.toString(),
      }, attemptAnswerId);

      await accountRepository.create(reviewer);
      await attemptRepository.create(attempt);
      await questionRepository.create(question);
      await attemptAnswerRepository.create(attemptAnswer);

      const request: ReviewOpenAnswerRequest = {
        attemptAnswerId: attemptAnswerId.toString(),
        reviewerId: reviewerId.toString(),
        isCorrect: true,
        teacherComment: 'Excellent explanation!',
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attemptAnswer.id).toBe(attemptAnswerId.toString());
        expect(result.value.attemptAnswer.status).toBe('GRADED');
        expect(result.value.attemptAnswer.isCorrect).toBe(true);
        expect(result.value.attemptAnswer.teacherComment).toBe('Excellent explanation!');
        expect(result.value.attemptAnswer.textAnswer).toBe('This is my detailed explanation');
        expect(result.value.attemptStatus.allOpenQuestionsReviewed).toBe(true);
      }
    });

    it('should successfully review open answer as incorrect', async () => {
      // Arrange
      const attemptAnswerId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const attemptId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');
      const questionId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440002');
      const reviewerId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440003');

      const reviewer = User.create({
        name: 'Teacher Name',
        email: 'teacher@example.com',
        password: 'password123',
        cpf: '12345678901',
        role: 'admin',
      }, reviewerId);

      const attempt = Attempt.create({
        status: new AttemptStatusVO('SUBMITTED'),
        startedAt: new Date(),
        submittedAt: new Date(),
        userId: '550e8400-e29b-41d4-a716-446655440004',
        assessmentId: '550e8400-e29b-41d4-a716-446655440005',
      }, attemptId);

      const question = Question.create({
        text: 'Explain the concept',
        type: new QuestionTypeVO('OPEN'),
        assessmentId: new UniqueEntityID('550e8400-e29b-41d4-a716-446655440005'),
        argumentId: new UniqueEntityID('550e8400-e29b-41d4-a716-446655440006'),
      }, questionId);

      const attemptAnswer = AttemptAnswer.create({
        textAnswer: 'This is incorrect explanation',
        status: new AttemptStatusVO('SUBMITTED'),
        attemptId: attemptId.toString(),
        questionId: questionId.toString(),
      }, attemptAnswerId);

      await accountRepository.create(reviewer);
      await attemptRepository.create(attempt);
      await questionRepository.create(question);
      await attemptAnswerRepository.create(attemptAnswer);

      const request: ReviewOpenAnswerRequest = {
        attemptAnswerId: attemptAnswerId.toString(),
        reviewerId: reviewerId.toString(),
        isCorrect: false,
        teacherComment: 'Please review the concept and try again',
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attemptAnswer.isCorrect).toBe(false);
        expect(result.value.attemptAnswer.teacherComment).toBe('Please review the concept and try again');
      }
    });

    it('should review without teacher comment', async () => {
      // Arrange
      const attemptAnswerId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const attemptId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');
      const questionId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440002');
      const reviewerId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440003');

      const reviewer = User.create({
        name: 'Teacher Name',
        email: 'teacher@example.com',
        password: 'password123',
        cpf: '12345678901',
        role: 'tutor',
      }, reviewerId);

      const attempt = Attempt.create({
        status: new AttemptStatusVO('SUBMITTED'),
        startedAt: new Date(),
        submittedAt: new Date(),
        userId: '550e8400-e29b-41d4-a716-446655440004',
        assessmentId: '550e8400-e29b-41d4-a716-446655440005',
      }, attemptId);

      const question = Question.create({
        text: 'Explain the concept',
        type: new QuestionTypeVO('OPEN'),
        assessmentId: new UniqueEntityID('550e8400-e29b-41d4-a716-446655440005'),
        argumentId: new UniqueEntityID('550e8400-e29b-41d4-a716-446655440006'),
      }, questionId);

      const attemptAnswer = AttemptAnswer.create({
        textAnswer: 'Good explanation',
        status: new AttemptStatusVO('SUBMITTED'),
        attemptId: attemptId.toString(),
        questionId: questionId.toString(),
      }, attemptAnswerId);

      await accountRepository.create(reviewer);
      await attemptRepository.create(attempt);
      await questionRepository.create(question);
      await attemptAnswerRepository.create(attemptAnswer);

      const request: ReviewOpenAnswerRequest = {
        attemptAnswerId: attemptAnswerId.toString(),
        reviewerId: reviewerId.toString(),
        isCorrect: true,
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attemptAnswer.isCorrect).toBe(true);
        expect(result.value.attemptAnswer.teacherComment).toBeUndefined();
      }
    });
  });

  describe('Validation Errors', () => {
    it('should return InvalidInputError for empty attemptAnswerId', async () => {
      // Arrange
      const request: ReviewOpenAnswerRequest = {
        attemptAnswerId: '',
        reviewerId: '550e8400-e29b-41d4-a716-446655440003',
        isCorrect: true,
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
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
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
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
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
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
      const result = await useCase.execute(request);

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
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });
  });

  describe('Business Rule Validation Errors', () => {
    it('should return AttemptAnswerNotFoundError when attempt answer does not exist', async () => {
      // Arrange
      const request: ReviewOpenAnswerRequest = {
        attemptAnswerId: '550e8400-e29b-41d4-a716-446655440000',
        reviewerId: '550e8400-e29b-41d4-a716-446655440003',
        isCorrect: true,
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(AttemptAnswerNotFoundError);
      }
    });

    it('should return UserNotFoundError when reviewer does not exist', async () => {
      // Arrange
      const attemptAnswerId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');

      const attemptAnswer = AttemptAnswer.create({
        textAnswer: 'Some answer',
        status: new AttemptStatusVO('SUBMITTED'),
        attemptId: '550e8400-e29b-41d4-a716-446655440001',
        questionId: '550e8400-e29b-41d4-a716-446655440002',
      }, attemptAnswerId);

      await attemptAnswerRepository.create(attemptAnswer);

      const request: ReviewOpenAnswerRequest = {
        attemptAnswerId: attemptAnswerId.toString(),
        reviewerId: '550e8400-e29b-41d4-a716-446655440003',
        isCorrect: true,
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(UserNotFoundError);
      }
    });

    it('should return InsufficientPermissionsError for student user', async () => {
      // Arrange
      const attemptAnswerId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const reviewerId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440003');

      const student = User.create({
        name: 'Student Name',
        email: 'student@example.com',
        password: 'password123',
        cpf: '12345678901',
        role: 'student',
      }, reviewerId);

      const attemptAnswer = AttemptAnswer.create({
        textAnswer: 'Some answer',
        status: new AttemptStatusVO('SUBMITTED'),
        attemptId: '550e8400-e29b-41d4-a716-446655440001',
        questionId: '550e8400-e29b-41d4-a716-446655440002',
      }, attemptAnswerId);

      await accountRepository.create(student);
      await attemptAnswerRepository.create(attemptAnswer);

      const request: ReviewOpenAnswerRequest = {
        attemptAnswerId: attemptAnswerId.toString(),
        reviewerId: reviewerId.toString(),
        isCorrect: true,
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InsufficientPermissionsError);
      }
    });

    it('should return AttemptNotFoundError when attempt does not exist', async () => {
      // Arrange
      const attemptAnswerId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const reviewerId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440003');

      const reviewer = User.create({
        name: 'Teacher Name',
        email: 'teacher@example.com',
        password: 'password123',
        cpf: '12345678901',
        role: 'tutor',
      }, reviewerId);

      const attemptAnswer = AttemptAnswer.create({
        textAnswer: 'Some answer',
        status: new AttemptStatusVO('SUBMITTED'),
        attemptId: '550e8400-e29b-41d4-a716-446655440001',
        questionId: '550e8400-e29b-41d4-a716-446655440002',
      }, attemptAnswerId);

      await accountRepository.create(reviewer);
      await attemptAnswerRepository.create(attemptAnswer);

      const request: ReviewOpenAnswerRequest = {
        attemptAnswerId: attemptAnswerId.toString(),
        reviewerId: reviewerId.toString(),
        isCorrect: true,
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(AttemptNotFoundError);
      }
    });

    it('should return AnswerNotReviewableError when attempt is not submitted', async () => {
      // Arrange
      const attemptAnswerId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const attemptId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');
      const reviewerId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440003');

      const reviewer = User.create({
        name: 'Teacher Name',
        email: 'teacher@example.com',
        password: 'password123',
        cpf: '12345678901',
        role: 'tutor',
      }, reviewerId);

      const attempt = Attempt.create({
        status: new AttemptStatusVO('IN_PROGRESS'), // Not submitted
        startedAt: new Date(),
        userId: '550e8400-e29b-41d4-a716-446655440004',
        assessmentId: '550e8400-e29b-41d4-a716-446655440005',
      }, attemptId);

      const attemptAnswer = AttemptAnswer.create({
        textAnswer: 'Some answer',
        status: new AttemptStatusVO('SUBMITTED'),
        attemptId: attemptId.toString(),
        questionId: '550e8400-e29b-41d4-a716-446655440002',
      }, attemptAnswerId);

      await accountRepository.create(reviewer);
      await attemptRepository.create(attempt);
      await attemptAnswerRepository.create(attemptAnswer);

      const request: ReviewOpenAnswerRequest = {
        attemptAnswerId: attemptAnswerId.toString(),
        reviewerId: reviewerId.toString(),
        isCorrect: true,
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(AnswerNotReviewableError);
      }
    });

    it('should return QuestionNotFoundError when question does not exist', async () => {
      // Arrange
      const attemptAnswerId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const attemptId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');
      const reviewerId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440003');

      const reviewer = User.create({
        name: 'Teacher Name',
        email: 'teacher@example.com',
        password: 'password123',
        cpf: '12345678901',
        role: 'tutor',
      }, reviewerId);

      const attempt = Attempt.create({
        status: new AttemptStatusVO('SUBMITTED'),
        startedAt: new Date(),
        submittedAt: new Date(),
        userId: '550e8400-e29b-41d4-a716-446655440004',
        assessmentId: '550e8400-e29b-41d4-a716-446655440005',
      }, attemptId);

      const attemptAnswer = AttemptAnswer.create({
        textAnswer: 'Some answer',
        status: new AttemptStatusVO('SUBMITTED'),
        attemptId: attemptId.toString(),
        questionId: '550e8400-e29b-41d4-a716-446655440002', // Non-existent question
      }, attemptAnswerId);

      await accountRepository.create(reviewer);
      await attemptRepository.create(attempt);
      await attemptAnswerRepository.create(attemptAnswer);

      const request: ReviewOpenAnswerRequest = {
        attemptAnswerId: attemptAnswerId.toString(),
        reviewerId: reviewerId.toString(),
        isCorrect: true,
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(QuestionNotFoundError);
      }
    });

    it('should return AnswerNotReviewableError for multiple choice question', async () => {
      // Arrange
      const attemptAnswerId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const attemptId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');
      const questionId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440002');
      const reviewerId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440003');

      const reviewer = User.create({
        name: 'Teacher Name',
        email: 'teacher@example.com',
        password: 'password123',
        cpf: '12345678901',
        role: 'tutor',
      }, reviewerId);

      const attempt = Attempt.create({
        status: new AttemptStatusVO('SUBMITTED'),
        startedAt: new Date(),
        submittedAt: new Date(),
        userId: '550e8400-e29b-41d4-a716-446655440004',
        assessmentId: '550e8400-e29b-41d4-a716-446655440005',
      }, attemptId);

      const question = Question.create({
        text: 'Multiple choice question',
        type: new QuestionTypeVO('MULTIPLE_CHOICE'), // Not open
        assessmentId: new UniqueEntityID('550e8400-e29b-41d4-a716-446655440005'),
        argumentId: new UniqueEntityID('550e8400-e29b-41d4-a716-446655440006'),
      }, questionId);

      const attemptAnswer = AttemptAnswer.create({
        selectedOptionId: 'some-option-id',
        status: new AttemptStatusVO('SUBMITTED'),
        attemptId: attemptId.toString(),
        questionId: questionId.toString(),
      }, attemptAnswerId);

      await accountRepository.create(reviewer);
      await attemptRepository.create(attempt);
      await questionRepository.create(question);
      await attemptAnswerRepository.create(attemptAnswer);

      const request: ReviewOpenAnswerRequest = {
        attemptAnswerId: attemptAnswerId.toString(),
        reviewerId: reviewerId.toString(),
        isCorrect: true,
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(AnswerNotReviewableError);
      }
    });

    it('should return AnswerNotReviewableError when answer has no text', async () => {
      // Arrange
      const attemptAnswerId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const attemptId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');
      const questionId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440002');
      const reviewerId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440003');

      const reviewer = User.create({
        name: 'Teacher Name',
        email: 'teacher@example.com',
        password: 'password123',
        cpf: '12345678901',
        role: 'tutor',
      }, reviewerId);

      const attempt = Attempt.create({
        status: new AttemptStatusVO('SUBMITTED'),
        startedAt: new Date(),
        submittedAt: new Date(),
        userId: '550e8400-e29b-41d4-a716-446655440004',
        assessmentId: '550e8400-e29b-41d4-a716-446655440005',
      }, attemptId);

      const question = Question.create({
        text: 'Open question',
        type: new QuestionTypeVO('OPEN'),
        assessmentId: new UniqueEntityID('550e8400-e29b-41d4-a716-446655440005'),
        argumentId: new UniqueEntityID('550e8400-e29b-41d4-a716-446655440006'),
      }, questionId);

      const attemptAnswer = AttemptAnswer.create({
        // No textAnswer provided
        status: new AttemptStatusVO('SUBMITTED'),
        attemptId: attemptId.toString(),
        questionId: questionId.toString(),
      }, attemptAnswerId);

      await accountRepository.create(reviewer);
      await attemptRepository.create(attempt);
      await questionRepository.create(question);
      await attemptAnswerRepository.create(attemptAnswer);

      const request: ReviewOpenAnswerRequest = {
        attemptAnswerId: attemptAnswerId.toString(),
        reviewerId: reviewerId.toString(),
        isCorrect: true,
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(AnswerNotReviewableError);
      }
    });
  });

  describe('Repository Errors', () => {
    it('should return RepositoryError when attempt answer update fails', async () => {
      // Arrange
      const attemptAnswerId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const attemptId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');
      const questionId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440002');
      const reviewerId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440003');

      const reviewer = User.create({
        name: 'Teacher Name',
        email: 'teacher@example.com',
        password: 'password123',
        cpf: '12345678901',
        role: 'tutor',
      }, reviewerId);

      const attempt = Attempt.create({
        status: new AttemptStatusVO('SUBMITTED'),
        startedAt: new Date(),
        submittedAt: new Date(),
        userId: '550e8400-e29b-41d4-a716-446655440004',
        assessmentId: '550e8400-e29b-41d4-a716-446655440005',
      }, attemptId);

      const question = Question.create({
        text: 'Open question',
        type: new QuestionTypeVO('OPEN'),
        assessmentId: new UniqueEntityID('550e8400-e29b-41d4-a716-446655440005'),
        argumentId: new UniqueEntityID('550e8400-e29b-41d4-a716-446655440006'),
      }, questionId);

      const attemptAnswer = AttemptAnswer.create({
        textAnswer: 'Some answer',
        status: new AttemptStatusVO('SUBMITTED'),
        attemptId: attemptId.toString(),
        questionId: questionId.toString(),
      }, attemptAnswerId);

      await accountRepository.create(reviewer);
      await attemptRepository.create(attempt);
      await questionRepository.create(question);
      await attemptAnswerRepository.create(attemptAnswer);

      // Mock repository failure
      const mockAttemptAnswerRepository = {
        findById: vi.fn().mockResolvedValue({
          isLeft: () => false,
          isRight: () => true,
          value: attemptAnswer,
        }),
        update: vi.fn().mockResolvedValue({
          isLeft: () => true,
          isRight: () => false,
          value: new Error('Database error'),
        }),
      } as Partial<IAttemptAnswerRepository>;

      const useCase = new ReviewOpenAnswerUseCase(
        mockAttemptAnswerRepository as IAttemptAnswerRepository,
        attemptRepository,
        questionRepository,
        accountRepository,
      );

      const request: ReviewOpenAnswerRequest = {
        attemptAnswerId: attemptAnswerId.toString(),
        reviewerId: reviewerId.toString(),
        isCorrect: true,
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe('Failed to update attempt answer');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple open questions with partial review completion', async () => {
      // Arrange
      const attemptAnswerId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const attemptId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');
      const questionId1 = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440002');
      const questionId2 = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440007');
      const reviewerId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440003');

      const reviewer = User.create({
        name: 'Teacher Name',
        email: 'teacher@example.com',
        password: 'password123',
        cpf: '12345678901',
        role: 'tutor',
      }, reviewerId);

      const attempt = Attempt.create({
        status: new AttemptStatusVO('SUBMITTED'),
        startedAt: new Date(),
        submittedAt: new Date(),
        userId: '550e8400-e29b-41d4-a716-446655440004',
        assessmentId: '550e8400-e29b-41d4-a716-446655440005',
      }, attemptId);

      const question1 = Question.create({
        text: 'First open question',
        type: new QuestionTypeVO('OPEN'),
        assessmentId: new UniqueEntityID('550e8400-e29b-41d4-a716-446655440005'),
        argumentId: new UniqueEntityID('550e8400-e29b-41d4-a716-446655440006'),
      }, questionId1);

      const question2 = Question.create({
        text: 'Second open question',
        type: new QuestionTypeVO('OPEN'),
        assessmentId: new UniqueEntityID('550e8400-e29b-41d4-a716-446655440005'),
        argumentId: new UniqueEntityID('550e8400-e29b-41d4-a716-446655440006'),
      }, questionId2);

      const attemptAnswer1 = AttemptAnswer.create({
        textAnswer: 'First answer',
        status: new AttemptStatusVO('SUBMITTED'),
        attemptId: attemptId.toString(),
        questionId: questionId1.toString(),
      }, attemptAnswerId);

      const attemptAnswer2 = AttemptAnswer.create({
        textAnswer: 'Second answer',
        status: new AttemptStatusVO('SUBMITTED'), // Not yet graded
        attemptId: attemptId.toString(),
        questionId: questionId2.toString(),
      });

      await accountRepository.create(reviewer);
      await attemptRepository.create(attempt);
      await questionRepository.create(question1);
      await questionRepository.create(question2);
      await attemptAnswerRepository.create(attemptAnswer1);
      await attemptAnswerRepository.create(attemptAnswer2);

      const request: ReviewOpenAnswerRequest = {
        attemptAnswerId: attemptAnswerId.toString(),
        reviewerId: reviewerId.toString(),
        isCorrect: true,
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attemptStatus.allOpenQuestionsReviewed).toBe(false); // Still has ungraded question
        expect(result.value.attemptStatus.status).toBe('SUBMITTED'); // Should remain submitted
      }
    });

    it('should handle long teacher comment at max length', async () => {
      // Arrange
      const attemptAnswerId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const attemptId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');
      const questionId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440002');
      const reviewerId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440003');

      const reviewer = User.create({
        name: 'Teacher Name',
        email: 'teacher@example.com',
        password: 'password123',
        cpf: '12345678901',
        role: 'tutor',
      }, reviewerId);

      const attempt = Attempt.create({
        status: new AttemptStatusVO('SUBMITTED'),
        startedAt: new Date(),
        submittedAt: new Date(),
        userId: '550e8400-e29b-41d4-a716-446655440004',
        assessmentId: '550e8400-e29b-41d4-a716-446655440005',
      }, attemptId);

      const question = Question.create({
        text: 'Open question',
        type: new QuestionTypeVO('OPEN'),
        assessmentId: new UniqueEntityID('550e8400-e29b-41d4-a716-446655440005'),
        argumentId: new UniqueEntityID('550e8400-e29b-41d4-a716-446655440006'),
      }, questionId);

      const attemptAnswer = AttemptAnswer.create({
        textAnswer: 'Some answer',
        status: new AttemptStatusVO('SUBMITTED'),
        attemptId: attemptId.toString(),
        questionId: questionId.toString(),
      }, attemptAnswerId);

      await accountRepository.create(reviewer);
      await attemptRepository.create(attempt);
      await questionRepository.create(question);
      await attemptAnswerRepository.create(attemptAnswer);

      const longComment = 'a'.repeat(1000); // Max length
      const request: ReviewOpenAnswerRequest = {
        attemptAnswerId: attemptAnswerId.toString(),
        reviewerId: reviewerId.toString(),
        isCorrect: false,
        teacherComment: longComment,
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attemptAnswer.teacherComment).toBe(longComment);
      }
    });
  });
});