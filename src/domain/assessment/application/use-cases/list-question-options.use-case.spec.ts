// src/domain/assessment/application/use-cases/list-question-options.use-case.spec.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ListQuestionOptionsUseCase } from './list-question-options.use-case';
import { InMemoryQuestionOptionRepository } from '@/test/repositories/in-memory-question-option-repository';
import { InMemoryQuestionRepository } from '@/test/repositories/in-memory-question-repository';
import { IQuestionOptionRepository } from '../repositories/i-question-option-repository';
import { IQuestionRepository } from '../repositories/i-question-repository';
import { QuestionOption } from '@/domain/assessment/enterprise/entities/question-option.entity';
import { Question } from '@/domain/assessment/enterprise/entities/question.entity';
import { QuestionTypeVO } from '@/domain/assessment/enterprise/value-objects/question-type.vo';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { ListQuestionOptionsRequest } from '../dtos/list-question-options-request.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { QuestionNotFoundError } from './errors/question-not-found-error';
import { RepositoryError } from './errors/repository-error';

let useCase: ListQuestionOptionsUseCase;
let questionOptionRepository: InMemoryQuestionOptionRepository;
let questionRepository: InMemoryQuestionRepository;

describe('ListQuestionOptionsUseCase', () => {
  beforeEach(() => {
    questionOptionRepository = new InMemoryQuestionOptionRepository();
    questionRepository = new InMemoryQuestionRepository();
    useCase = new ListQuestionOptionsUseCase(
      questionOptionRepository,
      questionRepository,
    );
  });

  describe('Success Cases', () => {
    it('should successfully list question options', async () => {
      // Arrange
      const assessmentId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440001',
      );
      const questionId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440002',
      );

      const question = Question.create(
        {
          text: 'What is the capital of Brazil?',
          type: new QuestionTypeVO('MULTIPLE_CHOICE'),
          assessmentId,
        },
        questionId,
      );

      const option1 = QuestionOption.create(
        {
          text: 'São Paulo',
          questionId,
        },
        new UniqueEntityID('550e8400-e29b-41d4-a716-446655440003'),
      );

      const option2 = QuestionOption.create(
        {
          text: 'Rio de Janeiro',
          questionId,
        },
        new UniqueEntityID('550e8400-e29b-41d4-a716-446655440004'),
      );

      const option3 = QuestionOption.create(
        {
          text: 'Brasília',
          questionId,
        },
        new UniqueEntityID('550e8400-e29b-41d4-a716-446655440005'),
      );

      await questionRepository.create(question);
      await questionOptionRepository.create(option1);
      await questionOptionRepository.create(option2);
      await questionOptionRepository.create(option3);

      const request: ListQuestionOptionsRequest = {
        questionId: questionId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const response = result.value;

        expect(response.options).toHaveLength(3);

        // Verify all options are present (order may vary)
        const optionTexts = response.options.map((o) => o.text);
        expect(optionTexts).toContain('São Paulo');
        expect(optionTexts).toContain('Rio de Janeiro');
        expect(optionTexts).toContain('Brasília');

        // Verify structure of first option
        expect(response.options[0]).toHaveProperty('id');
        expect(response.options[0]).toHaveProperty('text');
        expect(response.options[0]).toHaveProperty(
          'questionId',
          questionId.toString(),
        );
        expect(response.options[0]).toHaveProperty('createdAt');
        expect(response.options[0]).toHaveProperty('updatedAt');
      }
    });

    it('should return empty array when question has no options', async () => {
      // Arrange
      const assessmentId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440001',
      );
      const questionId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440002',
      );

      const question = Question.create(
        {
          text: 'Open question without options',
          type: new QuestionTypeVO('OPEN'),
          assessmentId,
        },
        questionId,
      );

      await questionRepository.create(question);

      const request: ListQuestionOptionsRequest = {
        questionId: questionId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.options).toHaveLength(0);
      }
    });

    it('should list options in creation order', async () => {
      // Arrange
      const assessmentId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440001',
      );
      const questionId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440002',
      );

      const question = Question.create(
        {
          text: 'Question with ordered options',
          type: new QuestionTypeVO('MULTIPLE_CHOICE'),
          assessmentId,
        },
        questionId,
      );

      await questionRepository.create(question);

      // Create options with delays to ensure different timestamps
      const option1 = QuestionOption.create({
        text: 'Option A',
        questionId,
      });
      await questionOptionRepository.create(option1);
      await new Promise((resolve) => setTimeout(resolve, 1));

      const option2 = QuestionOption.create({
        text: 'Option B',
        questionId,
      });
      await questionOptionRepository.create(option2);
      await new Promise((resolve) => setTimeout(resolve, 1));

      const option3 = QuestionOption.create({
        text: 'Option C',
        questionId,
      });
      await questionOptionRepository.create(option3);

      const request: ListQuestionOptionsRequest = {
        questionId: questionId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const response = result.value;
        expect(response.options).toHaveLength(3);

        // Options should be in creation order (ascending by createdAt)
        expect(response.options[0].text).toBe('Option A');
        expect(response.options[1].text).toBe('Option B');
        expect(response.options[2].text).toBe('Option C');
      }
    });
  });

  describe('Validation Errors', () => {
    it('should return InvalidInputError for missing questionId', async () => {
      // Arrange
      const request = {} as ListQuestionOptionsRequest;

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should return InvalidInputError for empty questionId', async () => {
      // Arrange
      const request: ListQuestionOptionsRequest = {
        questionId: '',
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should return InvalidInputError for invalid UUID format', async () => {
      // Arrange
      const request: ListQuestionOptionsRequest = {
        questionId: 'invalid-uuid',
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should return InvalidInputError for malformed UUID', async () => {
      // Arrange
      const request: ListQuestionOptionsRequest = {
        questionId: '550e8400e29b41d4a716446655440000', // Missing hyphens
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should return InvalidInputError for extra properties', async () => {
      // Arrange
      const request = {
        questionId: '550e8400-e29b-41d4-a716-446655440001',
        extraProperty: 'should not be allowed',
      } as any;

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });

    it('should return InvalidInputError for non-string questionId', async () => {
      // Arrange
      const request = {
        questionId: 123,
      } as any;

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidInputError);
      }
    });
  });

  describe('Business Rule Errors', () => {
    it('should return QuestionNotFoundError when question does not exist', async () => {
      // Arrange
      const request: ListQuestionOptionsRequest = {
        questionId: '550e8400-e29b-41d4-a716-446655440001',
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(QuestionNotFoundError);
      }
    });
  });

  describe('Repository Errors', () => {
    it('should return RepositoryError when question repository fails', async () => {
      // Arrange
      const request: ListQuestionOptionsRequest = {
        questionId: '550e8400-e29b-41d4-a716-446655440001',
      };

      // Mock repository to fail
      vi.spyOn(questionRepository, 'findById').mockRejectedValue(
        new Error('Database error'),
      );

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe('Failed to fetch question');
      }
    });

    it('should return QuestionNotFoundError when question repository returns left', async () => {
      // Arrange
      const request: ListQuestionOptionsRequest = {
        questionId: '550e8400-e29b-41d4-a716-446655440001',
      };

      // Mock repository to return left (not found)
      vi.spyOn(questionRepository, 'findById').mockResolvedValue({
        isLeft: () => true,
        isRight: () => false,
        value: new Error('Question not found'),
      } as any);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(QuestionNotFoundError);
      }
    });

    it('should return RepositoryError when question option repository fails', async () => {
      // Arrange
      const assessmentId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440001',
      );
      const questionId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440002',
      );

      const question = Question.create(
        {
          text: 'Test question',
          type: new QuestionTypeVO('MULTIPLE_CHOICE'),
          assessmentId,
        },
        questionId,
      );

      await questionRepository.create(question);

      const request: ListQuestionOptionsRequest = {
        questionId: questionId.toString(),
      };

      // Mock repository to fail
      vi.spyOn(questionOptionRepository, 'findByQuestionId').mockRejectedValue(
        new Error('Database error'),
      );

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe('Failed to fetch question options');
      }
    });

    it('should return RepositoryError when question option repository returns left', async () => {
      // Arrange
      const assessmentId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440001',
      );
      const questionId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440002',
      );

      const question = Question.create(
        {
          text: 'Test question',
          type: new QuestionTypeVO('MULTIPLE_CHOICE'),
          assessmentId,
        },
        questionId,
      );

      await questionRepository.create(question);

      const request: ListQuestionOptionsRequest = {
        questionId: questionId.toString(),
      };

      // Mock repository to return error
      vi.spyOn(questionOptionRepository, 'findByQuestionId').mockResolvedValue({
        isLeft: () => true,
        isRight: () => false,
        value: new Error('Repository error'),
      } as any);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe('Failed to fetch question options');
      }
    });

    it('should return RepositoryError when unexpected error occurs', async () => {
      // Arrange
      const request: ListQuestionOptionsRequest = {
        questionId: '550e8400-e29b-41d4-a716-446655440001',
      };

      // Mock to throw unexpected error
      vi.spyOn(questionRepository, 'findById').mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(RepositoryError);
        expect(result.value.message).toBe('Failed to fetch question');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle question with single option', async () => {
      // Arrange
      const assessmentId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440001',
      );
      const questionId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440002',
      );

      const question = Question.create(
        {
          text: 'Question with single option',
          type: new QuestionTypeVO('MULTIPLE_CHOICE'),
          assessmentId,
        },
        questionId,
      );

      const option = QuestionOption.create({
        text: 'Only option',
        questionId,
      });

      await questionRepository.create(question);
      await questionOptionRepository.create(option);

      const request: ListQuestionOptionsRequest = {
        questionId: questionId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const response = result.value;
        expect(response.options).toHaveLength(1);
        expect(response.options[0].text).toBe('Only option');
      }
    });

    it('should handle options with very long text', async () => {
      // Arrange
      const assessmentId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440001',
      );
      const questionId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440002',
      );

      const question = Question.create(
        {
          text: 'Question with long option text',
          type: new QuestionTypeVO('MULTIPLE_CHOICE'),
          assessmentId,
        },
        questionId,
      );

      const longText = 'A'.repeat(500); // Maximum allowed length
      const option = QuestionOption.create({
        text: longText,
        questionId,
      });

      await questionRepository.create(question);
      await questionOptionRepository.create(option);

      const request: ListQuestionOptionsRequest = {
        questionId: questionId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const response = result.value;
        expect(response.options).toHaveLength(1);
        expect(response.options[0].text).toBe(longText);
        expect(response.options[0].text).toHaveLength(500);
      }
    });

    it('should handle multiple questions with different options', async () => {
      // Arrange
      const assessmentId = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440001',
      );
      const questionId1 = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440002',
      );
      const questionId2 = new UniqueEntityID(
        '550e8400-e29b-41d4-a716-446655440003',
      );

      const question1 = Question.create(
        {
          text: 'Question 1',
          type: new QuestionTypeVO('MULTIPLE_CHOICE'),
          assessmentId,
        },
        questionId1,
      );

      const question2 = Question.create(
        {
          text: 'Question 2',
          type: new QuestionTypeVO('MULTIPLE_CHOICE'),
          assessmentId,
        },
        questionId2,
      );

      // Options for question 1
      const option1Q1 = QuestionOption.create({
        text: 'Q1 Option A',
        questionId: questionId1,
      });

      const option2Q1 = QuestionOption.create({
        text: 'Q1 Option B',
        questionId: questionId1,
      });

      // Options for question 2
      const option1Q2 = QuestionOption.create({
        text: 'Q2 Option A',
        questionId: questionId2,
      });

      await questionRepository.create(question1);
      await questionRepository.create(question2);
      await questionOptionRepository.create(option1Q1);
      await questionOptionRepository.create(option2Q1);
      await questionOptionRepository.create(option1Q2);

      const request: ListQuestionOptionsRequest = {
        questionId: questionId1.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const response = result.value;
        expect(response.options).toHaveLength(2);

        // Should only return options for question 1
        const optionTexts = response.options.map((o) => o.text);
        expect(optionTexts).toContain('Q1 Option A');
        expect(optionTexts).toContain('Q1 Option B');
        expect(optionTexts).not.toContain('Q2 Option A');
      }
    });
  });
});
