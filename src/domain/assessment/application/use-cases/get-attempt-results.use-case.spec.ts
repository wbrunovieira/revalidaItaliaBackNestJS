// src/domain/assessment/application/use-cases/get-attempt-results.use-case.spec.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetAttemptResultsUseCase } from './get-attempt-results.use-case';
import { InMemoryAttemptRepository } from '@/test/repositories/in-memory-attempt-repository';
import { InMemoryAttemptAnswerRepository } from '@/test/repositories/in-memory-attempt-answer-repository';
import { InMemoryAssessmentRepository } from '@/test/repositories/in-memory-assessment-repository';
import { InMemoryQuestionRepository } from '@/test/repositories/in-memory-question-repository';
import { InMemoryArgumentRepository } from '@/test/repositories/in-memory-argument-repository';
import { InMemoryAnswerRepository } from '@/test/repositories/in-memory-answer-repository';
import { InMemoryUserAggregatedViewRepository } from '@/test/repositories/in-memory-user-aggregated-view-repository';
import { IAttemptRepository } from '../repositories/i-attempt.repository';
import { IAttemptAnswerRepository } from '../repositories/i-attempt-answer-repository';
import { IAssessmentRepository } from '../repositories/i-assessment-repository';
import { IQuestionRepository } from '../repositories/i-question-repository';
import { IArgumentRepository } from '../repositories/i-argument-repository';
import { IAnswerRepository } from '../repositories/i-answer.repository';
import { IUserAggregatedViewRepository } from '@/domain/auth/application/repositories/i-user-aggregated-view-repository';
import { Attempt } from '@/domain/assessment/enterprise/entities/attempt.entity';
import { AttemptAnswer } from '@/domain/assessment/enterprise/entities/attempt-answer.entity';
import { Assessment } from '@/domain/assessment/enterprise/entities/assessment.entity';
import { Question } from '@/domain/assessment/enterprise/entities/question.entity';
import { Argument } from '@/domain/assessment/enterprise/entities/argument.entity';
import { Answer } from '@/domain/assessment/enterprise/entities/answer.entity';
import { AttemptStatusVO } from '@/domain/assessment/enterprise/value-objects/attempt-status.vo';
import { QuestionTypeVO } from '@/domain/assessment/enterprise/value-objects/question-type.vo';
import { ScoreVO } from '@/domain/assessment/enterprise/value-objects/score.vo';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { GetAttemptResultsRequest } from '../dtos/get-attempt-results-request.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { AttemptNotFoundError } from './errors/attempt-not-found-error';
import { AttemptNotFinalizedError } from './errors/attempt-not-finalized-error';
import { UserNotFoundError } from './errors/user-not-found-error';
import { InsufficientPermissionsError } from './errors/insufficient-permissions-error';
import { AssessmentNotFoundError } from './errors/assessment-not-found-error';
import { RepositoryError } from './errors/repository-error';
import { UserAggregatedView } from '@/domain/auth/application/repositories/i-user-aggregated-view-repository';
import { left, right } from '@/core/either';

