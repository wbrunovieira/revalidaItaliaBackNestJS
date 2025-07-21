// src/domain/assessment/application/use-cases/get-attempt-results.use-case.spec.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetAttemptResultsUseCase } from './get-attempt-results.use-case';
import { InMemoryAttemptRepository } from '@/test/repositories/in-memory-attempt-repository';
import { InMemoryAttemptAnswerRepository } from '@/test/repositories/in-memory-attempt-answer-repository';
import { InMemoryAssessmentRepository } from '@/test/repositories/in-memory-assessment-repository';
import { InMemoryQuestionRepository } from '@/test/repositories/in-memory-question-repository';
import { InMemoryArgumentRepository } from '@/test/repositories/in-memory-argument-repository';
import { InMemoryAnswerRepository } from '@/test/repositories/in-memory-answer-repository';
import { InMemoryAccountRepository } from '@/test/repositories/in-memory-account-repository';
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
// TODO: Update tests to use new separated entities (UserIdentity, UserProfile, UserAuthorization)
// import { User } from '@/domain/auth/enterprise/entities/user.entity';
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

let useCase: GetAttemptResultsUseCase;
let attemptRepository: InMemoryAttemptRepository;
let attemptAnswerRepository: InMemoryAttemptAnswerRepository;
let assessmentRepository: InMemoryAssessmentRepository;
let questionRepository: InMemoryQuestionRepository;
let argumentRepository: InMemoryArgumentRepository;
let answerRepository: InMemoryAnswerRepository;
let accountRepository: InMemoryAccountRepository;

