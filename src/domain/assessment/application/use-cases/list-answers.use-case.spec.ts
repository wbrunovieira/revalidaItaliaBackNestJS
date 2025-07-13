// src/domain/assessment/application/use-cases/list-answers.use-case.spec.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ListAnswersUseCase } from './list-answers.use-case';
import { InMemoryAnswerRepository } from '@/test/repositories/in-memory-answer-repository';
import { InMemoryQuestionRepository } from '@/test/repositories/in-memory-question-repository';
import { IAnswerRepository } from '../repositories/i-answer.repository';
import { IQuestionRepository } from '../repositories/i-question-repository';
import { Answer } from '@/domain/assessment/enterprise/entities/answer.entity';
import { Question } from '@/domain/assessment/enterprise/entities/question.entity';
import { AnswerTranslationVO } from '@/domain/assessment/enterprise/value-objects/answer-translation.vo';
import { QuestionTypeVO } from '@/domain/assessment/enterprise/value-objects/question-type.vo';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { ListAnswersRequest } from '../dtos/list-answers-request.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { QuestionNotFoundError } from './errors/question-not-found-error';
import { RepositoryError } from './errors/repository-error';

let useCase: ListAnswersUseCase;
let answerRepository: InMemoryAnswerRepository;
let questionRepository: InMemoryQuestionRepository;

