// src/domain/assessment/application/use-cases/submit-attempt.use-case.spec.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SubmitAttemptUseCase } from './submit-attempt.use-case';
import { InMemoryAttemptRepository } from '@/test/repositories/in-memory-attempt-repository';
import { InMemoryAttemptAnswerRepository } from '@/test/repositories/in-memory-attempt-answer-repository';
import { InMemoryAssessmentRepository } from '@/test/repositories/in-memory-assessment-repository';
import { InMemoryQuestionRepository } from '@/test/repositories/in-memory-question-repository';
import { InMemoryAnswerRepository } from '@/test/repositories/in-memory-answer-repository';
import { IAttemptRepository } from '../repositories/i-attempt.repository';
import { IAttemptAnswerRepository } from '../repositories/i-attempt-answer-repository';
import { IAssessmentRepository } from '../repositories/i-assessment-repository';
import { IQuestionRepository } from '../repositories/i-question-repository';
import { IAnswerRepository } from '../repositories/i-answer.repository';
import { Attempt } from '@/domain/assessment/enterprise/entities/attempt.entity';
import { AttemptAnswer } from '@/domain/assessment/enterprise/entities/attempt-answer.entity';
import { Assessment } from '@/domain/assessment/enterprise/entities/assessment.entity';
import { Question } from '@/domain/assessment/enterprise/entities/question.entity';
import { Answer } from '@/domain/assessment/enterprise/entities/answer.entity';
import { AttemptStatusVO } from '@/domain/assessment/enterprise/value-objects/attempt-status.vo';
import { QuestionTypeVO } from '@/domain/assessment/enterprise/value-objects/question-type.vo';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { SubmitAttemptRequest } from '../dtos/submit-attempt-request.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { AttemptNotFoundError } from './errors/attempt-not-found-error';
import { AttemptNotActiveError } from './errors/attempt-not-active-error';
import { AssessmentNotFoundError } from './errors/assessment-not-found-error';
import { NoAnswersFoundError } from './errors/no-answers-found-error';
import { AttemptExpiredError } from './errors/attempt-expired-error';
import { RepositoryError } from './errors/repository-error';

let useCase: SubmitAttemptUseCase;
let attemptRepository: InMemoryAttemptRepository;
let attemptAnswerRepository: InMemoryAttemptAnswerRepository;
let assessmentRepository: InMemoryAssessmentRepository;
let questionRepository: InMemoryQuestionRepository;
let answerRepository: InMemoryAnswerRepository;