describe('GetAttemptResultsUseCase', () => {
  beforeEach(() => {
    attemptRepository = new InMemoryAttemptRepository();
    attemptAnswerRepository = new InMemoryAttemptAnswerRepository();
    assessmentRepository = new InMemoryAssessmentRepository();
    questionRepository = new InMemoryQuestionRepository();
    argumentRepository = new InMemoryArgumentRepository();
    answerRepository = new InMemoryAnswerRepository();
    accountRepository = new InMemoryAccountRepository();
    useCase = new GetAttemptResultsUseCase(
      attemptRepository,
      attemptAnswerRepository,
      assessmentRepository,
      questionRepository,
      argumentRepository,
      answerRepository,
      accountRepository,
    );
  });

  describe('Success Cases', () => {
    it('should successfully get results for quiz assessment', async () => {
      // Arrange
      const attemptId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440000',
      );
      const assessmentId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440001',
      );
      const userId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440002');
      const questionId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440003',
      );
      const answerId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440004',
      );

      const user = User.create(
        {
          name: 'Test Student',
          email: 'student@example.com',
          password: 'password123',
          cpf: '12345678901',
          role: 'student',
        },
        userId,
      );

      const assessment = Assessment.create(
        {
          slug: 'test-quiz',
          title: 'Test Quiz',
          type: 'QUIZ',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
        },
        assessmentId,
      );

      const attempt = Attempt.create(
        {
          status: new AttemptStatusVO('GRADED'),
          score: new ScoreVO(85),
          startedAt: new Date('2024-01-01T10:00:00Z'),
          submittedAt: new Date('2024-01-01T10:30:00Z'),
          gradedAt: new Date('2024-01-01T10:31:00Z'),
          userId: userId.toString(),
          assessmentId: assessmentId.toString(),
        },
        attemptId,
      );

      const question = Question.create(
        {
          text: 'What is 2 + 2?',
          type: new QuestionTypeVO('MULTIPLE_CHOICE'),
          assessmentId: assessmentId,
        },
        questionId,
      );

      const correctAnswer = Answer.create(
        {
          explanation: 'Basic arithmetic',
          questionId: questionId,
          translations: [],
        },
        answerId,
      );

      const attemptAnswer = AttemptAnswer.create({
        selectedOptionId: answerId.toString(),
        status: new AttemptStatusVO('GRADED'),
        isCorrect: true,
        attemptId: attemptId.toString(),
        questionId: questionId.toString(),
      });

      await accountRepository.create(user);
      await assessmentRepository.create(assessment);
      await attemptRepository.create(attempt);
      await questionRepository.create(question);
      await answerRepository.create(correctAnswer);
      await attemptAnswerRepository.create(attemptAnswer);

      const request: GetAttemptResultsRequest = {
        attemptId: attemptId.toString(),
        requesterId: userId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

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
      const attemptId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440000',
      );
      const assessmentId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440001',
      );
      const userId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440002');
      const argumentId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440003',
      );
      const questionId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440004',
      );

      const user = User.create(
        {
          name: 'Test Student',
          email: 'student@example.com',
          password: 'password123',
          cpf: '12345678901',
          role: 'student',
        },
        userId,
      );

      const assessment = Assessment.create(
        {
          slug: 'test-simulado',
          title: 'Test Simulado',
          type: 'SIMULADO',
          passingScore: 70,
          timeLimitInMinutes: 120,
          randomizeQuestions: false,
          randomizeOptions: false,
        },
        assessmentId,
      );

      const argument = Argument.create(
        {
          title: 'Mathematics',
          assessmentId: assessmentId,
        },
        argumentId,
      );

      const attempt = Attempt.create(
        {
          status: new AttemptStatusVO('GRADED'),
          score: new ScoreVO(75),
          startedAt: new Date('2024-01-01T10:00:00Z'),
          submittedAt: new Date('2024-01-01T11:00:00Z'),
          gradedAt: new Date('2024-01-01T11:01:00Z'),
          userId: userId.toString(),
          assessmentId: assessmentId.toString(),
        },
        attemptId,
      );

      const question = Question.create(
        {
          text: 'What is 5 + 5?',
          type: new QuestionTypeVO('MULTIPLE_CHOICE'),
          assessmentId: assessmentId,
          argumentId: argumentId,
        },
        questionId,
      );

      const attemptAnswer = AttemptAnswer.create({
        selectedOptionId: '550e8400-e29b-41d4-a716-446655440005',
        status: new AttemptStatusVO('GRADED'),
        isCorrect: true,
        attemptId: attemptId.toString(),
        questionId: questionId.toString(),
      });

      await accountRepository.create(user);
      await assessmentRepository.create(assessment);
      await argumentRepository.create(argument);
      await attemptRepository.create(attempt);
      await questionRepository.create(question);
      await attemptAnswerRepository.create(attemptAnswer);

      const request: GetAttemptResultsRequest = {
        attemptId: attemptId.toString(),
        requesterId: userId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);

      if (result.isRight()) {
        const response = result.value;

        expect(response.assessment.type).toBe('SIMULADO');
        expect(response.results.argumentResults).toHaveLength(1);
        expect(response.results.argumentResults![0].argumentId).toBe(
          argumentId.toString(),
        );
        expect(response.results.argumentResults![0].argumentTitle).toBe(
          'Mathematics',
        );
        expect(response.results.argumentResults![0].totalQuestions).toBe(1);
        expect(response.results.argumentResults![0].correctAnswers).toBe(1);
        expect(response.results.argumentResults![0].scorePercentage).toBe(100);

        expect(response.answers[0].argumentId).toBe(argumentId.toString());
        expect(response.answers[0].argumentTitle).toBe('Mathematics');
      }
    });

    it('should successfully get results for prova aberta with pending review', async () => {
      // Arrange
      const attemptId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440000',
      );
      const assessmentId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440001',
      );
      const userId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440002');
      const questionId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440003',
      );

      const user = User.create(
        {
          name: 'Test Student',
          email: 'student@example.com',
          password: 'password123',
          cpf: '12345678901',
          role: 'student',
        },
        userId,
      );

      const assessment = Assessment.create(
        {
          slug: 'test-prova-aberta',
          title: 'Test Prova Aberta',
          type: 'PROVA_ABERTA',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
        },
        assessmentId,
      );

      const attempt = Attempt.create(
        {
          status: new AttemptStatusVO('SUBMITTED'),
          startedAt: new Date('2024-01-01T10:00:00Z'),
          submittedAt: new Date('2024-01-01T11:00:00Z'),
          userId: userId.toString(),
          assessmentId: assessmentId.toString(),
        },
        attemptId,
      );

      const question = Question.create(
        {
          text: 'Explain the concept of clean architecture',
          type: new QuestionTypeVO('OPEN'),
          assessmentId: assessmentId,
        },
        questionId,
      );

      const attemptAnswer = AttemptAnswer.create({
        textAnswer: 'Clean architecture is a software design philosophy...',
        status: new AttemptStatusVO('SUBMITTED'),
        attemptId: attemptId.toString(),
        questionId: questionId.toString(),
      });

      await accountRepository.create(user);
      await assessmentRepository.create(assessment);
      await attemptRepository.create(attempt);
      await questionRepository.create(question);
      await attemptAnswerRepository.create(attemptAnswer);

      const request: GetAttemptResultsRequest = {
        attemptId: attemptId.toString(),
        requesterId: userId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

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
        expect(response.answers[0].textAnswer).toBe(
          'Clean architecture is a software design philosophy...',
        );
        expect(response.answers[0].status).toBe('SUBMITTED');
      }
    });

    it('should allow tutor to view any student attempt', async () => {
      // Arrange
      const attemptId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440000',
      );
      const assessmentId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440001',
      );
      const studentId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440002',
      );
      const tutorId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440003',
      );

      const tutor = User.create(
        {
          name: 'Test Tutor',
          email: 'tutor@example.com',
          password: 'password123',
          cpf: '12345678902',
          role: 'tutor',
        },
        tutorId,
      );

      const assessment = Assessment.create(
        {
          slug: 'test-quiz',
          title: 'Test Quiz',
          type: 'QUIZ',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
        },
        assessmentId,
      );

      const attempt = Attempt.create(
        {
          status: new AttemptStatusVO('GRADED'),
          score: new ScoreVO(85),
          startedAt: new Date(),
          submittedAt: new Date(),
          gradedAt: new Date(),
          userId: studentId.toString(),
          assessmentId: assessmentId.toString(),
        },
        attemptId,
      );

      await accountRepository.create(tutor);
      await assessmentRepository.create(assessment);
      await attemptRepository.create(attempt);

      const request: GetAttemptResultsRequest = {
        attemptId: attemptId.toString(),
        requesterId: tutorId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
    });
  });

  describe('Validation Errors', () => {
    it('should return InvalidInputError for invalid attempt ID', async () => {
      // Arrange
      const request: GetAttemptResultsRequest = {
        attemptId: 'invalid-uuid',
        requesterId: '550e8400-e29b-41d4-a716-446655440000',
      };

      // Act
      const result = await useCase.execute(request);

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
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });
  });

  describe('Business Rule Errors', () => {
    it('should return AttemptNotFoundError when attempt does not exist', async () => {
      // Arrange
      const userId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');

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

      const request: GetAttemptResultsRequest = {
        attemptId: '550e8400-e29b-41d4-a716-446655440001',
        requesterId: userId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(AttemptNotFoundError);
    });

    it('should return AttemptNotFinalizedError for attempt in progress', async () => {
      // Arrange
      const attemptId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440000',
      );
      const userId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');

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

      const attempt = Attempt.create(
        {
          status: new AttemptStatusVO('IN_PROGRESS'),
          startedAt: new Date(),
          userId: userId.toString(),
          assessmentId: '550e8400-e29b-41d4-a716-446655440002',
        },
        attemptId,
      );

      await accountRepository.create(user);
      await attemptRepository.create(attempt);

      const request: GetAttemptResultsRequest = {
        attemptId: attemptId.toString(),
        requesterId: userId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(AttemptNotFinalizedError);
    });

    it('should return UserNotFoundError when requester does not exist', async () => {
      // Arrange
      const attemptId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440000',
      );

      const attempt = Attempt.create(
        {
          status: new AttemptStatusVO('SUBMITTED'),
          startedAt: new Date(),
          submittedAt: new Date(),
          userId: '550e8400-e29b-41d4-a716-446655440001',
          assessmentId: '550e8400-e29b-41d4-a716-446655440002',
        },
        attemptId,
      );

      await attemptRepository.create(attempt);

      const request: GetAttemptResultsRequest = {
        attemptId: attemptId.toString(),
        requesterId: '550e8400-e29b-41d4-a716-446655440003',
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(UserNotFoundError);
    });

    it('should return InsufficientPermissionsError when student tries to view other student attempt', async () => {
      // Arrange
      const attemptId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440000',
      );
      const studentId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440001',
      );
      const otherStudentId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440002',
      );

      const student = User.create(
        {
          name: 'Test Student',
          email: 'student@example.com',
          password: 'password123',
          cpf: '12345678901',
          role: 'student',
        },
        studentId,
      );

      const attempt = Attempt.create(
        {
          status: new AttemptStatusVO('SUBMITTED'),
          startedAt: new Date(),
          submittedAt: new Date(),
          userId: otherStudentId.toString(),
          assessmentId: '550e8400-e29b-41d4-a716-446655440003',
        },
        attemptId,
      );

      await accountRepository.create(student);
      await attemptRepository.create(attempt);

      const request: GetAttemptResultsRequest = {
        attemptId: attemptId.toString(),
        requesterId: studentId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InsufficientPermissionsError);
    });

    it('should return AssessmentNotFoundError when assessment does not exist', async () => {
      // Arrange
      const attemptId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440000',
      );
      const userId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');

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

      const attempt = Attempt.create(
        {
          status: new AttemptStatusVO('SUBMITTED'),
          startedAt: new Date(),
          submittedAt: new Date(),
          userId: userId.toString(),
          assessmentId: '550e8400-e29b-41d4-a716-446655440002',
        },
        attemptId,
      );

      await accountRepository.create(user);
      await attemptRepository.create(attempt);

      const request: GetAttemptResultsRequest = {
        attemptId: attemptId.toString(),
        requesterId: userId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(AssessmentNotFoundError);
    });
  });

  describe('Repository Errors', () => {
    it('should return RepositoryError when attempt answers repository fails', async () => {
      // Arrange
      const attemptId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440000',
      );
      const assessmentId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440001',
      );
      const userId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440002');

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
          slug: 'test-quiz',
          title: 'Test Quiz',
          type: 'QUIZ',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
        },
        assessmentId,
      );

      const attempt = Attempt.create(
        {
          status: new AttemptStatusVO('SUBMITTED'),
          startedAt: new Date(),
          submittedAt: new Date(),
          userId: userId.toString(),
          assessmentId: assessmentId.toString(),
        },
        attemptId,
      );

      await accountRepository.create(user);
      await assessmentRepository.create(assessment);
      await attemptRepository.create(attempt);

      // Mock repository failure
      vi.spyOn(attemptAnswerRepository, 'findByAttemptId').mockResolvedValue({
        isLeft: () => true,
        isRight: () => false,
        value: new Error('Database error'),
      } as any);

      const request: GetAttemptResultsRequest = {
        attemptId: attemptId.toString(),
        requesterId: userId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(RepositoryError);
    });

    it('should return RepositoryError when questions repository fails', async () => {
      // Arrange
      const attemptId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440000',
      );
      const assessmentId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440001',
      );
      const userId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440002');

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
          slug: 'test-quiz',
          title: 'Test Quiz',
          type: 'QUIZ',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
        },
        assessmentId,
      );

      const attempt = Attempt.create(
        {
          status: new AttemptStatusVO('SUBMITTED'),
          startedAt: new Date(),
          submittedAt: new Date(),
          userId: userId.toString(),
          assessmentId: assessmentId.toString(),
        },
        attemptId,
      );

      await accountRepository.create(user);
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
      vi.spyOn(questionRepository, 'findByAssessmentId').mockResolvedValue({
        isLeft: () => true,
        isRight: () => false,
        value: new Error('Database error'),
      } as any);

      const request: GetAttemptResultsRequest = {
        attemptId: attemptId.toString(),
        requesterId: userId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(RepositoryError);
    });

    it('should return RepositoryError when correct answers repository fails', async () => {
      // Arrange
      const attemptId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440000',
      );
      const assessmentId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440001',
      );
      const userId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440002');
      const questionId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440003',
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
          slug: 'test-quiz',
          title: 'Test Quiz',
          type: 'QUIZ',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
        },
        assessmentId,
      );

      const attempt = Attempt.create(
        {
          status: new AttemptStatusVO('SUBMITTED'),
          startedAt: new Date(),
          submittedAt: new Date(),
          userId: userId.toString(),
          assessmentId: assessmentId.toString(),
        },
        attemptId,
      );

      const question = Question.create(
        {
          text: 'Test question',
          type: new QuestionTypeVO('MULTIPLE_CHOICE'),
          assessmentId: assessmentId,
        },
        questionId,
      );

      await accountRepository.create(user);
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
      vi.spyOn(answerRepository, 'findManyByQuestionIds').mockResolvedValue({
        isLeft: () => true,
        isRight: () => false,
        value: new Error('Database error'),
      } as any);

      const request: GetAttemptResultsRequest = {
        attemptId: attemptId.toString(),
        requesterId: userId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(RepositoryError);
    });
  });

  describe('Edge Cases', () => {
    it('should handle attempt with no answers', async () => {
      // Arrange
      const attemptId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440000',
      );
      const assessmentId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440001',
      );
      const userId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440002');

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
          slug: 'test-quiz',
          title: 'Test Quiz',
          type: 'QUIZ',
          passingScore: 70,
          randomizeQuestions: false,
          randomizeOptions: false,
        },
        assessmentId,
      );

      const attempt = Attempt.create(
        {
          status: new AttemptStatusVO('SUBMITTED'),
          startedAt: new Date(),
          submittedAt: new Date(),
          userId: userId.toString(),
          assessmentId: assessmentId.toString(),
        },
        attemptId,
      );

      await accountRepository.create(user);
      await assessmentRepository.create(assessment);
      await attemptRepository.create(attempt);

      const request: GetAttemptResultsRequest = {
        attemptId: attemptId.toString(),
        requesterId: userId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);

      if (result.isRight()) {
        const response = result.value;
        expect(response.results.totalQuestions).toBe(0);
        expect(response.results.answeredQuestions).toBe(0);
        expect(response.answers).toHaveLength(0);
      }
    });

    it('should handle unexpected errors gracefully', async () => {
      // Arrange
      const request: GetAttemptResultsRequest = {
        attemptId: '550e8400-e29b-41d4-a716-446655440000',
        requesterId: '550e8400-e29b-41d4-a716-446655440001',
      };

      // Mock unexpected error
      vi.spyOn(attemptRepository, 'findById').mockRejectedValue(
        new Error('Unexpected error'),
      );

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(RepositoryError);
    });
  });
});
