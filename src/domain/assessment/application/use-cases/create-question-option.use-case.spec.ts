// src/domain/assessment/application/use-cases/create-question-option.use-case.spec.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { left, right } from '@/core/either';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { CreateQuestionOptionUseCase } from './create-question-option.use-case';
import { QuestionOption } from '@/domain/assessment/enterprise/entities/question-option.entity';
import { Question } from '@/domain/assessment/enterprise/entities/question.entity';
import { QuestionTypeVO } from '@/domain/assessment/enterprise/value-objects/question-type.vo';
import { InMemoryQuestionOptionRepository } from '@/test/repositories/in-memory-question-option-repository';
import { InMemoryQuestionRepository } from '@/test/repositories/in-memory-question-repository';
import { InvalidInputError } from './errors/invalid-input-error';
import { QuestionNotFoundError } from './errors/question-not-found-error';
import { RepositoryError } from './errors/repository-error';

describe('CreateQuestionOptionUseCase', () => {
  let useCase: CreateQuestionOptionUseCase;
  let questionOptionRepository: InMemoryQuestionOptionRepository;
  let questionRepository: InMemoryQuestionRepository;

  beforeEach(() => {
    questionOptionRepository = new InMemoryQuestionOptionRepository();
    questionRepository = new InMemoryQuestionRepository();
    useCase = new CreateQuestionOptionUseCase(
      questionOptionRepository,
      questionRepository,
    );
  });

  describe('Success Cases', () => {
    it('should create a question option successfully', async () => {
      // Arrange
      const questionId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');
      const question = Question.create(
        {
          text: 'What is the capital of France?',
          type: new QuestionTypeVO('MULTIPLE_CHOICE'),
          assessmentId: new UniqueEntityID('550e8400-e29b-41d4-a716-446655440010'),
        },
        questionId,
      );

      await questionRepository.create(question);

      const request = {
        text: 'Paris',
        questionId: questionId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value).toMatchObject({
          questionOption: {
            id: expect.any(String),
            text: 'Paris',
            questionId: questionId.toString(),
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
          },
        });
      }
    });

    it('should create multiple options for the same question', async () => {
      // Arrange
      const questionId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');
      const question = Question.create(
        {
          text: 'What is the capital of France?',
          type: new QuestionTypeVO('MULTIPLE_CHOICE'),
          assessmentId: new UniqueEntityID('550e8400-e29b-41d4-a716-446655440010'),
        },
        questionId,
      );

      await questionRepository.create(question);

      const requests = [
        { text: 'Paris', questionId: questionId.toString() },
        { text: 'London', questionId: questionId.toString() },
        { text: 'Berlin', questionId: questionId.toString() },
        { text: 'Madrid', questionId: questionId.toString() },
      ];

      // Act
      const results = await Promise.all(
        requests.map((request) => useCase.execute(request)),
      );

      // Assert
      results.forEach((result, index) => {
        expect(result.isRight()).toBe(true);
        if (result.isRight()) {
          expect(result.value).toMatchObject({
            questionOption: {
              text: requests[index].text,
              questionId: questionId.toString(),
            },
          });
        }
      });

      expect(questionOptionRepository.items).toHaveLength(4);
    });

    it('should persist the question option in the repository', async () => {
      // Arrange
      const questionId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');
      const question = Question.create(
        {
          text: 'What is the capital of France?',
          type: new QuestionTypeVO('MULTIPLE_CHOICE'),
          assessmentId: new UniqueEntityID('550e8400-e29b-41d4-a716-446655440010'),
        },
        questionId,
      );

      await questionRepository.create(question);

      const request = {
        text: 'Paris',
        questionId: questionId.toString(),
      };

      // Act
      await useCase.execute(request);

      // Assert
      expect(questionOptionRepository.items).toHaveLength(1);
      expect(questionOptionRepository.items[0]).toMatchObject({
        props: {
          text: 'Paris',
          questionId: expect.objectContaining({ value: questionId.toString() }),
        },
      });
    });
  });

  describe('Validation Cases', () => {
    it('should fail when text is empty', async () => {
      // Arrange
      const request = {
        text: '',
        questionId: 'valid-uuid-question-id',
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('should fail when text is only whitespace', async () => {
      // Arrange
      const request = {
        text: '   ',
        questionId: 'valid-uuid-question-id',
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('should fail when text is too long', async () => {
      // Arrange
      const request = {
        text: 'a'.repeat(501), // Exceeds 500 character limit
        questionId: 'valid-uuid-question-id',
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('should fail when questionId is not a valid UUID', async () => {
      // Arrange
      const request = {
        text: 'Paris',
        questionId: 'invalid-uuid',
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('should fail when questionId is missing', async () => {
      // Arrange
      const request = {
        text: 'Paris',
      } as any;

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('should fail when text is missing', async () => {
      // Arrange
      const request = {
        questionId: 'valid-uuid-question-id',
      } as any;

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });
  });

  describe('Business Logic Cases', () => {
    it('should fail when question does not exist', async () => {
      // Arrange
      const request = {
        text: 'Paris',
        questionId: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID but non-existent
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(QuestionNotFoundError);
    });

    it('should work with both MULTIPLE_CHOICE and OPEN question types', async () => {
      // Arrange
      const multipleChoiceQuestion = Question.create(
        {
          text: 'What is the capital of France?',
          type: new QuestionTypeVO('MULTIPLE_CHOICE'),
          assessmentId: new UniqueEntityID('550e8400-e29b-41d4-a716-446655440010'),
        },
        new UniqueEntityID('550e8400-e29b-41d4-a716-446655440002'),
      );

      const openQuestion = Question.create(
        {
          text: 'Explain photosynthesis',
          type: new QuestionTypeVO('OPEN'),
          assessmentId: new UniqueEntityID('550e8400-e29b-41d4-a716-446655440010'),
        },
        new UniqueEntityID('550e8400-e29b-41d4-a716-446655440003'),
      );

      await questionRepository.create(multipleChoiceQuestion);
      await questionRepository.create(openQuestion);

      const mcRequest = {
        text: 'Paris',
        questionId: '550e8400-e29b-41d4-a716-446655440002',
      };

      const openRequest = {
        text: 'Partial credit option',
        questionId: '550e8400-e29b-41d4-a716-446655440003',
      };

      // Act
      const mcResult = await useCase.execute(mcRequest);
      const openResult = await useCase.execute(openRequest);

      // Assert
      expect(mcResult.isRight()).toBe(true);
      expect(openResult.isRight()).toBe(true);
    });
  });

  describe('Repository Error Cases', () => {
    it('should handle repository errors when fetching question', async () => {
      // Arrange
      const questionId = '550e8400-e29b-41d4-a716-446655440000';
      const request = {
        text: 'Paris',
        questionId,
      };

      // Mock repository to return error
      vi.spyOn(questionRepository, 'findById').mockResolvedValueOnce(
        left(new Error('Database connection failed')),
      );

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(RepositoryError);
      expect((result.value as RepositoryError).message).toContain('Failed to fetch question');
    });

    it('should handle repository errors when creating question option', async () => {
      // Arrange
      const questionId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');
      const question = Question.create(
        {
          text: 'What is the capital of France?',
          type: new QuestionTypeVO('MULTIPLE_CHOICE'),
          assessmentId: new UniqueEntityID('550e8400-e29b-41d4-a716-446655440010'),
        },
        questionId,
      );

      await questionRepository.create(question);

      const request = {
        text: 'Paris',
        questionId: questionId.toString(),
      };

      // Mock repository to return error
      vi.spyOn(questionOptionRepository, 'create').mockResolvedValueOnce(
        left(new Error('Database connection failed')),
      );

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(RepositoryError);
      expect((result.value as RepositoryError).message).toContain(
        'Failed to create question option',
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle text with special characters', async () => {
      // Arrange
      const questionId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');
      const question = Question.create(
        {
          text: 'What is the capital of France?',
          type: new QuestionTypeVO('MULTIPLE_CHOICE'),
          assessmentId: new UniqueEntityID('550e8400-e29b-41d4-a716-446655440010'),
        },
        questionId,
      );

      await questionRepository.create(question);

      const request = {
        text: 'Pàrïs (Frânçe) - €500/m²',
        questionId: questionId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.questionOption.text).toBe('Pàrïs (Frânçe) - €500/m²');
      }
    });

    it('should handle text at maximum length', async () => {
      // Arrange
      const questionId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');
      const question = Question.create(
        {
          text: 'What is the capital of France?',
          type: new QuestionTypeVO('MULTIPLE_CHOICE'),
          assessmentId: new UniqueEntityID('550e8400-e29b-41d4-a716-446655440010'),
        },
        questionId,
      );

      await questionRepository.create(question);

      const maxLengthText = 'a'.repeat(500);
      const request = {
        text: maxLengthText,
        questionId: questionId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.questionOption.text).toBe(maxLengthText);
      }
    });

    it('should handle null and undefined inputs gracefully', async () => {
      // Arrange & Act & Assert
      const nullRequest = await useCase.execute(null as any);
      const undefinedRequest = await useCase.execute(undefined as any);

      expect(nullRequest.isLeft()).toBe(true);
      expect(undefinedRequest.isLeft()).toBe(true);
      expect(nullRequest.value).toBeInstanceOf(InvalidInputError);
      expect(undefinedRequest.value).toBeInstanceOf(InvalidInputError);
    });
  });
});
