// src/domain/assessment/application/use-cases/list-pending-reviews.use-case.spec.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { ListPendingReviewsUseCase } from './list-pending-reviews.use-case';
import { InMemoryAttemptAnswerRepository } from '@/test/repositories/in-memory-attempt-answer-repository';
import { InMemoryAttemptRepository } from '@/test/repositories/in-memory-attempt-repository';
import { InMemoryAssessmentRepository } from '@/test/repositories/in-memory-assessment-repository';
import { InMemoryQuestionRepository } from '@/test/repositories/in-memory-question-repository';
import { InMemoryAccountRepository } from '@/test/repositories/in-memory-account-repository';
import { AttemptAnswer } from '@/domain/assessment/enterprise/entities/attempt-answer.entity';
import { Attempt } from '@/domain/assessment/enterprise/entities/attempt.entity';
import { Assessment } from '@/domain/assessment/enterprise/entities/assessment.entity';
import { Question } from '@/domain/assessment/enterprise/entities/question.entity';
import { User } from '@/domain/auth/enterprise/entities/user.entity';
import { AttemptStatusVO } from '@/domain/assessment/enterprise/value-objects/attempt-status.vo';
import { QuestionTypeVO } from '@/domain/assessment/enterprise/value-objects/question-type.vo';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { ListPendingReviewsRequest } from '../dtos/list-pending-reviews-request.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { UserNotFoundError } from './errors/user-not-found-error';
import { InsufficientPermissionsError } from './errors/insufficient-permissions-error';

let useCase: ListPendingReviewsUseCase;
let attemptAnswerRepository: InMemoryAttemptAnswerRepository;
let attemptRepository: InMemoryAttemptRepository;
let assessmentRepository: InMemoryAssessmentRepository;
let questionRepository: InMemoryQuestionRepository;
let accountRepository: InMemoryAccountRepository;