describe('GetAttemptResultsUseCase', () => {
  let attemptRepository: InMemoryAttemptRepository;
  let attemptAnswerRepository: InMemoryAttemptAnswerRepository;
  let assessmentRepository: InMemoryAssessmentRepository;
  let questionRepository: InMemoryQuestionRepository;
  let argumentRepository: InMemoryArgumentRepository;
  let answerRepository: InMemoryAnswerRepository;
  let userAggregatedViewRepository: InMemoryUserAggregatedViewRepository;
  let sut: GetAttemptResultsUseCase;

  const now = new Date();

  beforeEach(() => {
    attemptRepository = new InMemoryAttemptRepository();
    attemptAnswerRepository = new InMemoryAttemptAnswerRepository();
    assessmentRepository = new InMemoryAssessmentRepository();
    questionRepository = new InMemoryQuestionRepository();
    argumentRepository = new InMemoryArgumentRepository();
    answerRepository = new InMemoryAnswerRepository();
    userAggregatedViewRepository = new InMemoryUserAggregatedViewRepository();
    
    sut = new GetAttemptResultsUseCase(
      attemptRepository,
      attemptAnswerRepository,
      assessmentRepository,
      questionRepository,
      argumentRepository,
      answerRepository,
      userAggregatedViewRepository,
    );
  });

  const createTestUser = (overrides: Partial<UserAggregatedView> = {}): UserAggregatedView => {
    return {
      identityId: '550e8400-e29b-41d4-a716-446655440002',
      email: 'student@example.com',
      emailVerified: true,
      lastLogin: now,
      profileId: 'profile-123',
      fullName: 'Test Student',
      nationalId: '12345678901',
      phone: null,
      birthDate: new Date('1990-01-01'),
      profileImageUrl: null,
      bio: null,
      profession: null,
      specialization: null,
      preferredLanguage: 'pt',
      timezone: 'America/Sao_Paulo',
      authorizationId: 'auth-123',
      role: 'student',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
  };

  // Success Cases
  describe('Success Cases', () => {
    it('should successfully get results for quiz assessment', async () => {
      // Arrange
      const attemptId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const assessmentId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');
      const userId = '550e8400-e29b-41d4-a716-446655440002';
      const questionId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440003');
      const answerId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440004');

      const user = createTestUser({ identityId: userId });
      userAggregatedViewRepository.items.push(user);

      const assessment = Assessment.create({
        slug: 'test-quiz',
        title: 'Test Quiz',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      }, assessmentId);

      const attempt = Attempt.create({
        status: new AttemptStatusVO('GRADED'),
        score: new ScoreVO(85),
        startedAt: new Date('2024-01-01T10:00:00Z'),
        submittedAt: new Date('2024-01-01T10:30:00Z'),
        gradedAt: new Date('2024-01-01T10:31:00Z'),
        identityId: userId,
        assessmentId: assessmentId.toString(),
      }, attemptId);

      const question = Question.create({
        text: 'What is 2 + 2?',
        type: new QuestionTypeVO('MULTIPLE_CHOICE'),
        assessmentId: assessmentId,
      }, questionId);

      const correctAnswer = Answer.create({
        explanation: 'Basic arithmetic',
        questionId: questionId,
        correctOptionId: answerId,
        translations: [],
      }, answerId);

      const attemptAnswer = AttemptAnswer.create({
        selectedOptionId: answerId.toString(),
        status: new AttemptStatusVO('GRADED'),
        isCorrect: true,
        attemptId: attemptId.toString(),
        questionId: questionId.toString(),
      });

      await assessmentRepository.create(assessment);
      await attemptRepository.create(attempt);
      await questionRepository.create(question);
      await answerRepository.create(correctAnswer);
      await attemptAnswerRepository.create(attemptAnswer);

      const request: GetAttemptResultsRequest = {
        attemptId: attemptId.toString(),
        requesterId: userId,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);

      if (result.isRight()) {
        const response = result.value;

        expect(response.attempt.id).toBe(attemptId.toString());
        expect(response.attempt.status).toBe('GRADED');
        expect(response.attempt.score).toBe(85);

        expect(response.assessment.id).toBe(assessmentId.toString());
        expect(response.assessment.type).toBe('QUIZ');
        expect(response.assessment.title).toBe('Test Quiz');

        expect(response.results.totalQuestions).toBe(1);
        expect(response.results.answeredQuestions).toBe(1);
        expect(response.results.correctAnswers).toBe(1);
        expect(response.results.scorePercentage).toBe(100);
        expect(response.results.passed).toBe(true);
        expect(response.results.timeSpent).toBe(30);

        expect(response.answers).toHaveLength(1);
        expect(response.answers[0].questionId).toBe(questionId.toString());
        expect(response.answers[0].questionType).toBe('MULTIPLE_CHOICE');
        expect(response.answers[0].isCorrect).toBe(true);
        expect(response.answers[0].selectedOptionId).toBe(answerId.toString());
      }
    });

    it('should successfully get results for simulado assessment with arguments', async () => {
      // Arrange
      const attemptId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const assessmentId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');
      const userId = '550e8400-e29b-41d4-a716-446655440002';
      const argumentId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440003');
      const questionId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440004');
      const optionId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440005');

      const user = createTestUser({ identityId: userId });
      userAggregatedViewRepository.items.push(user);

      const assessment = Assessment.create({
        slug: 'test-simulado',
        title: 'Test Simulado',
        type: 'SIMULADO',
        passingScore: 70,
        timeLimitInMinutes: 120,
        randomizeQuestions: false,
        randomizeOptions: false,
      }, assessmentId);

      const argument = Argument.create({
        title: 'Mathematics',
        assessmentId: assessmentId,
      }, argumentId);

      const attempt = Attempt.create({
        status: new AttemptStatusVO('GRADED'),
        score: new ScoreVO(75),
        startedAt: new Date('2024-01-01T10:00:00Z'),
        submittedAt: new Date('2024-01-01T11:00:00Z'),
        gradedAt: new Date('2024-01-01T11:01:00Z'),
        identityId: userId,
        assessmentId: assessmentId.toString(),
      }, attemptId);

      const question = Question.create({
        text: 'What is 5 + 5?',
        type: new QuestionTypeVO('MULTIPLE_CHOICE'),
        assessmentId: assessmentId,
        argumentId: argumentId,
      }, questionId);

      const correctAnswer = Answer.create({
        explanation: 'Basic addition',
        questionId: questionId,
        correctOptionId: optionId,
        translations: [],
      });

      const attemptAnswer = AttemptAnswer.create({
        selectedOptionId: optionId.toString(),
        status: new AttemptStatusVO('GRADED'),
        isCorrect: true,
        attemptId: attemptId.toString(),
        questionId: questionId.toString(),
      });

      await assessmentRepository.create(assessment);
      await argumentRepository.create(argument);
      await attemptRepository.create(attempt);
      await questionRepository.create(question);
      await answerRepository.create(correctAnswer);
      await attemptAnswerRepository.create(attemptAnswer);

      const request: GetAttemptResultsRequest = {
        attemptId: attemptId.toString(),
        requesterId: userId,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);

      if (result.isRight()) {
        const response = result.value;

        expect(response.assessment.type).toBe('SIMULADO');
        expect(response.results.argumentResults).toHaveLength(1);
        expect(response.results.argumentResults![0].argumentId).toBe(argumentId.toString());
        expect(response.results.argumentResults![0].argumentTitle).toBe('Mathematics');
        expect(response.results.argumentResults![0].totalQuestions).toBe(1);
        expect(response.results.argumentResults![0].correctAnswers).toBe(1);
        expect(response.results.argumentResults![0].scorePercentage).toBe(100);

        expect(response.answers[0].argumentId).toBe(argumentId.toString());
        expect(response.answers[0].argumentTitle).toBe('Mathematics');
      }
    });

    it('should successfully get results for prova aberta with pending review', async () => {
      // Arrange
      const attemptId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const assessmentId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');
      const userId = '550e8400-e29b-41d4-a716-446655440002';
      const questionId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440003');

      const user = createTestUser({ identityId: userId });
      userAggregatedViewRepository.items.push(user);

      const assessment = Assessment.create({
        slug: 'test-prova-aberta',
        title: 'Test Prova Aberta',
        type: 'PROVA_ABERTA',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      }, assessmentId);

      const attempt = Attempt.create({
        status: new AttemptStatusVO('SUBMITTED'),
        startedAt: new Date('2024-01-01T10:00:00Z'),
        submittedAt: new Date('2024-01-01T11:00:00Z'),
        identityId: userId,
        assessmentId: assessmentId.toString(),
      }, attemptId);

      const question = Question.create({
        text: 'Explain the concept of clean architecture',
        type: new QuestionTypeVO('OPEN'),
        assessmentId: assessmentId,
      }, questionId);

      const attemptAnswer = AttemptAnswer.create({
        textAnswer: 'Clean architecture is a software design philosophy...',
        status: new AttemptStatusVO('SUBMITTED'),
        attemptId: attemptId.toString(),
        questionId: questionId.toString(),
      });

      await assessmentRepository.create(assessment);
      await attemptRepository.create(attempt);
      await questionRepository.create(question);
      await attemptAnswerRepository.create(attemptAnswer);

      const request: GetAttemptResultsRequest = {
        attemptId: attemptId.toString(),
        requesterId: userId,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);

      if (result.isRight()) {
        const response = result.value;

        expect(response.assessment.type).toBe('PROVA_ABERTA');
        expect(response.results.totalQuestions).toBe(1);
        expect(response.results.answeredQuestions).toBe(1);
        expect(response.results.reviewedQuestions).toBe(0);
        expect(response.results.pendingReview).toBe(1);
        expect(response.results.correctAnswers).toBeUndefined();
        expect(response.results.scorePercentage).toBeUndefined();
        expect(response.results.passed).toBeUndefined();

        expect(response.answers[0].questionType).toBe('OPEN');
        expect(response.answers[0].textAnswer).toBe('Clean architecture is a software design philosophy...');
        expect(response.answers[0].status).toBe('SUBMITTED');
      }
    });

    it('should allow tutor to view any student attempt', async () => {
      // Arrange
      const attemptId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const assessmentId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');
      const studentId = '550e8400-e29b-41d4-a716-446655440002';
      const tutorId = '550e8400-e29b-41d4-a716-446655440003';

      const tutor = createTestUser({
        identityId: tutorId,
        email: 'tutor@example.com',
        fullName: 'Test Tutor',
        nationalId: '12345678902',
        role: 'tutor',
      });
      userAggregatedViewRepository.items.push(tutor);

      const assessment = Assessment.create({
        slug: 'test-quiz',
        title: 'Test Quiz',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      }, assessmentId);

      const attempt = Attempt.create({
        status: new AttemptStatusVO('GRADED'),
        score: new ScoreVO(85),
        startedAt: new Date(),
        submittedAt: new Date(),
        gradedAt: new Date(),
        identityId: studentId,
        assessmentId: assessmentId.toString(),
      }, attemptId);

      await assessmentRepository.create(assessment);
      await attemptRepository.create(attempt);

      const request: GetAttemptResultsRequest = {
        attemptId: attemptId.toString(),
        requesterId: tutorId,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
    });

    it('should allow admin to view any student attempt', async () => {
      // Arrange
      const attemptId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const assessmentId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');
      const studentId = '550e8400-e29b-41d4-a716-446655440002';
      const adminId = '550e8400-e29b-41d4-a716-446655440003';

      const admin = createTestUser({
        identityId: adminId,
        email: 'admin@example.com',
        fullName: 'Test Admin',
        nationalId: '12345678903',
        role: 'admin',
      });
      userAggregatedViewRepository.items.push(admin);

      const assessment = Assessment.create({
        slug: 'test-quiz',
        title: 'Test Quiz',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      }, assessmentId);

      const attempt = Attempt.create({
        status: new AttemptStatusVO('GRADED'),
        score: new ScoreVO(90),
        startedAt: new Date(),
        submittedAt: new Date(),
        gradedAt: new Date(),
        identityId: studentId,
        assessmentId: assessmentId.toString(),
      }, attemptId);

      await assessmentRepository.create(assessment);
      await attemptRepository.create(attempt);

      const request: GetAttemptResultsRequest = {
        attemptId: attemptId.toString(),
        requesterId: adminId,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
    });
  });

  // Validation Errors
  describe('Validation Errors', () => {
    it('should return InvalidInputError for invalid attempt ID', async () => {
      // Arrange
      const request: GetAttemptResultsRequest = {
        attemptId: 'invalid-uuid',
        requesterId: '550e8400-e29b-41d4-a716-446655440000',
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('should return InvalidInputError for invalid requester ID', async () => {
      // Arrange
      const request: GetAttemptResultsRequest = {
        attemptId: '550e8400-e29b-41d4-a716-446655440000',
        requesterId: 'invalid-uuid',
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('should return InvalidInputError for missing attempt ID', async () => {
      // Arrange
      const request = {
        attemptId: '',
        requesterId: '550e8400-e29b-41d4-a716-446655440000',
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('should return InvalidInputError for missing requester ID', async () => {
      // Arrange
      const request = {
        attemptId: '550e8400-e29b-41d4-a716-446655440000',
        requesterId: '',
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
    it('should return AttemptNotFoundError when attempt does not exist', async () => {
      // Arrange
      const userId = '550e8400-e29b-41d4-a716-446655440000';

      const user = createTestUser({ identityId: userId });
      userAggregatedViewRepository.items.push(user);

      const request: GetAttemptResultsRequest = {
        attemptId: '550e8400-e29b-41d4-a716-446655440001',
        requesterId: userId,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(AttemptNotFoundError);
    });

    it('should return AttemptNotFinalizedError for attempt in progress', async () => {
      // Arrange
      const attemptId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const userId = '550e8400-e29b-41d4-a716-446655440001';

      const user = createTestUser({ identityId: userId });
      userAggregatedViewRepository.items.push(user);

      const attempt = Attempt.create({
        status: new AttemptStatusVO('IN_PROGRESS'),
        startedAt: new Date(),
        identityId: userId,
        assessmentId: '550e8400-e29b-41d4-a716-446655440002',
      }, attemptId);

      await attemptRepository.create(attempt);

      const request: GetAttemptResultsRequest = {
        attemptId: attemptId.toString(),
        requesterId: userId,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(AttemptNotFinalizedError);
    });

    it('should return UserNotFoundError when requester does not exist', async () => {
      // Arrange
      const attemptId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const assessmentId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440002');

      // Create assessment first
      const assessment = Assessment.create({
        title: 'Test Assessment',
        description: 'Test Description',
        type: 'QUIZ',
        moduleId: '550e8400-e29b-41d4-a716-446655440010',
        isActive: true,
        timeLimitInMinutes: 60,
        passingScore: 70,
        createdBy: '550e8400-e29b-41d4-a716-446655440011',
      }, assessmentId);
      
      await assessmentRepository.create(assessment);

      const attempt = Attempt.create({
        status: new AttemptStatusVO('SUBMITTED'),
        startedAt: new Date(),
        submittedAt: new Date(),
        identityId: '550e8400-e29b-41d4-a716-446655440001',
        assessmentId: assessmentId.toString(),
      }, attemptId);

      await attemptRepository.create(attempt);

      const request: GetAttemptResultsRequest = {
        attemptId: attemptId.toString(),
        requesterId: '550e8400-e29b-41d4-a716-446655440003',
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(UserNotFoundError);
    });

    it('should return InsufficientPermissionsError when student tries to view other student attempt', async () => {
      // Arrange
      const attemptId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const studentId = '550e8400-e29b-41d4-a716-446655440001';
      const otherStudentId = '550e8400-e29b-41d4-a716-446655440002';

      const student = createTestUser({
        identityId: studentId,
        email: 'student@example.com',
        role: 'student',
      });
      userAggregatedViewRepository.items.push(student);

      const attempt = Attempt.create({
        status: new AttemptStatusVO('SUBMITTED'),
        startedAt: new Date(),
        submittedAt: new Date(),
        identityId: otherStudentId,
        assessmentId: '550e8400-e29b-41d4-a716-446655440003',
      }, attemptId);

      await attemptRepository.create(attempt);

      const request: GetAttemptResultsRequest = {
        attemptId: attemptId.toString(),
        requesterId: studentId,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InsufficientPermissionsError);
    });

    it('should return AssessmentNotFoundError when assessment does not exist', async () => {
      // Arrange
      const attemptId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const userId = '550e8400-e29b-41d4-a716-446655440001';

      const user = createTestUser({ identityId: userId });
      userAggregatedViewRepository.items.push(user);

      const attempt = Attempt.create({
        status: new AttemptStatusVO('SUBMITTED'),
        startedAt: new Date(),
        submittedAt: new Date(),
        identityId: userId,
        assessmentId: '550e8400-e29b-41d4-a716-446655440002',
      }, attemptId);

      await attemptRepository.create(attempt);

      const request: GetAttemptResultsRequest = {
        attemptId: attemptId.toString(),
        requesterId: userId,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(AssessmentNotFoundError);
    });
  });

  // Repository Errors
  describe('Repository Errors', () => {
    it('should return RepositoryError when attempt repository fails', async () => {
      // Arrange
      const request: GetAttemptResultsRequest = {
        attemptId: '550e8400-e29b-41d4-a716-446655440000',
        requesterId: '550e8400-e29b-41d4-a716-446655440001',
      };

      // Mock repository failure
      vi.spyOn(attemptRepository, 'findById').mockResolvedValue(left(new Error('Database error')));

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(AttemptNotFoundError);
    });

    it('should return RepositoryError when user repository fails', async () => {
      // Arrange
      const attemptId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');

      const attempt = Attempt.create({
        status: new AttemptStatusVO('SUBMITTED'),
        startedAt: new Date(),
        submittedAt: new Date(),
        identityId: '550e8400-e29b-41d4-a716-446655440001',
        assessmentId: '550e8400-e29b-41d4-a716-446655440002',
      }, attemptId);

      await attemptRepository.create(attempt);

      // Mock repository failure
      vi.spyOn(userAggregatedViewRepository, 'findByIdentityId').mockResolvedValue(left(new Error('Database error')));

      const request: GetAttemptResultsRequest = {
        attemptId: attemptId.toString(),
        requesterId: '550e8400-e29b-41d4-a716-446655440001',
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(UserNotFoundError);
    });

    it('should return RepositoryError when attempt answers repository fails', async () => {
      // Arrange
      const attemptId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const assessmentId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');
      const userId = '550e8400-e29b-41d4-a716-446655440002';

      const user = createTestUser({ identityId: userId });
      userAggregatedViewRepository.items.push(user);

      const assessment = Assessment.create({
        slug: 'test-quiz',
        title: 'Test Quiz',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      }, assessmentId);

      const attempt = Attempt.create({
        status: new AttemptStatusVO('SUBMITTED'),
        startedAt: new Date(),
        submittedAt: new Date(),
        identityId: userId,
        assessmentId: assessmentId.toString(),
      }, attemptId);

      await assessmentRepository.create(assessment);
      await attemptRepository.create(attempt);

      // Mock repository failure
      vi.spyOn(attemptAnswerRepository, 'findByAttemptId').mockResolvedValue(left(new Error('Database error')));

      const request: GetAttemptResultsRequest = {
        attemptId: attemptId.toString(),
        requesterId: userId,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(RepositoryError);
    });

    it('should return RepositoryError when questions repository fails', async () => {
      // Arrange
      const attemptId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const assessmentId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');
      const userId = '550e8400-e29b-41d4-a716-446655440002';

      const user = createTestUser({ identityId: userId });
      userAggregatedViewRepository.items.push(user);

      const assessment = Assessment.create({
        slug: 'test-quiz',
        title: 'Test Quiz',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      }, assessmentId);

      const attempt = Attempt.create({
        status: new AttemptStatusVO('SUBMITTED'),
        startedAt: new Date(),
        submittedAt: new Date(),
        identityId: userId,
        assessmentId: assessmentId.toString(),
      }, attemptId);

      await assessmentRepository.create(assessment);
      await attemptRepository.create(attempt);
      await attemptAnswerRepository.create(
        AttemptAnswer.create({
          status: new AttemptStatusVO('SUBMITTED'),
          attemptId: attemptId.toString(),
          questionId: '550e8400-e29b-41d4-a716-446655440003',
        }),
      );

      // Mock repository failure
      vi.spyOn(questionRepository, 'findByAssessmentId').mockResolvedValue(left(new Error('Database error')));

      const request: GetAttemptResultsRequest = {
        attemptId: attemptId.toString(),
        requesterId: userId,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(RepositoryError);
    });

    it('should return RepositoryError when correct answers repository fails', async () => {
      // Arrange
      const attemptId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const assessmentId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');
      const userId = '550e8400-e29b-41d4-a716-446655440002';
      const questionId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440003');

      const user = createTestUser({ identityId: userId });
      userAggregatedViewRepository.items.push(user);

      const assessment = Assessment.create({
        slug: 'test-quiz',
        title: 'Test Quiz',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      }, assessmentId);

      const attempt = Attempt.create({
        status: new AttemptStatusVO('SUBMITTED'),
        startedAt: new Date(),
        submittedAt: new Date(),
        identityId: userId,
        assessmentId: assessmentId.toString(),
      }, attemptId);

      const question = Question.create({
        text: 'Test question',
        type: new QuestionTypeVO('MULTIPLE_CHOICE'),
        assessmentId: assessmentId,
      }, questionId);

      await assessmentRepository.create(assessment);
      await attemptRepository.create(attempt);
      await questionRepository.create(question);
      await attemptAnswerRepository.create(
        AttemptAnswer.create({
          status: new AttemptStatusVO('SUBMITTED'),
          attemptId: attemptId.toString(),
          questionId: questionId.toString(),
        }),
      );

      // Mock repository failure
      vi.spyOn(answerRepository, 'findManyByQuestionIds').mockResolvedValue(left(new Error('Database error')));

      const request: GetAttemptResultsRequest = {
        attemptId: attemptId.toString(),
        requesterId: userId,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(RepositoryError);
    });

    it('should handle unexpected errors gracefully', async () => {
      // Arrange
      const request: GetAttemptResultsRequest = {
        attemptId: '550e8400-e29b-41d4-a716-446655440000',
        requesterId: '550e8400-e29b-41d4-a716-446655440001',
      };

      // Mock unexpected error
      vi.spyOn(attemptRepository, 'findById').mockRejectedValue(new Error('Unexpected error'));

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(RepositoryError);
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('should handle attempt with no answers', async () => {
      // Arrange
      const attemptId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const assessmentId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');
      const userId = '550e8400-e29b-41d4-a716-446655440002';

      const user = createTestUser({ identityId: userId });
      userAggregatedViewRepository.items.push(user);

      const assessment = Assessment.create({
        slug: 'test-quiz',
        title: 'Test Quiz',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      }, assessmentId);

      const attempt = Attempt.create({
        status: new AttemptStatusVO('SUBMITTED'),
        startedAt: new Date(),
        submittedAt: new Date(),
        identityId: userId,
        assessmentId: assessmentId.toString(),
      }, attemptId);

      await assessmentRepository.create(assessment);
      await attemptRepository.create(attempt);

      const request: GetAttemptResultsRequest = {
        attemptId: attemptId.toString(),
        requesterId: userId,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);

      if (result.isRight()) {
        const response = result.value;
        expect(response.results.totalQuestions).toBe(0);
        expect(response.results.answeredQuestions).toBe(0);
        expect(response.answers).toHaveLength(0);
      }
    });

    it('should handle attempt with multiple questions and partial answers', async () => {
      // Arrange
      const attemptId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const assessmentId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');
      const userId = '550e8400-e29b-41d4-a716-446655440002';
      const question1Id = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440003');
      const question2Id = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440004');
      const question3Id = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440005');

      const user = createTestUser({ identityId: userId });
      userAggregatedViewRepository.items.push(user);

      const assessment = Assessment.create({
        slug: 'test-quiz',
        title: 'Test Quiz',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      }, assessmentId);

      const attempt = Attempt.create({
        status: new AttemptStatusVO('SUBMITTED'),
        startedAt: new Date(),
        submittedAt: new Date(),
        identityId: userId,
        assessmentId: assessmentId.toString(),
      }, attemptId);

      // Create 3 questions
      const question1 = Question.create({
        text: 'Question 1',
        type: new QuestionTypeVO('MULTIPLE_CHOICE'),
        assessmentId: assessmentId,
      }, question1Id);

      const question2 = Question.create({
        text: 'Question 2',
        type: new QuestionTypeVO('MULTIPLE_CHOICE'),
        assessmentId: assessmentId,
      }, question2Id);

      const question3 = Question.create({
        text: 'Question 3',
        type: new QuestionTypeVO('OPEN'),
        assessmentId: assessmentId,
      }, question3Id);

      // Create answers for only 2 questions
      const attemptAnswer1 = AttemptAnswer.create({
        selectedOptionId: 'option-1',
        status: new AttemptStatusVO('SUBMITTED'),
        attemptId: attemptId.toString(),
        questionId: question1Id.toString(),
      });

      const attemptAnswer3 = AttemptAnswer.create({
        textAnswer: 'Open answer text',
        status: new AttemptStatusVO('SUBMITTED'),
        attemptId: attemptId.toString(),
        questionId: question3Id.toString(),
      });

      await assessmentRepository.create(assessment);
      await attemptRepository.create(attempt);
      await questionRepository.create(question1);
      await questionRepository.create(question2);
      await questionRepository.create(question3);
      await attemptAnswerRepository.create(attemptAnswer1);
      await attemptAnswerRepository.create(attemptAnswer3);

      const request: GetAttemptResultsRequest = {
        attemptId: attemptId.toString(),
        requesterId: userId,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);

      if (result.isRight()) {
        const response = result.value;
        expect(response.results.totalQuestions).toBe(3);
        expect(response.results.answeredQuestions).toBe(2);
        expect(response.answers).toHaveLength(2);
      }
    });

    it('should handle attempt with time limit expiration', async () => {
      // Arrange
      const attemptId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const assessmentId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');
      const userId = '550e8400-e29b-41d4-a716-446655440002';

      const user = createTestUser({ identityId: userId });
      userAggregatedViewRepository.items.push(user);

      const assessment = Assessment.create({
        slug: 'test-quiz',
        title: 'Test Quiz',
        type: 'QUIZ',
        passingScore: 70,
        timeLimitInMinutes: 60,
        randomizeQuestions: false,
        randomizeOptions: false,
      }, assessmentId);

      const startedAt = new Date('2024-01-01T10:00:00Z');
      const timeLimitExpiresAt = new Date('2024-01-01T11:00:00Z');

      const attempt = Attempt.create({
        status: new AttemptStatusVO('SUBMITTED'),
        startedAt: startedAt,
        submittedAt: new Date('2024-01-01T11:30:00Z'), // Submitted after time limit
        timeLimitExpiresAt: timeLimitExpiresAt,
        identityId: userId,
        assessmentId: assessmentId.toString(),
      }, attemptId);

      await assessmentRepository.create(assessment);
      await attemptRepository.create(attempt);

      const request: GetAttemptResultsRequest = {
        attemptId: attemptId.toString(),
        requesterId: userId,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);

      if (result.isRight()) {
        const response = result.value;
        expect(response.attempt.timeLimitExpiresAt).toEqual(timeLimitExpiresAt);
      }
    });

    it('should handle null values correctly in user aggregated view', async () => {
      // Arrange
      const attemptId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const assessmentId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');
      const userId = '550e8400-e29b-41d4-a716-446655440002';

      const user = createTestUser({
        identityId: userId,
        phone: null,
        birthDate: null,
        profileImageUrl: null,
        bio: null,
        profession: null,
        specialization: null,
        lastLogin: null,
        lockedUntil: null,
      });
      userAggregatedViewRepository.items.push(user);

      const assessment = Assessment.create({
        slug: 'test-quiz',
        title: 'Test Quiz',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      }, assessmentId);

      const attempt = Attempt.create({
        status: new AttemptStatusVO('SUBMITTED'),
        startedAt: new Date(),
        submittedAt: new Date(),
        identityId: userId,
        assessmentId: assessmentId.toString(),
      }, attemptId);

      await assessmentRepository.create(assessment);
      await attemptRepository.create(attempt);

      const request: GetAttemptResultsRequest = {
        attemptId: attemptId.toString(),
        requesterId: userId,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
    });
  });

  // Performance Tests
  describe('Performance Tests', () => {
    it('should handle large number of questions efficiently', async () => {
      // Arrange
      const attemptId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const assessmentId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');
      const userId = '550e8400-e29b-41d4-a716-446655440002';

      const user = createTestUser({ identityId: userId });
      userAggregatedViewRepository.items.push(user);

      const assessment = Assessment.create({
        slug: 'test-quiz',
        title: 'Test Quiz',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      }, assessmentId);

      const attempt = Attempt.create({
        status: new AttemptStatusVO('SUBMITTED'),
        startedAt: new Date(),
        submittedAt: new Date(),
        identityId: userId,
        assessmentId: assessmentId.toString(),
      }, attemptId);

      await assessmentRepository.create(assessment);
      await attemptRepository.create(attempt);

      // Create 100 questions and answers
      for (let i = 0; i < 100; i++) {
        const questionId = new UniqueEntityID();
        const question = Question.create({
          text: `Question ${i + 1}`,
          type: new QuestionTypeVO('MULTIPLE_CHOICE'),
          assessmentId: assessmentId,
        }, questionId);

        const attemptAnswer = AttemptAnswer.create({
          selectedOptionId: `option-${i}`,
          status: new AttemptStatusVO('SUBMITTED'),
          attemptId: attemptId.toString(),
          questionId: questionId.toString(),
        });

        await questionRepository.create(question);
        await attemptAnswerRepository.create(attemptAnswer);
      }

      const request: GetAttemptResultsRequest = {
        attemptId: attemptId.toString(),
        requesterId: userId,
      };

      const start = Date.now();

      // Act
      const result = await sut.execute(request);

      const duration = Date.now() - start;

      // Assert
      expect(result.isRight()).toBe(true);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second

      if (result.isRight()) {
        const response = result.value;
        expect(response.results.totalQuestions).toBe(100);
        expect(response.results.answeredQuestions).toBe(100);
        expect(response.answers).toHaveLength(100);
      }
    });
  });

  // Business Rules
  describe('Business Rules', () => {
    it('should calculate score correctly for mixed correct and incorrect answers', async () => {
      // Arrange
      const attemptId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const assessmentId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');
      const userId = '550e8400-e29b-41d4-a716-446655440002';

      const user = createTestUser({ identityId: userId });
      userAggregatedViewRepository.items.push(user);

      const assessment = Assessment.create({
        slug: 'test-quiz',
        title: 'Test Quiz',
        type: 'QUIZ',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      }, assessmentId);

      const attempt = Attempt.create({
        status: new AttemptStatusVO('GRADED'),
        score: new ScoreVO(50), // 2 out of 4 correct = 50%
        startedAt: new Date(),
        submittedAt: new Date(),
        gradedAt: new Date(),
        identityId: userId,
        assessmentId: assessmentId.toString(),
      }, attemptId);

      await assessmentRepository.create(assessment);
      await attemptRepository.create(attempt);

      // Create 4 questions with 2 correct and 2 incorrect answers
      for (let i = 0; i < 4; i++) {
        const questionId = new UniqueEntityID();
        const question = Question.create({
          text: `Question ${i + 1}`,
          type: new QuestionTypeVO('MULTIPLE_CHOICE'),
          assessmentId: assessmentId,
        }, questionId);

        const correctOptionId = new UniqueEntityID();
        const correctAnswer = Answer.create({
          explanation: 'Correct',
          questionId: questionId,
          correctOptionId: correctOptionId,
          translations: [],
        });

        const attemptAnswer = AttemptAnswer.create({
          selectedOptionId: i < 2 ? correctOptionId.toString() : 'wrong-option',
          status: new AttemptStatusVO('GRADED'),
          isCorrect: i < 2,
          attemptId: attemptId.toString(),
          questionId: questionId.toString(),
        });

        await questionRepository.create(question);
        await answerRepository.create(correctAnswer);
        await attemptAnswerRepository.create(attemptAnswer);
      }

      const request: GetAttemptResultsRequest = {
        attemptId: attemptId.toString(),
        requesterId: userId,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);

      if (result.isRight()) {
        const response = result.value;
        expect(response.results.totalQuestions).toBe(4);
        expect(response.results.correctAnswers).toBe(2);
        expect(response.results.scorePercentage).toBe(50);
        expect(response.results.passed).toBe(false); // 50% < 70%
      }
    });

    it('should handle simulado with multiple arguments correctly', async () => {
      // Arrange
      const attemptId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const assessmentId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');
      const userId = '550e8400-e29b-41d4-a716-446655440002';
      const mathArgumentId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440003');
      const scienceArgumentId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440004');

      const user = createTestUser({ identityId: userId });
      userAggregatedViewRepository.items.push(user);

      const assessment = Assessment.create({
        slug: 'test-simulado',
        title: 'Test Simulado',
        type: 'SIMULADO',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      }, assessmentId);

      const mathArgument = Argument.create({
        title: 'Mathematics',
        assessmentId: assessmentId,
      }, mathArgumentId);

      const scienceArgument = Argument.create({
        title: 'Science',
        assessmentId: assessmentId,
      }, scienceArgumentId);

      const attempt = Attempt.create({
        status: new AttemptStatusVO('GRADED'),
        score: new ScoreVO(75),
        startedAt: new Date(),
        submittedAt: new Date(),
        gradedAt: new Date(),
        identityId: userId,
        assessmentId: assessmentId.toString(),
      }, attemptId);

      await assessmentRepository.create(assessment);
      await argumentRepository.create(mathArgument);
      await argumentRepository.create(scienceArgument);
      await attemptRepository.create(attempt);

      // Create 2 math questions (1 correct, 1 incorrect) and 2 science questions (2 correct)
      const mathQuestion1 = Question.create({
        text: 'Math Question 1',
        type: new QuestionTypeVO('MULTIPLE_CHOICE'),
        assessmentId: assessmentId,
        argumentId: mathArgumentId,
      });

      const mathQuestion2 = Question.create({
        text: 'Math Question 2',
        type: new QuestionTypeVO('MULTIPLE_CHOICE'),
        assessmentId: assessmentId,
        argumentId: mathArgumentId,
      });

      const scienceQuestion1 = Question.create({
        text: 'Science Question 1',
        type: new QuestionTypeVO('MULTIPLE_CHOICE'),
        assessmentId: assessmentId,
        argumentId: scienceArgumentId,
      });

      const scienceQuestion2 = Question.create({
        text: 'Science Question 2',
        type: new QuestionTypeVO('MULTIPLE_CHOICE'),
        assessmentId: assessmentId,
        argumentId: scienceArgumentId,
      });

      await questionRepository.create(mathQuestion1);
      await questionRepository.create(mathQuestion2);
      await questionRepository.create(scienceQuestion1);
      await questionRepository.create(scienceQuestion2);

      // Create answers
      const mathAnswer1 = Answer.create({
        explanation: 'Math explanation 1',
        questionId: mathQuestion1.id,
        correctOptionId: new UniqueEntityID('math-correct-1'),
        translations: [],
      });

      const mathAnswer2 = Answer.create({
        explanation: 'Math explanation 2',
        questionId: mathQuestion2.id,
        correctOptionId: new UniqueEntityID('math-correct-2'),
        translations: [],
      });

      const scienceAnswer1 = Answer.create({
        explanation: 'Science explanation 1',
        questionId: scienceQuestion1.id,
        correctOptionId: new UniqueEntityID('science-correct-1'),
        translations: [],
      });

      const scienceAnswer2 = Answer.create({
        explanation: 'Science explanation 2',
        questionId: scienceQuestion2.id,
        correctOptionId: new UniqueEntityID('science-correct-2'),
        translations: [],
      });

      await answerRepository.create(mathAnswer1);
      await answerRepository.create(mathAnswer2);
      await answerRepository.create(scienceAnswer1);
      await answerRepository.create(scienceAnswer2);

      // Create attempt answers
      await attemptAnswerRepository.create(AttemptAnswer.create({
        selectedOptionId: 'math-correct-1',
        status: new AttemptStatusVO('GRADED'),
        isCorrect: true,
        attemptId: attemptId.toString(),
        questionId: mathQuestion1.id.toString(),
      }));

      await attemptAnswerRepository.create(AttemptAnswer.create({
        selectedOptionId: 'wrong-option',
        status: new AttemptStatusVO('GRADED'),
        isCorrect: false,
        attemptId: attemptId.toString(),
        questionId: mathQuestion2.id.toString(),
      }));

      await attemptAnswerRepository.create(AttemptAnswer.create({
        selectedOptionId: 'science-correct-1',
        status: new AttemptStatusVO('GRADED'),
        isCorrect: true,
        attemptId: attemptId.toString(),
        questionId: scienceQuestion1.id.toString(),
      }));

      await attemptAnswerRepository.create(AttemptAnswer.create({
        selectedOptionId: 'science-correct-2',
        status: new AttemptStatusVO('GRADED'),
        isCorrect: true,
        attemptId: attemptId.toString(),
        questionId: scienceQuestion2.id.toString(),
      }));

      const request: GetAttemptResultsRequest = {
        attemptId: attemptId.toString(),
        requesterId: userId,
      };

      // Act
      const result = await sut.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);

      if (result.isRight()) {
        const response = result.value;
        expect(response.assessment.type).toBe('SIMULADO');
        expect(response.results.argumentResults).toHaveLength(2);

        const mathResult = response.results.argumentResults!.find(r => r.argumentId === mathArgumentId.toString());
        const scienceResult = response.results.argumentResults!.find(r => r.argumentId === scienceArgumentId.toString());

        expect(mathResult).toBeDefined();
        expect(mathResult!.argumentTitle).toBe('Mathematics');
        expect(mathResult!.totalQuestions).toBe(2);
        expect(mathResult!.correctAnswers).toBe(1);
        expect(mathResult!.scorePercentage).toBe(50);

        expect(scienceResult).toBeDefined();
        expect(scienceResult!.argumentTitle).toBe('Science');
        expect(scienceResult!.totalQuestions).toBe(2);
        expect(scienceResult!.correctAnswers).toBe(2);
        expect(scienceResult!.scorePercentage).toBe(100);
      }
    });
  });
});