describe('ListAnswersUseCase', () => {
  beforeEach(() => {
    answerRepository = new InMemoryAnswerRepository();
    questionRepository = new InMemoryQuestionRepository();
    useCase = new ListAnswersUseCase(answerRepository, questionRepository);
  });

  describe('Success Cases', () => {
    it('should successfully list all answers with default pagination', async () => {
      // Arrange
      const questionId1 = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');
      const questionId2 = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440002');

      const answer1 = Answer.create({
        explanation: 'First answer explanation',
        questionId: questionId1,
        translations: [],
      });

      const answer2 = Answer.create({
        explanation: 'Second answer explanation',
        questionId: questionId2,
        translations: [],
      });

      const answer3 = Answer.create({
        correctOptionId: new UniqueEntityID('550e8400-e29b-41d4-a716-446655440003'),
        explanation: 'Third answer explanation',
        questionId: questionId1,
        translations: [],
      });

      await answerRepository.create(answer1);
      await answerRepository.create(answer2);
      await answerRepository.create(answer3);

      const request: ListAnswersRequest = {};

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      
      if (result.isRight()) {
        const response = result.value;
        
        expect(response.answers).toHaveLength(3);
        expect(response.answers[0].explanation).toBe('First answer explanation'); // First created (in creation order)
        expect(response.answers[1].explanation).toBe('Second answer explanation');
        expect(response.answers[2].explanation).toBe('Third answer explanation');
        
        expect(response.pagination.page).toBe(1);
        expect(response.pagination.limit).toBe(10);
        expect(response.pagination.total).toBe(3);
        expect(response.pagination.totalPages).toBe(1);
        expect(response.pagination.hasNext).toBe(false);
        expect(response.pagination.hasPrevious).toBe(false);
      }
    });

    it('should successfully list answers with custom pagination', async () => {
      // Arrange
      const questionId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');

      // Create 15 answers
      for (let i = 1; i <= 15; i++) {
        const answer = Answer.create({
          explanation: `Answer ${i} explanation`,
          questionId: questionId,
          translations: [],
        });
        await answerRepository.create(answer);
      }

      const request: ListAnswersRequest = {
        page: 2,
        limit: 5,
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      
      if (result.isRight()) {
        const response = result.value;
        
        expect(response.answers).toHaveLength(5);
        expect(response.pagination.page).toBe(2);
        expect(response.pagination.limit).toBe(5);
        expect(response.pagination.total).toBe(15);
        expect(response.pagination.totalPages).toBe(3);
        expect(response.pagination.hasNext).toBe(true);
        expect(response.pagination.hasPrevious).toBe(true);
      }
    });

    it('should successfully list answers filtered by questionId', async () => {
      // Arrange
      const questionId1 = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');
      const questionId2 = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440002');
      const assessmentId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440003');

      const question1 = Question.create({
        text: 'Question 1',
        type: new QuestionTypeVO('MULTIPLE_CHOICE'),
        assessmentId: assessmentId,
      }, questionId1);

      const question2 = Question.create({
        text: 'Question 2',
        type: new QuestionTypeVO('OPEN'),
        assessmentId: assessmentId,
      }, questionId2);

      const answer1 = Answer.create({
        explanation: 'Answer for question 1',
        questionId: questionId1,
        translations: [],
      });

      const answer2 = Answer.create({
        explanation: 'Another answer for question 1',
        questionId: questionId1,
        translations: [],
      });

      const answer3 = Answer.create({
        explanation: 'Answer for question 2',
        questionId: questionId2,
        translations: [],
      });

      await questionRepository.create(question1);
      await questionRepository.create(question2);
      await answerRepository.create(answer1);
      await answerRepository.create(answer2);
      await answerRepository.create(answer3);

      const request: ListAnswersRequest = {
        questionId: questionId1.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      
      if (result.isRight()) {
        const response = result.value;
        
        expect(response.answers).toHaveLength(2);
        expect(response.answers.every(answer => answer.questionId === questionId1.toString())).toBe(true);
        expect(response.pagination.total).toBe(2);
      }
    });

    it('should successfully list answers with translations', async () => {
      // Arrange
      const questionId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');

      const ptTranslation = new AnswerTranslationVO('pt', 'Explicação em português');
      const itTranslation = new AnswerTranslationVO('it', 'Spiegazione in italiano');

      const answer = Answer.create({
        explanation: 'English explanation',
        questionId: questionId,
        translations: [ptTranslation, itTranslation],
      });

      await answerRepository.create(answer);

      const request: ListAnswersRequest = {};

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      
      if (result.isRight()) {
        const response = result.value;
        
        expect(response.answers).toHaveLength(1);
        expect(response.answers[0].translations).toHaveLength(2);
        expect(response.answers[0].translations.find(t => t.locale === 'pt')?.explanation).toBe('Explicação em português');
        expect(response.answers[0].translations.find(t => t.locale === 'it')?.explanation).toBe('Spiegazione in italiano');
      }
    });

    it('should return empty list when no answers exist', async () => {
      // Arrange
      const request: ListAnswersRequest = {};

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      
      if (result.isRight()) {
        const response = result.value;
        
        expect(response.answers).toHaveLength(0);
        expect(response.pagination.page).toBe(1);
        expect(response.pagination.limit).toBe(10);
        expect(response.pagination.total).toBe(0);
        expect(response.pagination.totalPages).toBe(0);
        expect(response.pagination.hasNext).toBe(false);
        expect(response.pagination.hasPrevious).toBe(false);
      }
    });

    it('should return empty list when filtering by questionId with no answers', async () => {
      // Arrange
      const questionId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');
      const assessmentId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440002');

      const question = Question.create({
        text: 'Question without answers',
        type: new QuestionTypeVO('MULTIPLE_CHOICE'),
        assessmentId: assessmentId,
      }, questionId);

      await questionRepository.create(question);

      const request: ListAnswersRequest = {
        questionId: questionId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      
      if (result.isRight()) {
        const response = result.value;
        
        expect(response.answers).toHaveLength(0);
        expect(response.pagination.total).toBe(0);
      }
    });
  });

  describe('Validation Errors', () => {
    it('should return InvalidInputError for negative page number', async () => {
      // Arrange
      const request: ListAnswersRequest = {
        page: -1,
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('should return InvalidInputError for zero page number', async () => {
      // Arrange
      const request: ListAnswersRequest = {
        page: 0,
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('should return InvalidInputError for non-integer page', async () => {
      // Arrange
      const request: ListAnswersRequest = {
        page: 1.5,
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('should return InvalidInputError for negative limit', async () => {
      // Arrange
      const request: ListAnswersRequest = {
        limit: -1,
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('should return InvalidInputError for zero limit', async () => {
      // Arrange
      const request: ListAnswersRequest = {
        limit: 0,
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('should return InvalidInputError for limit exceeding maximum', async () => {
      // Arrange
      const request: ListAnswersRequest = {
        limit: 101,
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('should return InvalidInputError for non-integer limit', async () => {
      // Arrange
      const request: ListAnswersRequest = {
        limit: 10.5,
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('should return InvalidInputError for invalid questionId format', async () => {
      // Arrange
      const request: ListAnswersRequest = {
        questionId: 'invalid-uuid',
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('should return InvalidInputError for malformed questionId', async () => {
      // Arrange
      const request: ListAnswersRequest = {
        questionId: '550e8400e29b41d4a716446655440000', // Missing hyphens
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('should return InvalidInputError for extra properties in request', async () => {
      // Arrange
      const request = {
        page: 1,
        limit: 10,
        extraProperty: 'should not be allowed',
      } as any;

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });
  });

  describe('Business Rule Errors', () => {
    it('should return QuestionNotFoundError when questionId does not exist', async () => {
      // Arrange
      const request: ListAnswersRequest = {
        questionId: '550e8400-e29b-41d4-a716-446655440000',
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(QuestionNotFoundError);
    });
  });

  describe('Repository Errors', () => {
    it('should return RepositoryError when question repository fails', async () => {
      // Arrange
      const request: ListAnswersRequest = {
        questionId: '550e8400-e29b-41d4-a716-446655440000',
      };

      // Mock repository to fail
      vi.spyOn(questionRepository, 'findById').mockRejectedValue(new Error('Database error'));

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(RepositoryError);
    });

    it('should return RepositoryError when answer repository fails', async () => {
      // Arrange
      const request: ListAnswersRequest = {};

      // Mock repository to fail
      vi.spyOn(answerRepository, 'findAllPaginated').mockRejectedValue(new Error('Database error'));

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(RepositoryError);
    });

    it('should return RepositoryError when answer repository returns left', async () => {
      // Arrange
      const request: ListAnswersRequest = {};

      // Mock repository to return error
      vi.spyOn(answerRepository, 'findAllPaginated').mockResolvedValue({
        isLeft: () => true,
        isRight: () => false,
        value: new Error('Repository error'),
      } as any);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(RepositoryError);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single answer correctly', async () => {
      // Arrange
      const questionId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');

      const answer = Answer.create({
        explanation: 'Single answer',
        questionId: questionId,
        translations: [],
      });

      await answerRepository.create(answer);

      const request: ListAnswersRequest = {};

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      
      if (result.isRight()) {
        const response = result.value;
        
        expect(response.answers).toHaveLength(1);
        expect(response.pagination.totalPages).toBe(1);
        expect(response.pagination.hasNext).toBe(false);
        expect(response.pagination.hasPrevious).toBe(false);
      }
    });

    it('should handle exactly limit number of answers', async () => {
      // Arrange
      const questionId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');

      // Create exactly 10 answers (default limit)
      for (let i = 1; i <= 10; i++) {
        const answer = Answer.create({
          explanation: `Answer ${i}`,
          questionId: questionId,
          translations: [],
        });
        await answerRepository.create(answer);
      }

      const request: ListAnswersRequest = {};

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      
      if (result.isRight()) {
        const response = result.value;
        
        expect(response.answers).toHaveLength(10);
        expect(response.pagination.totalPages).toBe(1);
        expect(response.pagination.hasNext).toBe(false);
      }
    });

    it('should handle maximum limit value', async () => {
      // Arrange
      const questionId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');

      // Create 150 answers
      for (let i = 1; i <= 150; i++) {
        const answer = Answer.create({
          explanation: `Answer ${i}`,
          questionId: questionId,
          translations: [],
        });
        await answerRepository.create(answer);
      }

      const request: ListAnswersRequest = {
        limit: 100, // Maximum allowed
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      
      if (result.isRight()) {
        const response = result.value;
        
        expect(response.answers).toHaveLength(100);
        expect(response.pagination.total).toBe(150);
        expect(response.pagination.totalPages).toBe(2);
        expect(response.pagination.hasNext).toBe(true);
      }
    });

    it('should handle very large page number', async () => {
      // Arrange
      const questionId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');

      const answer = Answer.create({
        explanation: 'Single answer',
        questionId: questionId,
        translations: [],
      });

      await answerRepository.create(answer);

      const request: ListAnswersRequest = {
        page: 999999,
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      
      if (result.isRight()) {
        const response = result.value;
        
        expect(response.answers).toHaveLength(0);
        expect(response.pagination.page).toBe(999999);
        expect(response.pagination.total).toBe(1);
        expect(response.pagination.hasNext).toBe(false);
        expect(response.pagination.hasPrevious).toBe(true);
      }
    });

    it('should handle answers with very long explanations', async () => {
      // Arrange
      const questionId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');
      const longExplanation = 'A'.repeat(5000); // Very long explanation

      const answer = Answer.create({
        explanation: longExplanation,
        questionId: questionId,
        translations: [],
      });

      await answerRepository.create(answer);

      const request: ListAnswersRequest = {};

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      
      if (result.isRight()) {
        const response = result.value;
        
        expect(response.answers).toHaveLength(1);
        expect(response.answers[0].explanation).toHaveLength(5000);
        expect(response.answers[0].explanation).toBe(longExplanation);
      }
    });
  });
});