describe('SubmitAttemptUseCase', () => {
  beforeEach(() => {
    attemptRepository = new InMemoryAttemptRepository();
    attemptAnswerRepository = new InMemoryAttemptAnswerRepository();
    assessmentRepository = new InMemoryAssessmentRepository();
    questionRepository = new InMemoryQuestionRepository();
    answerRepository = new InMemoryAnswerRepository();
    useCase = new SubmitAttemptUseCase(
      attemptRepository,
      attemptAnswerRepository,
      assessmentRepository,
      questionRepository,
      answerRepository,
    );
  });

  describe('Success Cases', () => {
    it('should submit attempt with multiple choice questions and calculate correct score', async () => {
      // Arrange
      const attemptId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const assessmentId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');
      const questionId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440002');
      const answerId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440007');
      const correctOptionId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440008');

      const attempt = Attempt.create({
        status: new AttemptStatusVO('IN_PROGRESS'),
        startedAt: new Date(),
        userId: '550e8400-e29b-41d4-a716-446655440003',
        assessmentId: assessmentId.toString(),
      }, attemptId);

      const assessment = Assessment.create({
        slug: 'quiz-test',
        title: 'Quiz Test',
        type: 'QUIZ',
        quizPosition: 'BEFORE_LESSON',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      }, assessmentId);

      const question = Question.create({
        text: 'What is 2 + 2?',
        type: new QuestionTypeVO('MULTIPLE_CHOICE'),
        assessmentId,
        argumentId: new UniqueEntityID('550e8400-e29b-41d4-a716-446655440004'),
      }, questionId);

      const correctAnswer = Answer.create({
        correctOptionId: correctOptionId,
        explanation: 'The answer is 4',
        questionId: questionId,
        translations: [],
      }, answerId);

      const attemptAnswer = AttemptAnswer.create({
        selectedOptionId: correctOptionId.toString(), // Correct answer
        status: new AttemptStatusVO('IN_PROGRESS'),
        attemptId: attemptId.toString(),
        questionId: questionId.toString(),
      });

      await attemptRepository.create(attempt);
      await assessmentRepository.create(assessment);
      await questionRepository.create(question);
      await answerRepository.create(correctAnswer);
      await attemptAnswerRepository.create(attemptAnswer);

      const request: SubmitAttemptRequest = {
        attemptId: attemptId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attempt.id).toBe(attemptId.toString());
        expect(result.value.attempt.status).toBe('GRADED');
        expect(result.value.attempt.submittedAt).toBeInstanceOf(Date);
        expect(result.value.attempt.gradedAt).toBeInstanceOf(Date);
        expect(result.value.attempt.score).toBe(100); // 1/1 correct = 100%
        expect(result.value.summary.totalQuestions).toBe(1);
        expect(result.value.summary.answeredQuestions).toBe(1);
        expect(result.value.summary.correctAnswers).toBe(1);
        expect(result.value.summary.scorePercentage).toBe(100);

        // Verify attempt answer was marked as SUBMITTED (then auto-graded)
        const updatedAttemptAnswer = await attemptAnswerRepository.findById(attemptAnswer.id.toString());
        expect(updatedAttemptAnswer.isRight()).toBe(true);
        if (updatedAttemptAnswer.isRight()) {
          expect(updatedAttemptAnswer.value.status.getValue()).toBe('SUBMITTED');
        }
      }
    });

    it('should submit attempt with incorrect multiple choice answer', async () => {
      // Arrange
      const attemptId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const assessmentId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');
      const questionId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440002');
      const answerId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440007');
      const correctOptionId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440008');
      const wrongOptionId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440009');

      const attempt = Attempt.create({
        status: new AttemptStatusVO('IN_PROGRESS'),
        startedAt: new Date(),
        userId: '550e8400-e29b-41d4-a716-446655440003',
        assessmentId: assessmentId.toString(),
      }, attemptId);

      const assessment = Assessment.create({
        slug: 'quiz-test',
        title: 'Quiz Test',
        type: 'QUIZ',
        quizPosition: 'BEFORE_LESSON',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      }, assessmentId);

      const question = Question.create({
        text: 'What is 2 + 2?',
        type: new QuestionTypeVO('MULTIPLE_CHOICE'),
        assessmentId,
        argumentId: new UniqueEntityID('550e8400-e29b-41d4-a716-446655440004'),
      }, questionId);

      const correctAnswer = Answer.create({
        correctOptionId: correctOptionId,
        explanation: 'The answer is 4',
        questionId: questionId,
        translations: [],
      }, answerId);

      const attemptAnswer = AttemptAnswer.create({
        selectedOptionId: wrongOptionId.toString(), // Wrong answer
        status: new AttemptStatusVO('IN_PROGRESS'),
        attemptId: attemptId.toString(),
        questionId: questionId.toString(),
      });

      await attemptRepository.create(attempt);
      await assessmentRepository.create(assessment);
      await questionRepository.create(question);
      await answerRepository.create(correctAnswer);
      await attemptAnswerRepository.create(attemptAnswer);

      const request: SubmitAttemptRequest = {
        attemptId: attemptId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attempt.status).toBe('GRADED');
        expect(result.value.attempt.score).toBe(0); // 0/1 correct = 0%
        expect(result.value.summary.correctAnswers).toBe(0);
        expect(result.value.summary.scorePercentage).toBe(0);
      }
    });

    it('should submit attempt with open questions only', async () => {
      // Arrange
      const attemptId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const assessmentId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');
      const questionId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440002');

      const attempt = Attempt.create({
        status: new AttemptStatusVO('IN_PROGRESS'),
        startedAt: new Date(),
        userId: '550e8400-e29b-41d4-a716-446655440003',
        assessmentId: assessmentId.toString(),
      }, attemptId);

      const assessment = Assessment.create({
        slug: 'prova-aberta-test',
        title: 'Prova Aberta Test',
        type: 'PROVA_ABERTA',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      }, assessmentId);

      const question = Question.create({
        text: 'Explain your reasoning',
        type: new QuestionTypeVO('OPEN'),
        assessmentId,
        argumentId: new UniqueEntityID('550e8400-e29b-41d4-a716-446655440004'),
      }, questionId);

      const attemptAnswer = AttemptAnswer.create({
        textAnswer: 'My detailed answer here',
        status: new AttemptStatusVO('IN_PROGRESS'),
        attemptId: attemptId.toString(),
        questionId: questionId.toString(),
      });

      await attemptRepository.create(attempt);
      await assessmentRepository.create(assessment);
      await questionRepository.create(question);
      await attemptAnswerRepository.create(attemptAnswer);

      const request: SubmitAttemptRequest = {
        attemptId: attemptId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attempt.status).toBe('SUBMITTED');
        expect(result.value.attempt.submittedAt).toBeInstanceOf(Date);
        expect(result.value.attempt.gradedAt).toBeUndefined();
        expect(result.value.attempt.score).toBeUndefined();
        expect(result.value.summary.correctAnswers).toBeUndefined();
        expect(result.value.summary.scorePercentage).toBeUndefined();

        // Verify attempt answer was marked as SUBMITTED
        const updatedAttemptAnswer = await attemptAnswerRepository.findById(attemptAnswer.id.toString());
        expect(updatedAttemptAnswer.isRight()).toBe(true);
        if (updatedAttemptAnswer.isRight()) {
          expect(updatedAttemptAnswer.value.status.getValue()).toBe('SUBMITTED');
        }
      }
    });

    it('should submit attempt with mixed question types (50% score)', async () => {
      // Arrange
      const attemptId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const assessmentId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');
      const mcQuestionId1 = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440002');
      const mcQuestionId2 = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440010');
      const openQuestionId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440006');

      const attempt = Attempt.create({
        status: new AttemptStatusVO('IN_PROGRESS'),
        startedAt: new Date(),
        userId: '550e8400-e29b-41d4-a716-446655440003',
        assessmentId: assessmentId.toString(),
      }, attemptId);

      const assessment = Assessment.create({
        slug: 'mixed-test',
        title: 'Mixed Test',
        type: 'SIMULADO',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      }, assessmentId);

      // Multiple choice questions
      const mcQuestion1 = Question.create({
        text: 'What is 2 + 2?',
        type: new QuestionTypeVO('MULTIPLE_CHOICE'),
        assessmentId,
        argumentId: new UniqueEntityID('550e8400-e29b-41d4-a716-446655440004'),
      }, mcQuestionId1);

      const mcQuestion2 = Question.create({
        text: 'What is 3 + 3?',
        type: new QuestionTypeVO('MULTIPLE_CHOICE'),
        assessmentId,
        argumentId: new UniqueEntityID('550e8400-e29b-41d4-a716-446655440004'),
      }, mcQuestionId2);

      // Open question
      const openQuestion = Question.create({
        text: 'Explain your reasoning',
        type: new QuestionTypeVO('OPEN'),
        assessmentId,
        argumentId: new UniqueEntityID('550e8400-e29b-41d4-a716-446655440004'),
      }, openQuestionId);

      // Correct answers
      const correctOptionId1 = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440008');
      const correctOptionId2 = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440011');
      const wrongOptionId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440009');

      const correctAnswer1 = Answer.create({
        correctOptionId: correctOptionId1,
        explanation: 'The answer is 4',
        questionId: mcQuestionId1,
        translations: [],
      });

      const correctAnswer2 = Answer.create({
        correctOptionId: correctOptionId2,
        explanation: 'The answer is 6',
        questionId: mcQuestionId2,
        translations: [],
      });

      // Attempt answers: 1 correct, 1 wrong, 1 open
      const mcAnswer1 = AttemptAnswer.create({
        selectedOptionId: correctOptionId1.toString(), // Correct
        status: new AttemptStatusVO('IN_PROGRESS'),
        attemptId: attemptId.toString(),
        questionId: mcQuestionId1.toString(),
      });

      const mcAnswer2 = AttemptAnswer.create({
        selectedOptionId: wrongOptionId.toString(), // Wrong
        status: new AttemptStatusVO('IN_PROGRESS'),
        attemptId: attemptId.toString(),
        questionId: mcQuestionId2.toString(),
      });

      const openAnswer = AttemptAnswer.create({
        textAnswer: 'My detailed answer',
        status: new AttemptStatusVO('IN_PROGRESS'),
        attemptId: attemptId.toString(),
        questionId: openQuestionId.toString(),
      });

      await attemptRepository.create(attempt);
      await assessmentRepository.create(assessment);
      await questionRepository.create(mcQuestion1);
      await questionRepository.create(mcQuestion2);
      await questionRepository.create(openQuestion);
      await answerRepository.create(correctAnswer1);
      await answerRepository.create(correctAnswer2);
      await attemptAnswerRepository.create(mcAnswer1);
      await attemptAnswerRepository.create(mcAnswer2);
      await attemptAnswerRepository.create(openAnswer);

      const request: SubmitAttemptRequest = {
        attemptId: attemptId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attempt.status).toBe('SUBMITTED'); // Has open questions
        expect(result.value.summary.totalQuestions).toBe(3);
        expect(result.value.summary.answeredQuestions).toBe(3);
        expect(result.value.summary.correctAnswers).toBeUndefined(); // Mixed has open questions
      }
    });
  });

  describe('Validation Errors', () => {
    it('should return InvalidInputError for empty attemptId', async () => {
      // Arrange
      const request: SubmitAttemptRequest = {
        attemptId: '',
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should return InvalidInputError for invalid UUID in attemptId', async () => {
      // Arrange
      const request: SubmitAttemptRequest = {
        attemptId: 'invalid-uuid',
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
    it('should return AttemptNotFoundError when attempt does not exist', async () => {
      // Arrange
      const request: SubmitAttemptRequest = {
        attemptId: '550e8400-e29b-41d4-a716-446655440000',
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(AttemptNotFoundError);
      }
    });

    it('should return AttemptNotActiveError when attempt is already submitted', async () => {
      // Arrange
      const attemptId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');

      const attempt = Attempt.create({
        status: new AttemptStatusVO('SUBMITTED'),
        startedAt: new Date(),
        submittedAt: new Date(),
        userId: '550e8400-e29b-41d4-a716-446655440003',
        assessmentId: '550e8400-e29b-41d4-a716-446655440001',
      }, attemptId);

      await attemptRepository.create(attempt);

      const request: SubmitAttemptRequest = {
        attemptId: attemptId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(AttemptNotActiveError);
      }
    });

    it('should return AttemptExpiredError when time limit has expired', async () => {
      // Arrange
      const attemptId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const assessmentId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');
      const pastTime = new Date(Date.now() - 60000); // 1 minute ago

      // Create a SIMULADO assessment (allows time limit checking)
      const assessment = Assessment.create({
        slug: 'test-simulado',
        title: 'Test Simulado',
        description: 'Test simulado assessment',
        type: 'SIMULADO',
        passingScore: 70,
        timeLimitInMinutes: 60,
        randomizeQuestions: false,
        randomizeOptions: false,
        lessonId: '550e8400-e29b-41d4-a716-446655440002',
      }, assessmentId);

      await assessmentRepository.create(assessment);

      const attempt = Attempt.create({
        status: new AttemptStatusVO('IN_PROGRESS'),
        startedAt: new Date(),
        timeLimitExpiresAt: pastTime,
        userId: '550e8400-e29b-41d4-a716-446655440003',
        assessmentId: assessmentId.toString(),
      }, attemptId);

      await attemptRepository.create(attempt);

      const request: SubmitAttemptRequest = {
        attemptId: attemptId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(AttemptExpiredError);
      }
    });

    it('should return AssessmentNotFoundError when assessment does not exist', async () => {
      // Arrange
      const attemptId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');

      const attempt = Attempt.create({
        status: new AttemptStatusVO('IN_PROGRESS'),
        startedAt: new Date(),
        userId: '550e8400-e29b-41d4-a716-446655440003',
        assessmentId: '550e8400-e29b-41d4-a716-446655440001',
      }, attemptId);

      await attemptRepository.create(attempt);

      const request: SubmitAttemptRequest = {
        attemptId: attemptId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(AssessmentNotFoundError);
      }
    });

    it('should return NoAnswersFoundError when no answers exist for attempt', async () => {
      // Arrange
      const attemptId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const assessmentId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');

      const attempt = Attempt.create({
        status: new AttemptStatusVO('IN_PROGRESS'),
        startedAt: new Date(),
        userId: '550e8400-e29b-41d4-a716-446655440003',
        assessmentId: assessmentId.toString(),
      }, attemptId);

      const assessment = Assessment.create({
        slug: 'quiz-test',
        title: 'Quiz Test',
        type: 'QUIZ',
        quizPosition: 'BEFORE_LESSON',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      }, assessmentId);

      await attemptRepository.create(attempt);
      await assessmentRepository.create(assessment);

      const request: SubmitAttemptRequest = {
        attemptId: attemptId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(NoAnswersFoundError);
      }
    });
  });

  describe('Repository Errors', () => {
    it('should return RepositoryError when attempt repository fails to update', async () => {
      // Arrange
      const attemptId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const assessmentId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');
      const questionId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440002');

      const attempt = Attempt.create({
        status: new AttemptStatusVO('IN_PROGRESS'),
        startedAt: new Date(),
        userId: '550e8400-e29b-41d4-a716-446655440003',
        assessmentId: assessmentId.toString(),
      }, attemptId);

      const assessment = Assessment.create({
        slug: 'quiz-test',
        title: 'Quiz Test',
        type: 'QUIZ',
        quizPosition: 'BEFORE_LESSON',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      }, assessmentId);

      const question = Question.create({
        text: 'What is 2 + 2?',
        type: new QuestionTypeVO('MULTIPLE_CHOICE'),
        assessmentId,
        argumentId: new UniqueEntityID('550e8400-e29b-41d4-a716-446655440004'),
      }, questionId);

      const attemptAnswer = AttemptAnswer.create({
        selectedOptionId: '550e8400-e29b-41d4-a716-446655440005',
        status: new AttemptStatusVO('IN_PROGRESS'),
        attemptId: attemptId.toString(),
        questionId: questionId.toString(),
      });

      await attemptRepository.create(attempt);
      await assessmentRepository.create(assessment);
      await questionRepository.create(question);
      await attemptAnswerRepository.create(attemptAnswer);

      // Mock repository failure
      const mockAttemptRepository = {
        findById: vi.fn().mockResolvedValue({
          isLeft: () => false,
          isRight: () => true,
          value: attempt,
        }),
        update: vi.fn().mockResolvedValue({
          isLeft: () => true,
          isRight: () => false,
          value: new Error('Database error'),
        }),
      } as Partial<IAttemptRepository>;

      const useCase = new SubmitAttemptUseCase(
        mockAttemptRepository as IAttemptRepository,
        attemptAnswerRepository,
        assessmentRepository,
        questionRepository,
        answerRepository,
      );

      const request: SubmitAttemptRequest = {
        attemptId: attemptId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe('Failed to update attempt');
      }
    });

    it('should return RepositoryError when answers repository fails', async () => {
      // Arrange
      const attemptId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const assessmentId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');

      const attempt = Attempt.create({
        status: new AttemptStatusVO('IN_PROGRESS'),
        startedAt: new Date(),
        userId: '550e8400-e29b-41d4-a716-446655440003',
        assessmentId: assessmentId.toString(),
      }, attemptId);

      const assessment = Assessment.create({
        slug: 'quiz-test',
        title: 'Quiz Test',
        type: 'QUIZ',
        quizPosition: 'BEFORE_LESSON',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      }, assessmentId);

      await attemptRepository.create(attempt);
      await assessmentRepository.create(assessment);

      // Mock repository failure
      const mockAttemptAnswerRepository = {
        findByAttemptId: vi.fn().mockResolvedValue({
          isLeft: () => true,
          isRight: () => false,
          value: new Error('Database error'),
        }),
      } as Partial<IAttemptAnswerRepository>;

      const useCase = new SubmitAttemptUseCase(
        attemptRepository,
        mockAttemptAnswerRepository as IAttemptAnswerRepository,
        assessmentRepository,
        questionRepository,
        answerRepository,
      );

      const request: SubmitAttemptRequest = {
        attemptId: attemptId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe('Failed to fetch attempt answers');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle attempt without time limit', async () => {
      // Arrange
      const attemptId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const assessmentId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');
      const questionId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440002');

      const attempt = Attempt.create({
        status: new AttemptStatusVO('IN_PROGRESS'),
        startedAt: new Date(),
        userId: '550e8400-e29b-41d4-a716-446655440003',
        assessmentId: assessmentId.toString(),
        // No timeLimitExpiresAt
      }, attemptId);

      const assessment = Assessment.create({
        slug: 'quiz-test',
        title: 'Quiz Test',
        type: 'QUIZ',
        quizPosition: 'BEFORE_LESSON',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      }, assessmentId);

      const question = Question.create({
        text: 'What is 2 + 2?',
        type: new QuestionTypeVO('MULTIPLE_CHOICE'),
        assessmentId,
        argumentId: new UniqueEntityID('550e8400-e29b-41d4-a716-446655440004'),
      }, questionId);

      const attemptAnswer = AttemptAnswer.create({
        selectedOptionId: '550e8400-e29b-41d4-a716-446655440005',
        status: new AttemptStatusVO('IN_PROGRESS'),
        attemptId: attemptId.toString(),
        questionId: questionId.toString(),
      });

      await attemptRepository.create(attempt);
      await assessmentRepository.create(assessment);
      await questionRepository.create(question);
      await attemptAnswerRepository.create(attemptAnswer);

      const request: SubmitAttemptRequest = {
        attemptId: attemptId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attempt.timeLimitExpiresAt).toBeUndefined();
        expect(result.value.attempt.status).toBe('GRADED');
      }
    });

    it('should handle empty assessment (no questions)', async () => {
      // Arrange
      const attemptId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const assessmentId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');

      const attempt = Attempt.create({
        status: new AttemptStatusVO('IN_PROGRESS'),
        startedAt: new Date(),
        userId: '550e8400-e29b-41d4-a716-446655440003',
        assessmentId: assessmentId.toString(),
      }, attemptId);

      const assessment = Assessment.create({
        slug: 'empty-quiz',
        title: 'Empty Quiz',
        type: 'QUIZ',
        quizPosition: 'BEFORE_LESSON',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      }, assessmentId);

      // Create a dummy answer to pass the "no answers" check
      const attemptAnswer = AttemptAnswer.create({
        selectedOptionId: '550e8400-e29b-41d4-a716-446655440005',
        status: new AttemptStatusVO('IN_PROGRESS'),
        attemptId: attemptId.toString(),
        questionId: '550e8400-e29b-41d4-a716-446655440002', // Non-existent question
      });

      await attemptRepository.create(attempt);
      await assessmentRepository.create(assessment);
      await attemptAnswerRepository.create(attemptAnswer);
      // No questions created

      const request: SubmitAttemptRequest = {
        attemptId: attemptId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.summary.totalQuestions).toBe(0);
        expect(result.value.summary.answeredQuestions).toBe(1);
      }
    });

    it('should handle questions without correct answers', async () => {
      // Arrange
      const attemptId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const assessmentId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');
      const questionId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440002');

      const attempt = Attempt.create({
        status: new AttemptStatusVO('IN_PROGRESS'),
        startedAt: new Date(),
        userId: '550e8400-e29b-41d4-a716-446655440003',
        assessmentId: assessmentId.toString(),
      }, attemptId);

      const assessment = Assessment.create({
        slug: 'quiz-test',
        title: 'Quiz Test',
        type: 'QUIZ',
        quizPosition: 'BEFORE_LESSON',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeOptions: false,
      }, assessmentId);

      const question = Question.create({
        text: 'What is 2 + 2?',
        type: new QuestionTypeVO('MULTIPLE_CHOICE'),
        assessmentId,
        argumentId: new UniqueEntityID('550e8400-e29b-41d4-a716-446655440004'),
      }, questionId);

      const attemptAnswer = AttemptAnswer.create({
        selectedOptionId: '550e8400-e29b-41d4-a716-446655440005',
        status: new AttemptStatusVO('IN_PROGRESS'),
        attemptId: attemptId.toString(),
        questionId: questionId.toString(),
      });

      await attemptRepository.create(attempt);
      await assessmentRepository.create(assessment);
      await questionRepository.create(question);
      await attemptAnswerRepository.create(attemptAnswer);
      // No correct answer created

      const request: SubmitAttemptRequest = {
        attemptId: attemptId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attempt.status).toBe('GRADED');
        expect(result.value.attempt.score).toBe(0); // No correct answers found
        expect(result.value.summary.correctAnswers).toBe(0);
      }
    });
  });
});