describe('ListPendingReviewsUseCase', () => {
  beforeEach(() => {
    attemptAnswerRepository = new InMemoryAttemptAnswerRepository();
    attemptRepository = new InMemoryAttemptRepository();
    assessmentRepository = new InMemoryAssessmentRepository();
    questionRepository = new InMemoryQuestionRepository();
    accountRepository = new InMemoryAccountRepository();

    useCase = new ListPendingReviewsUseCase(
      attemptAnswerRepository,
      attemptRepository,
      assessmentRepository,
      questionRepository,
      accountRepository,
    );
  });

  it('should list pending reviews successfully for tutor', async () => {
    // Arrange
    const tutorUser = User.create({
      name: 'Tutor User',
      email: 'tutor@example.com',
      password: 'password123',
      cpf: '123.456.789-00',
      role: 'tutor',
    }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440010'));

    const studentUser = User.create({
      name: 'Student User',
      email: 'student@example.com',
      password: 'password123',
      cpf: '987.654.321-00',
      role: 'student',
    }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440020'));

    const assessment = Assessment.create({
      slug: 'prova-aberta',
      title: 'Prova Aberta Test',
      type: 'PROVA_ABERTA',
    }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440030'));

    const question = Question.create({
      text: 'What is your opinion?',
      type: new QuestionTypeVO('OPEN'),
      assessmentId: new UniqueEntityID('550e8400-e29b-41d4-a716-446655440030'),
    }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440050'));

    const attempt = Attempt.create({
      status: new AttemptStatusVO('SUBMITTED'),
      startedAt: new Date('2024-01-01T10:00:00Z'),
      submittedAt: new Date('2024-01-01T11:00:00Z'),
      userId: '550e8400-e29b-41d4-a716-446655440020',
      assessmentId: '550e8400-e29b-41d4-a716-446655440030',
    }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440040'));

    const attemptAnswer = AttemptAnswer.create({
      textAnswer: 'This is my answer',
      status: new AttemptStatusVO('SUBMITTED'),
      attemptId: '550e8400-e29b-41d4-a716-446655440040',
      questionId: '550e8400-e29b-41d4-a716-446655440050',
    }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440060'));

    await accountRepository.create(tutorUser);
    await accountRepository.create(studentUser);
    await assessmentRepository.create(assessment);
    await questionRepository.create(question);
    await attemptRepository.create(attempt);
    await attemptAnswerRepository.create(attemptAnswer);

    const request: ListPendingReviewsRequest = {
      requesterId: '550e8400-e29b-41d4-a716-446655440010',
    };

    // Act
    const result = await useCase.execute(request);

    // Assert
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const response = result.value;
      expect(response.attempts).toHaveLength(1);
      expect(response.attempts[0].id).toBe('550e8400-e29b-41d4-a716-446655440040');
      expect(response.attempts[0].status).toBe('SUBMITTED');
      expect(response.attempts[0].assessment.type).toBe('PROVA_ABERTA');
      expect(response.attempts[0].student.name).toBe('Student User');
      expect(response.attempts[0].pendingAnswers).toBe(1);
      expect(response.attempts[0].totalOpenQuestions).toBe(1);
    }
  });

  it('should not include quiz or simulado assessments', async () => {
    // Arrange
    const tutorUser = User.create({
      name: 'Tutor User',
      email: 'tutor@example.com',
      password: 'password123',
      cpf: '123.456.789-00',
      role: 'tutor',
    }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440010'));

    const studentUser = User.create({
      name: 'Student User',
      email: 'student@example.com',
      password: 'password123',
      cpf: '987.654.321-00',
      role: 'student',
    }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440020'));

    const quizAssessment = Assessment.create({
      slug: 'quiz-test',
      title: 'Quiz Test',
      type: 'QUIZ',
    }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440031'));

    const quizAttempt = Attempt.create({
      status: new AttemptStatusVO('SUBMITTED'),
      startedAt: new Date('2024-01-01T10:00:00Z'),
      submittedAt: new Date('2024-01-01T11:00:00Z'),
      userId: '550e8400-e29b-41d4-a716-446655440020',
      assessmentId: '550e8400-e29b-41d4-a716-446655440031',
    }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440041'));

    await accountRepository.create(tutorUser);
    await accountRepository.create(studentUser);
    await assessmentRepository.create(quizAssessment);
    await attemptRepository.create(quizAttempt);

    const request: ListPendingReviewsRequest = {
      requesterId: '550e8400-e29b-41d4-a716-446655440010',
    };

    // Act
    const result = await useCase.execute(request);

    // Assert
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const response = result.value;
      expect(response.attempts).toHaveLength(0); // Quiz should not appear in pending reviews
    }
  });

  it('should not include in-progress attempts', async () => {
    // Arrange
    const tutorUser = User.create({
      name: 'Tutor User',
      email: 'tutor@example.com',
      password: 'password123',
      cpf: '123.456.789-00',
      role: 'tutor',
    }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440010'));

    const studentUser = User.create({
      name: 'Student User',
      email: 'student@example.com',
      password: 'password123',
      cpf: '987.654.321-00',
      role: 'student',
    }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440020'));

    const assessment = Assessment.create({
      slug: 'prova-aberta',
      title: 'Prova Aberta Test',
      type: 'PROVA_ABERTA',
    }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440030'));

    const inProgressAttempt = Attempt.create({
      status: new AttemptStatusVO('IN_PROGRESS'), // Not submitted yet
      startedAt: new Date('2024-01-01T10:00:00Z'),
      userId: '550e8400-e29b-41d4-a716-446655440020',
      assessmentId: '550e8400-e29b-41d4-a716-446655440030',
    }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440040'));

    await accountRepository.create(tutorUser);
    await accountRepository.create(studentUser);
    await assessmentRepository.create(assessment);
    await attemptRepository.create(inProgressAttempt);

    const request: ListPendingReviewsRequest = {
      requesterId: '550e8400-e29b-41d4-a716-446655440010',
    };

    // Act
    const result = await useCase.execute(request);

    // Assert
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const response = result.value;
      expect(response.attempts).toHaveLength(0); // In-progress attempts should not appear
    }
  });

  it('should return error for student trying to access pending reviews', async () => {
    // Arrange
    const studentUser = User.create({
      name: 'Student User',
      email: 'student@example.com',
      password: 'password123',
      cpf: '987.654.321-00',
      role: 'student',
    }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440020'));

    await accountRepository.create(studentUser);

    const request: ListPendingReviewsRequest = {
      requesterId: '550e8400-e29b-41d4-a716-446655440020',
    };

    // Act
    const result = await useCase.execute(request);

    // Assert
    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InsufficientPermissionsError);
  });

  it('should return error for invalid input', async () => {
    // Arrange
    const request = {
      requesterId: 'invalid-id', // Not a valid UUID
    } as ListPendingReviewsRequest;

    // Act
    const result = await useCase.execute(request);

    // Assert
    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidInputError);
  });

  it('should return error for non-existent requester', async () => {
    // Arrange
    const request: ListPendingReviewsRequest = {
      requesterId: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID but non-existent
    };

    // Act
    const result = await useCase.execute(request);

    // Assert
    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(UserNotFoundError);
  });

  it('should return empty list when no pending reviews', async () => {
    // Arrange
    const tutorUser = User.create({
      name: 'Tutor User',
      email: 'tutor@example.com',
      password: 'password123',
      cpf: '123.456.789-00',
      role: 'tutor',
    }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440010'));

    await accountRepository.create(tutorUser);

    const request: ListPendingReviewsRequest = {
      requesterId: '550e8400-e29b-41d4-a716-446655440010',
    };

    // Act
    const result = await useCase.execute(request);

    // Assert
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const response = result.value;
      expect(response.attempts).toHaveLength(0);
      expect(response.pagination.total).toBe(0);
    }
  });

  it('should sort attempts by submittedAt (oldest first)', async () => {
    // Arrange
    const tutorUser = User.create({
      name: 'Tutor User',
      email: 'tutor@example.com',
      password: 'password123',
      cpf: '123.456.789-00',
      role: 'tutor',
    }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440010'));

    const studentUser = User.create({
      name: 'Student User',
      email: 'student@example.com',
      password: 'password123',
      cpf: '987.654.321-00',
      role: 'student',
    }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440020'));

    const assessment = Assessment.create({
      slug: 'prova-aberta',
      title: 'Prova Aberta Test',
      type: 'PROVA_ABERTA',
    }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440030'));

    const question = Question.create({
      text: 'What is your opinion?',
      type: new QuestionTypeVO('OPEN'),
      assessmentId: new UniqueEntityID('550e8400-e29b-41d4-a716-446655440030'),
    }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440050'));

    // Create two attempts with different submission times
    const olderAttempt = Attempt.create({
      status: new AttemptStatusVO('SUBMITTED'),
      startedAt: new Date('2024-01-01T10:00:00Z'),
      submittedAt: new Date('2024-01-01T11:00:00Z'), // Older
      userId: '550e8400-e29b-41d4-a716-446655440020',
      assessmentId: '550e8400-e29b-41d4-a716-446655440030',
    }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440040'));

    const newerAttempt = Attempt.create({
      status: new AttemptStatusVO('SUBMITTED'),
      startedAt: new Date('2024-01-01T12:00:00Z'),
      submittedAt: new Date('2024-01-01T13:00:00Z'), // Newer
      userId: '550e8400-e29b-41d4-a716-446655440020',
      assessmentId: '550e8400-e29b-41d4-a716-446655440030',
    }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440041'));

    const olderAnswer = AttemptAnswer.create({
      textAnswer: 'Older answer',
      status: new AttemptStatusVO('SUBMITTED'),
      attemptId: '550e8400-e29b-41d4-a716-446655440040',
      questionId: '550e8400-e29b-41d4-a716-446655440050',
    }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440060'));

    const newerAnswer = AttemptAnswer.create({
      textAnswer: 'Newer answer',
      status: new AttemptStatusVO('SUBMITTED'),
      attemptId: '550e8400-e29b-41d4-a716-446655440041',
      questionId: '550e8400-e29b-41d4-a716-446655440050',
    }, new UniqueEntityID('550e8400-e29b-41d4-a716-446655440061'));

    await accountRepository.create(tutorUser);
    await accountRepository.create(studentUser);
    await assessmentRepository.create(assessment);
    await questionRepository.create(question);
    await attemptRepository.create(newerAttempt); // Add newer first
    await attemptRepository.create(olderAttempt); // Add older second
    await attemptAnswerRepository.create(newerAnswer);
    await attemptAnswerRepository.create(olderAnswer);

    const request: ListPendingReviewsRequest = {
      requesterId: '550e8400-e29b-41d4-a716-446655440010',
    };

    // Act
    const result = await useCase.execute(request);

    // Assert
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const response = result.value;
      expect(response.attempts).toHaveLength(2);
      // Older attempt should be first (priority for review)
      expect(response.attempts[0].id).toBe('550e8400-e29b-41d4-a716-446655440040');
      expect(response.attempts[1].id).toBe('550e8400-e29b-41d4-a716-446655440041');
    }
  });
});