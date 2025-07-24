// src/infra/controllers/tests/answer/post-create-answer.controller.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
  BadRequestException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { left, right } from '@/core/either';
import { AnswerControllerTestSetup } from './shared/answer-controller-test-setup';
import { InvalidInputError } from '@/domain/assessment/application/use-cases/errors/invalid-input-error';
import { AnswerAlreadyExistsError } from '@/domain/assessment/application/use-cases/errors/answer-already-exists-error';
import { QuestionNotFoundError } from '@/domain/assessment/application/use-cases/errors/question-not-found-error';
import { AssessmentNotFoundError } from '@/domain/assessment/application/use-cases/errors/assessment-not-found-error';
import { InvalidAnswerTypeError } from '@/domain/assessment/application/use-cases/errors/invalid-answer-type-error';
import { RepositoryError } from '@/domain/assessment/application/use-cases/errors/repository-error';
import { CreateAnswerDto } from '@/domain/assessment/application/dtos/create-answer.dto';

describe('AnswerController - create', () => {
  let testSetup: AnswerControllerTestSetup;

  beforeEach(() => {
    testSetup = new AnswerControllerTestSetup();
  });

  describe('Success Cases', () => {
    it('should create answer successfully with minimal data', async () => {
      const dto: CreateAnswerDto = {
        explanation: 'This is the correct answer explanation',
        questionId: '550e8400-e29b-41d4-a716-446655440022',
      };

      const mockResponse = {
        answer: {
          id: '550e8400-e29b-41d4-a716-446655440023',
          correctOptionId: undefined,
          explanation: 'This is the correct answer explanation',
          questionId: '550e8400-e29b-41d4-a716-446655440022',
          translations: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      testSetup.createAnswerUseCase.execute.mockResolvedValueOnce(
        right(mockResponse),
      );

      const result = await testSetup.controller.create(dto);

      expect(testSetup.createAnswerUseCase.execute).toHaveBeenCalledWith({
        correctOptionId: dto.correctOptionId,
        explanation: dto.explanation,
        questionId: dto.questionId,
        translations: dto.translations,
      });

      expect(result).toEqual(mockResponse);
    });

    it('should create answer with correct option ID for multiple choice', async () => {
      const dto: CreateAnswerDto = {
        explanation: 'This is the correct answer explanation',
        questionId: '550e8400-e29b-41d4-a716-446655440022',
        correctOptionId: '550e8400-e29b-41d4-a716-446655440024',
      };

      const mockResponse = {
        answer: {
          id: '550e8400-e29b-41d4-a716-446655440023',
          correctOptionId: '550e8400-e29b-41d4-a716-446655440024',
          explanation: 'This is the correct answer explanation',
          questionId: '550e8400-e29b-41d4-a716-446655440022',
          translations: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      testSetup.createAnswerUseCase.execute.mockResolvedValueOnce(
        right(mockResponse),
      );

      const result = await testSetup.controller.create(dto);

      expect(result.answer.correctOptionId).toBe(dto.correctOptionId);
    });

    it('should create answer with translations', async () => {
      const dto: CreateAnswerDto = {
        explanation: 'This is the correct answer explanation',
        questionId: '550e8400-e29b-41d4-a716-446655440022',
        translations: [
          { locale: 'pt', explanation: 'Esta é a explicação correta' },
          { locale: 'it', explanation: 'Questa è la spiegazione corretta' },
        ],
      };

      const mockResponse = {
        answer: {
          id: '550e8400-e29b-41d4-a716-446655440023',
          correctOptionId: undefined,
          explanation: 'This is the correct answer explanation',
          questionId: '550e8400-e29b-41d4-a716-446655440022',
          translations: [
            { locale: 'pt', explanation: 'Esta é a explicação correta' },
            { locale: 'it', explanation: 'Questa è la spiegazione corretta' },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      testSetup.createAnswerUseCase.execute.mockResolvedValueOnce(
        right(mockResponse),
      );

      const result = await testSetup.controller.create(dto);

      expect(result.answer.translations).toHaveLength(2);
      expect(result.answer.translations[0].locale).toBe('pt');
      expect(result.answer.translations[1].locale).toBe('it');
    });
  });

  describe('Error Cases', () => {
    it('should throw BadRequestException for invalid input', async () => {
      const dto: CreateAnswerDto = {
        explanation: 'Test explanation',
        questionId: '550e8400-e29b-41d4-a716-446655440022',
      };

      const error = new InvalidInputError('Invalid data', [
        'Explanation too short',
      ]);
      testSetup.createAnswerUseCase.execute.mockResolvedValueOnce(left(error));

      await expect(testSetup.controller.create(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException for answer already exists', async () => {
      const dto: CreateAnswerDto = {
        explanation: 'Test explanation',
        questionId: '550e8400-e29b-41d4-a716-446655440022',
      };

      const error = new AnswerAlreadyExistsError();
      testSetup.createAnswerUseCase.execute.mockResolvedValueOnce(left(error));

      await expect(testSetup.controller.create(dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException for question not found', async () => {
      const dto: CreateAnswerDto = {
        explanation: 'Test explanation',
        questionId: '00000000-0000-0000-0000-000000000000',
      };

      const error = new QuestionNotFoundError();
      testSetup.createAnswerUseCase.execute.mockResolvedValueOnce(left(error));

      await expect(testSetup.controller.create(dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException for assessment not found', async () => {
      const dto: CreateAnswerDto = {
        explanation: 'Test explanation',
        questionId: '550e8400-e29b-41d4-a716-446655440022',
      };

      const error = new AssessmentNotFoundError();
      testSetup.createAnswerUseCase.execute.mockResolvedValueOnce(left(error));

      await expect(testSetup.controller.create(dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for invalid answer type', async () => {
      const dto: CreateAnswerDto = {
        explanation: 'Test explanation',
        questionId: '550e8400-e29b-41d4-a716-446655440022',
      };

      const error = new InvalidAnswerTypeError(
        'QUIZ assessments can only have MULTIPLE_CHOICE questions',
      );
      testSetup.createAnswerUseCase.execute.mockResolvedValueOnce(left(error));

      await expect(testSetup.controller.create(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw InternalServerErrorException for repository error', async () => {
      const dto: CreateAnswerDto = {
        explanation: 'Test explanation',
        questionId: '550e8400-e29b-41d4-a716-446655440022',
      };

      const error = new RepositoryError('Database connection failed');
      testSetup.createAnswerUseCase.execute.mockResolvedValueOnce(left(error));

      await expect(testSetup.controller.create(dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw InternalServerErrorException for unknown error', async () => {
      const dto: CreateAnswerDto = {
        explanation: 'Test explanation',
        questionId: '550e8400-e29b-41d4-a716-446655440022',
      };

      const error = new Error('Unknown error');
      testSetup.createAnswerUseCase.execute.mockResolvedValueOnce(left(error));

      await expect(testSetup.controller.create(dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('Input Validation', () => {
    it('should handle complete answer data', async () => {
      const dto: CreateAnswerDto = {
        explanation: 'Complete answer explanation with all fields',
        questionId: '550e8400-e29b-41d4-a716-446655440022',
        correctOptionId: '550e8400-e29b-41d4-a716-446655440024',
        translations: [
          { locale: 'pt', explanation: 'Explicação completa em português' },
          { locale: 'it', explanation: 'Spiegazione completa in italiano' },
          { locale: 'es', explanation: 'Explicación completa en español' },
        ],
      };

      const mockResponse = {
        answer: {
          id: '550e8400-e29b-41d4-a716-446655440023',
          correctOptionId: dto.correctOptionId,
          explanation: dto.explanation,
          questionId: dto.questionId,
          translations: dto.translations,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      testSetup.createAnswerUseCase.execute.mockResolvedValueOnce(
        right(mockResponse),
      );

      const result = await testSetup.controller.create(dto);

      expect(testSetup.createAnswerUseCase.execute).toHaveBeenCalledWith({
        correctOptionId: dto.correctOptionId,
        explanation: dto.explanation,
        questionId: dto.questionId,
        translations: dto.translations,
      });

      expect(result.answer).toMatchObject({
        explanation: dto.explanation,
        questionId: dto.questionId,
        correctOptionId: dto.correctOptionId,
      });

      expect(result.answer.translations).toHaveLength(3);
    });

    it('should handle undefined optional fields', async () => {
      const dto: CreateAnswerDto = {
        explanation: 'Simple answer explanation',
        questionId: '550e8400-e29b-41d4-a716-446655440022',
        correctOptionId: undefined,
        translations: undefined,
      };

      const mockResponse = {
        answer: {
          id: '550e8400-e29b-41d4-a716-446655440023',
          correctOptionId: undefined,
          explanation: dto.explanation,
          questionId: dto.questionId,
          translations: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      testSetup.createAnswerUseCase.execute.mockResolvedValueOnce(
        right(mockResponse),
      );

      const result = await testSetup.controller.create(dto);

      expect(testSetup.createAnswerUseCase.execute).toHaveBeenCalledWith({
        correctOptionId: undefined,
        explanation: dto.explanation,
        questionId: dto.questionId,
        translations: undefined,
      });

      expect(result.answer.correctOptionId).toBeUndefined();
      expect(result.answer.translations).toEqual([]);
    });
  });
});
