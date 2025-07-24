// src/domain/assessment/application/use-cases/submit-answer.use-case.spec.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SubmitAnswerUseCase } from './submit-answer.use-case';
import { InMemoryAttemptRepository } from '@/test/repositories/in-memory-attempt-repository';
import { InMemoryQuestionRepository } from '@/test/repositories/in-memory-question-repository';
import { InMemoryAttemptAnswerRepository } from '@/test/repositories/in-memory-attempt-answer-repository';
import { IAttemptRepository } from '../repositories/i-attempt.repository';
import { IQuestionRepository } from '../repositories/i-question-repository';
import { IAttemptAnswerRepository } from '../repositories/i-attempt-answer-repository';
import { Attempt } from '@/domain/assessment/enterprise/entities/attempt.entity';
import { Question } from '@/domain/assessment/enterprise/entities/question.entity';
import { AttemptAnswer } from '@/domain/assessment/enterprise/entities/attempt-answer.entity';
import { AttemptStatusVO } from '@/domain/assessment/enterprise/value-objects/attempt-status.vo';
import { QuestionTypeVO } from '@/domain/assessment/enterprise/value-objects/question-type.vo';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { SubmitAnswerRequest } from '../dtos/submit-answer-request.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { AttemptNotFoundError } from './errors/attempt-not-found-error';
import { AttemptNotActiveError } from './errors/attempt-not-active-error';
import { QuestionNotFoundError } from './errors/question-not-found-error';
import { InvalidAnswerTypeError } from './errors/invalid-answer-type-error';
import { RepositoryError } from './errors/repository-error';

let useCase: SubmitAnswerUseCase;
let attemptRepository: InMemoryAttemptRepository;
let questionRepository: InMemoryQuestionRepository;
let attemptAnswerRepository: InMemoryAttemptAnswerRepository;

