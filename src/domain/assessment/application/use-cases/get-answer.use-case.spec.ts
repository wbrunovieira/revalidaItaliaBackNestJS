// src/domain/assessment/application/use-cases/get-answer.use-case.spec.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetAnswerUseCase } from './get-answer.use-case';
import { InMemoryAnswerRepository } from '@/test/repositories/in-memory-answer-repository';
import { IAnswerRepository } from '../repositories/i-answer.repository';
import { Answer } from '@/domain/assessment/enterprise/entities/answer.entity';
import { AnswerTranslationVO } from '@/domain/assessment/enterprise/value-objects/answer-translation.vo';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { GetAnswerRequest } from '../dtos/get-answer-request.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { AnswerNotFoundError } from './errors/answer-not-found-error';
import { RepositoryError } from './errors/repository-error';

let useCase: GetAnswerUseCase;
let answerRepository: InMemoryAnswerRepository;

describe('GetAnswerUseCase', () => {
  beforeEach(() => {
    answerRepository = new InMemoryAnswerRepository();
    useCase = new GetAnswerUseCase(answerRepository);
  });

  describe('Success Cases', () => {
    it('should successfully get answer by id', async () => {
      // Arrange
      const answerId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const questionId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');

      const answer = Answer.create({
        explanation: 'This is the correct answer explanation',
        questionId: questionId,
        translations: [],
      }, answerId);

      await answerRepository.create(answer);

      const request: GetAnswerRequest = {
        id: answerId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      
      if (result.isRight()) {
        const response = result.value;
        
        expect(response.answer.id).toBe(answerId.toString());
        expect(response.answer.explanation).toBe('This is the correct answer explanation');
        expect(response.answer.questionId).toBe(questionId.toString());
        expect(response.answer.correctOptionId).toBeUndefined();
        expect(response.answer.translations).toEqual([]);
        expect(response.answer.createdAt).toBeInstanceOf(Date);
        expect(response.answer.updatedAt).toBeInstanceOf(Date);
      }
    });

    it('should successfully get answer with correct option id', async () => {
      // Arrange
      const answerId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const questionId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');
      const correctOptionId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440002');

      const answer = Answer.create({
        correctOptionId: correctOptionId,
        explanation: 'Multiple choice answer explanation',
        questionId: questionId,
        translations: [],
      }, answerId);

      await answerRepository.create(answer);

      const request: GetAnswerRequest = {
        id: answerId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      
      if (result.isRight()) {
        const response = result.value;
        
        expect(response.answer.id).toBe(answerId.toString());
        expect(response.answer.correctOptionId).toBe(correctOptionId.toString());
        expect(response.answer.explanation).toBe('Multiple choice answer explanation');
        expect(response.answer.questionId).toBe(questionId.toString());
      }
    });

    it('should successfully get answer with translations', async () => {
      // Arrange
      const answerId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const questionId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');

      const ptTranslation = new AnswerTranslationVO('pt', 'Explicação em português');
      const itTranslation = new AnswerTranslationVO('it', 'Spiegazione in italiano');
      const esTranslation = new AnswerTranslationVO('es', 'Explicación en español');

      const answer = Answer.create({
        explanation: 'Default explanation in English',
        questionId: questionId,
        translations: [ptTranslation, itTranslation, esTranslation],
      }, answerId);

      await answerRepository.create(answer);

      const request: GetAnswerRequest = {
        id: answerId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      
      if (result.isRight()) {
        const response = result.value;
        
        expect(response.answer.id).toBe(answerId.toString());
        expect(response.answer.explanation).toBe('Default explanation in English');
        expect(response.answer.translations).toHaveLength(3);
        
        const translations = response.answer.translations;
        expect(translations.find(t => t.locale === 'pt')?.explanation).toBe('Explicação em português');
        expect(translations.find(t => t.locale === 'it')?.explanation).toBe('Spiegazione in italiano');
        expect(translations.find(t => t.locale === 'es')?.explanation).toBe('Explicación en español');
      }
    });

    it('should successfully get answer with complete data', async () => {
      // Arrange
      const answerId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const questionId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');
      const correctOptionId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440002');

      const ptTranslation = new AnswerTranslationVO('pt', 'Resposta completa em português');

      const answer = Answer.create({
        correctOptionId: correctOptionId,
        explanation: 'Complete answer explanation',
        questionId: questionId,
        translations: [ptTranslation],
      }, answerId);

      await answerRepository.create(answer);

      const request: GetAnswerRequest = {
        id: answerId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      
      if (result.isRight()) {
        const response = result.value;
        
        expect(response.answer.id).toBe(answerId.toString());
        expect(response.answer.correctOptionId).toBe(correctOptionId.toString());
        expect(response.answer.explanation).toBe('Complete answer explanation');
        expect(response.answer.questionId).toBe(questionId.toString());
        expect(response.answer.translations).toHaveLength(1);
        expect(response.answer.translations[0].locale).toBe('pt');
        expect(response.answer.translations[0].explanation).toBe('Resposta completa em português');
        expect(response.answer.createdAt).toBeInstanceOf(Date);
        expect(response.answer.updatedAt).toBeInstanceOf(Date);
      }
    });
  });

  describe('Validation Errors', () => {
    it('should return InvalidInputError for missing id', async () => {
      // Arrange
      const request = {} as GetAnswerRequest;

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('should return InvalidInputError for null id', async () => {
      // Arrange
      const request: GetAnswerRequest = {
        id: null as any,
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('should return InvalidInputError for undefined id', async () => {
      // Arrange
      const request: GetAnswerRequest = {
        id: undefined as any,
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('should return InvalidInputError for empty string id', async () => {
      // Arrange
      const request: GetAnswerRequest = {
        id: '',
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('should return InvalidInputError for invalid UUID format', async () => {
      // Arrange
      const request: GetAnswerRequest = {
        id: 'invalid-uuid',
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('should return InvalidInputError for UUID with wrong length', async () => {
      // Arrange
      const request: GetAnswerRequest = {
        id: '550e8400-e29b-41d4-a716-44665544000', // Missing one character
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('should return InvalidInputError for UUID with invalid characters', async () => {
      // Arrange
      const request: GetAnswerRequest = {
        id: '550e8400-e29b-41d4-a716-44665544000g', // Contains 'g' which is invalid in hex
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });

    it('should return InvalidInputError for malformed UUID', async () => {
      // Arrange
      const request: GetAnswerRequest = {
        id: '550e8400e29b41d4a716446655440000', // Missing hyphens
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(InvalidInputError);
    });
  });

  describe('Business Rule Errors', () => {
    it('should return AnswerNotFoundError when answer does not exist', async () => {
      // Arrange
      const request: GetAnswerRequest = {
        id: '550e8400-e29b-41d4-a716-446655440000',
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(AnswerNotFoundError);
    });

    it('should return AnswerNotFoundError for different UUID that does not exist', async () => {
      // Arrange
      const existingAnswerId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const questionId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');

      const answer = Answer.create({
        explanation: 'Some explanation',
        questionId: questionId,
        translations: [],
      }, existingAnswerId);

      await answerRepository.create(answer);

      const request: GetAnswerRequest = {
        id: '550e8400-e29b-41d4-a716-446655440999', // Different ID
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(AnswerNotFoundError);
    });
  });

  describe('Repository Errors', () => {
    it('should return RepositoryError when repository throws error', async () => {
      // Arrange
      const request: GetAnswerRequest = {
        id: '550e8400-e29b-41d4-a716-446655440000',
      };

      // Mock repository to throw error
      vi.spyOn(answerRepository, 'findById').mockRejectedValue(new Error('Database connection failed'));

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(RepositoryError);
    });

    it('should return RepositoryError when repository has timeout', async () => {
      // Arrange
      const request: GetAnswerRequest = {
        id: '550e8400-e29b-41d4-a716-446655440000',
      };

      // Mock repository to throw timeout error
      vi.spyOn(answerRepository, 'findById').mockRejectedValue(new Error('Connection timeout'));

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(RepositoryError);
    });

    it('should return RepositoryError when repository returns unexpected error', async () => {
      // Arrange
      const request: GetAnswerRequest = {
        id: '550e8400-e29b-41d4-a716-446655440000',
      };

      // Mock repository to throw unexpected error
      vi.spyOn(answerRepository, 'findById').mockRejectedValue(new TypeError('Unexpected error'));

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(RepositoryError);
    });
  });

  describe('Edge Cases', () => {
    it('should handle answer with minimal required data only', async () => {
      // Arrange
      const answerId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const questionId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');

      const answer = Answer.create({
        explanation: 'Minimal explanation',
        questionId: questionId,
        translations: [],
      }, answerId);

      await answerRepository.create(answer);

      const request: GetAnswerRequest = {
        id: answerId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      
      if (result.isRight()) {
        const response = result.value;
        
        expect(response.answer.id).toBe(answerId.toString());
        expect(response.answer.explanation).toBe('Minimal explanation');
        expect(response.answer.questionId).toBe(questionId.toString());
        expect(response.answer.correctOptionId).toBeUndefined();
        expect(response.answer.translations).toEqual([]);
      }
    });

    it('should handle answer with very long explanation', async () => {
      // Arrange
      const answerId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const questionId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');
      const longExplanation = 'A'.repeat(1000); // Very long explanation

      const answer = Answer.create({
        explanation: longExplanation,
        questionId: questionId,
        translations: [],
      }, answerId);

      await answerRepository.create(answer);

      const request: GetAnswerRequest = {
        id: answerId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      
      if (result.isRight()) {
        const response = result.value;
        
        expect(response.answer.id).toBe(answerId.toString());
        expect(response.answer.explanation).toBe(longExplanation);
        expect(response.answer.explanation).toHaveLength(1000);
      }
    });

    it('should handle answer with special characters in explanation', async () => {
      // Arrange
      const answerId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440000');
      const questionId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');
      const specialCharsExplanation = 'Explanation with special chars: áéíóú ñ ç @#$%^&*()';

      const answer = Answer.create({
        explanation: specialCharsExplanation,
        questionId: questionId,
        translations: [],
      }, answerId);

      await answerRepository.create(answer);

      const request: GetAnswerRequest = {
        id: answerId.toString(),
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      
      if (result.isRight()) {
        const response = result.value;
        
        expect(response.answer.id).toBe(answerId.toString());
        expect(response.answer.explanation).toBe(specialCharsExplanation);
      }
    });

    it('should handle valid UUID in different formats', async () => {
      // Arrange
      const answerId = new UniqueEntityID('550E8400-E29B-41D4-A716-446655440000'); // Uppercase
      const questionId = new UniqueEntityID('550e8400-e29b-41d4-a716-446655440001');

      const answer = Answer.create({
        explanation: 'Test explanation',
        questionId: questionId,
        translations: [],
      }, answerId);

      await answerRepository.create(answer);

      const request: GetAnswerRequest = {
        id: '550E8400-E29B-41D4-A716-446655440000', // Uppercase UUID
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isRight()).toBe(true);
      
      if (result.isRight()) {
        const response = result.value;
        expect(response.answer.id).toBe(answerId.toString());
      }
    });
  });
});