describe('SubmitAnswerUseCase', () => {
  beforeEach(() => {
    attemptRepository = new InMemoryAttemptRepository();
    questionRepository = new InMemoryQuestionRepository();
    attemptAnswerRepository = new InMemoryAttemptAnswerRepository();
    useCase = new SubmitAnswerUseCase(
      attemptRepository,
      questionRepository,
      attemptAnswerRepository,
    );
  });

  describe('Success Cases', () => {
    it('should submit multiple choice answer successfully', async () => {
      // Arrange
      const attemptId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440000',
      );
      const questionId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440001',
      );
      const optionId = '550e8400-e29b-41d4-a716-446655440002';

      const attempt = Attempt.create(
        {
          status: new AttemptStatusVO('IN_PROGRESS'),
          startedAt: new Date(),
          userId: '550e8400-e29b-41d4-a716-446655440003',
          assessmentId: '550e8400-e29b-41d4-a716-446655440004',
        },
        attemptId,
      );

      const question = Question.create(
        {
          text: 'What is the correct answer?',
          type: new QuestionTypeVO('MULTIPLE_CHOICE'),
          assessmentId: new UniqueEntityID(
            '550e8400-e29b-41d4-a716-446655440004',
          ),
          argumentId: new UniqueEntityID(
            '550e8400-e29b-41d4-a716-446655440005',
          ),
        },
        questionId,
      );

      await attemptRepository.create(attempt);
      await questionRepository.create(question);

      const request: SubmitAnswerRequest = {
        attemptId: attemptId.toString(),
        questionId: questionId.toString(),
        selectedOptionId: optionId,
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attemptAnswer.id).toBeDefined();
        expect(result.value.attemptAnswer.selectedOptionId).toBe(optionId);
        expect(result.value.attemptAnswer.textAnswer).toBeUndefined();
        expect(result.value.attemptAnswer.status).toBe('IN_PROGRESS');
        expect(result.value.attemptAnswer.attemptId).toBe(attemptId.toString());
        expect(result.value.attemptAnswer.questionId).toBe(
          questionId.toString(),
        );
        expect(result.value.attemptAnswer.createdAt).toBeInstanceOf(Date);
        expect(result.value.attemptAnswer.updatedAt).toBeInstanceOf(Date);
      }
    });

    it('should submit open answer successfully', async () => {
      // Arrange
      const attemptId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440000',
      );
      const questionId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440001',
      );
      const textAnswer = 'This is my open answer';

      const attempt = Attempt.create(
        {
          status: new AttemptStatusVO('IN_PROGRESS'),
          startedAt: new Date(),
          userId: '550e8400-e29b-41d4-a716-446655440003',
          assessmentId: '550e8400-e29b-41d4-a716-446655440004',
        },
        attemptId,
      );

      const question = Question.create(
        {
          text: 'What is the correct answer?',
          type: new QuestionTypeVO('OPEN'),
          assessmentId: new UniqueEntityID(
            '550e8400-e29b-41d4-a716-446655440004',
          ),
          argumentId: new UniqueEntityID(
            '550e8400-e29b-41d4-a716-446655440005',
          ),
        },
        questionId,
      );

      await attemptRepository.create(attempt);
      await questionRepository.create(question);

      const request: SubmitAnswerRequest = {
        attemptId: attemptId.toString(),
        questionId: questionId.toString(),
        textAnswer,
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attemptAnswer.selectedOptionId).toBeUndefined();
        expect(result.value.attemptAnswer.textAnswer).toBe(textAnswer);
        expect(result.value.attemptAnswer.status).toBe('IN_PROGRESS');
      }
    });

    it('should update existing answer', async () => {
      // Arrange
      const attemptId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440000',
      );
      const questionId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440001',
      );
      const originalOptionId = '550e8400-e29b-41d4-a716-446655440002';
      const newOptionId = '550e8400-e29b-41d4-a716-446655440006';

      const attempt = Attempt.create(
        {
          status: new AttemptStatusVO('IN_PROGRESS'),
          startedAt: new Date(),
          userId: '550e8400-e29b-41d4-a716-446655440003',
          assessmentId: '550e8400-e29b-41d4-a716-446655440004',
        },
        attemptId,
      );

      const question = Question.create(
        {
          text: 'What is the correct answer?',
          type: new QuestionTypeVO('MULTIPLE_CHOICE'),
          assessmentId: new UniqueEntityID(
            '550e8400-e29b-41d4-a716-446655440004',
          ),
          argumentId: new UniqueEntityID(
            '550e8400-e29b-41d4-a716-446655440005',
          ),
        },
        questionId,
      );

      const existingAnswer = AttemptAnswer.create({
        selectedOptionId: originalOptionId,
        status: new AttemptStatusVO('IN_PROGRESS'),
        attemptId: attemptId.toString(),
        questionId: questionId.toString(),
      });

      await attemptRepository.create(attempt);
      await questionRepository.create(question);
      await attemptAnswerRepository.create(existingAnswer);

      const request: SubmitAnswerRequest = {
        attemptId: attemptId.toString(),
        questionId: questionId.toString(),
        selectedOptionId: newOptionId,
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.attemptAnswer.selectedOptionId).toBe(newOptionId);
        expect(result.value.attemptAnswer.id).toBe(
          existingAnswer.id.toString(),
        );
      }
    });
  });

  describe('Validation Errors', () => {
    it('should return InvalidInputError for empty attemptId', async () => {
      // Arrange
      const request: SubmitAnswerRequest = {
        attemptId: '',
        questionId: '550e8400-e29b-41d4-a716-446655440000',
        selectedOptionId: '550e8400-e29b-41d4-a716-446655440001',
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
      const request: SubmitAnswerRequest = {
        attemptId: 'invalid-uuid',
        questionId: '550e8400-e29b-41d4-a716-446655440000',
        selectedOptionId: '550e8400-e29b-41d4-a716-446655440001',
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should return InvalidInputError when neither selectedOptionId nor textAnswer provided', async () => {
      // Arrange
      const request: SubmitAnswerRequest = {
        attemptId: '550e8400-e29b-41d4-a716-446655440000',
        questionId: '550e8400-e29b-41d4-a716-446655440001',
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should return InvalidInputError when both selectedOptionId and textAnswer provided', async () => {
      // Arrange
      const request: SubmitAnswerRequest = {
        attemptId: '550e8400-e29b-41d4-a716-446655440000',
        questionId: '550e8400-e29b-41d4-a716-446655440001',
        selectedOptionId: '550e8400-e29b-41d4-a716-446655440002',
        textAnswer: 'Some text',
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
      const request: SubmitAnswerRequest = {
        attemptId: '550e8400-e29b-41d4-a716-446655440000',
        questionId: '550e8400-e29b-41d4-a716-446655440001',
        selectedOptionId: '550e8400-e29b-41d4-a716-446655440002',
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(AttemptNotFoundError);
      }
    });

    it('should return AttemptNotActiveError when attempt is not in progress', async () => {
      // Arrange
      const attemptId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440000',
      );

      const attempt = Attempt.create(
        {
          status: new AttemptStatusVO('SUBMITTED'),
          startedAt: new Date(),
          userId: '550e8400-e29b-41d4-a716-446655440003',
          assessmentId: '550e8400-e29b-41d4-a716-446655440004',
        },
        attemptId,
      );

      await attemptRepository.create(attempt);

      const request: SubmitAnswerRequest = {
        attemptId: attemptId.toString(),
        questionId: '550e8400-e29b-41d4-a716-446655440001',
        selectedOptionId: '550e8400-e29b-41d4-a716-446655440002',
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(AttemptNotActiveError);
      }
    });

    it('should return QuestionNotFoundError when question does not exist', async () => {
      // Arrange
      const attemptId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440000',
      );

      const attempt = Attempt.create(
        {
          status: new AttemptStatusVO('IN_PROGRESS'),
          startedAt: new Date(),
          userId: '550e8400-e29b-41d4-a716-446655440003',
          assessmentId: '550e8400-e29b-41d4-a716-446655440004',
        },
        attemptId,
      );

      await attemptRepository.create(attempt);

      const request: SubmitAnswerRequest = {
        attemptId: attemptId.toString(),
        questionId: '550e8400-e29b-41d4-a716-446655440001',
        selectedOptionId: '550e8400-e29b-41d4-a716-446655440002',
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(QuestionNotFoundError);
      }
    });

    it('should return InvalidAnswerTypeError for multiple choice question with text answer', async () => {
      // Arrange
      const attemptId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440000',
      );
      const questionId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440001',
      );

      const attempt = Attempt.create(
        {
          status: new AttemptStatusVO('IN_PROGRESS'),
          startedAt: new Date(),
          userId: '550e8400-e29b-41d4-a716-446655440003',
          assessmentId: '550e8400-e29b-41d4-a716-446655440004',
        },
        attemptId,
      );

      const question = Question.create(
        {
          text: 'What is the correct answer?',
          type: new QuestionTypeVO('MULTIPLE_CHOICE'),
          assessmentId: new UniqueEntityID(
            '550e8400-e29b-41d4-a716-446655440004',
          ),
          argumentId: new UniqueEntityID(
            '550e8400-e29b-41d4-a716-446655440005',
          ),
        },
        questionId,
      );

      await attemptRepository.create(attempt);
      await questionRepository.create(question);

      const request: SubmitAnswerRequest = {
        attemptId: attemptId.toString(),
        questionId: questionId.toString(),
        textAnswer: 'This should not work',
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidAnswerTypeError);
      }
    });

    it('should return InvalidAnswerTypeError for open question with selected option', async () => {
      // Arrange
      const attemptId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440000',
      );
      const questionId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440001',
      );

      const attempt = Attempt.create(
        {
          status: new AttemptStatusVO('IN_PROGRESS'),
          startedAt: new Date(),
          userId: '550e8400-e29b-41d4-a716-446655440003',
          assessmentId: '550e8400-e29b-41d4-a716-446655440004',
        },
        attemptId,
      );

      const question = Question.create(
        {
          text: 'What is the correct answer?',
          type: new QuestionTypeVO('OPEN'),
          assessmentId: new UniqueEntityID(
            '550e8400-e29b-41d4-a716-446655440004',
          ),
          argumentId: new UniqueEntityID(
            '550e8400-e29b-41d4-a716-446655440005',
          ),
        },
        questionId,
      );

      await attemptRepository.create(attempt);
      await questionRepository.create(question);

      const request: SubmitAnswerRequest = {
        attemptId: attemptId.toString(),
        questionId: questionId.toString(),
        selectedOptionId: '550e8400-e29b-41d4-a716-446655440002',
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidAnswerTypeError);
      }
    });
  });

  describe('Repository Errors', () => {
    it('should return RepositoryError when attempt repository fails', async () => {
      // Arrange
      const mockAttemptRepository = {
        findById: vi.fn().mockResolvedValue({
          isLeft: () => true,
          isRight: () => false,
          value: new Error('Database error'),
        }),
      } as Partial<IAttemptRepository>;

      const useCase = new SubmitAnswerUseCase(
        mockAttemptRepository as IAttemptRepository,
        questionRepository,
        attemptAnswerRepository,
      );

      const request: SubmitAnswerRequest = {
        attemptId: '550e8400-e29b-41d4-a716-446655440000',
        questionId: '550e8400-e29b-41d4-a716-446655440001',
        selectedOptionId: '550e8400-e29b-41d4-a716-446655440002',
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(AttemptNotFoundError);
      }
    });

    it('should return RepositoryError when answer creation fails', async () => {
      // Arrange
      const attemptId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440000',
      );
      const questionId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440001',
      );

      const attempt = Attempt.create(
        {
          status: new AttemptStatusVO('IN_PROGRESS'),
          startedAt: new Date(),
          userId: '550e8400-e29b-41d4-a716-446655440003',
          assessmentId: '550e8400-e29b-41d4-a716-446655440004',
        },
        attemptId,
      );

      const question = Question.create(
        {
          text: 'What is the correct answer?',
          type: new QuestionTypeVO('MULTIPLE_CHOICE'),
          assessmentId: new UniqueEntityID(
            '550e8400-e29b-41d4-a716-446655440004',
          ),
          argumentId: new UniqueEntityID(
            '550e8400-e29b-41d4-a716-446655440005',
          ),
        },
        questionId,
      );

      await attemptRepository.create(attempt);
      await questionRepository.create(question);

      const mockAttemptAnswerRepository = {
        findByAttemptIdAndQuestionId: vi.fn().mockResolvedValue({
          isLeft: () => true,
          isRight: () => false,
          value: new Error('Answer not found'),
        }),
        create: vi.fn().mockResolvedValue({
          isLeft: () => true,
          isRight: () => false,
          value: new Error('Database error'),
        }),
      } as Partial<IAttemptAnswerRepository>;

      const useCase = new SubmitAnswerUseCase(
        attemptRepository,
        questionRepository,
        mockAttemptAnswerRepository as IAttemptAnswerRepository,
      );

      const request: SubmitAnswerRequest = {
        attemptId: attemptId.toString(),
        questionId: questionId.toString(),
        selectedOptionId: '550e8400-e29b-41d4-a716-446655440002',
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe('Failed to create answer');
      }
    });
  });
});
