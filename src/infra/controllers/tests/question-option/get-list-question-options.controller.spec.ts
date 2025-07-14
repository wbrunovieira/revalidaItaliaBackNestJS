// src/infra/controllers/tests/question-option/get-list-question-options.controller.spec.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { QuestionOptionControllerTestSetup } from './shared/question-option-controller-test-setup';
import { right, left } from '@/core/either';
import { InvalidInputError } from '@/domain/assessment/application/use-cases/errors/invalid-input-error';
import { QuestionNotFoundError } from '@/domain/assessment/application/use-cases/errors/question-not-found-error';
import { RepositoryError } from '@/domain/assessment/application/use-cases/errors/repository-error';

describe('QuestionOptionController - listOptions', () => {
  let setup: QuestionOptionControllerTestSetup;
  let controller: any;
  let listQuestionOptionsUseCase: any;

  beforeEach(() => {
    setup = new QuestionOptionControllerTestSetup();
    const instances = setup.getTestInstances();
    controller = instances.controller;
    listQuestionOptionsUseCase = instances.listQuestionOptionsUseCase;
    setup.resetMocks();
  });

  describe('Success Cases', () => {
    it('should list question options successfully', async () => {
      // Arrange
      const questionId = '550e8400-e29b-41d4-a716-446655440001';
      const mockResponse = {
        options: [
          {
            id: '550e8400-e29b-41d4-a716-446655440002',
            text: 'Option A',
            questionId: questionId,
            createdAt: new Date('2024-01-01T10:00:00Z'),
            updatedAt: new Date('2024-01-01T10:00:00Z'),
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440003',
            text: 'Option B',
            questionId: questionId,
            createdAt: new Date('2024-01-01T10:01:00Z'),
            updatedAt: new Date('2024-01-01T10:01:00Z'),
          },
        ],
      };

      listQuestionOptionsUseCase.execute.mockResolvedValue(right(mockResponse));

      // Act
      const result = await controller.listOptions(questionId);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(listQuestionOptionsUseCase.execute).toHaveBeenCalledWith({
        questionId,
      });
      expect(listQuestionOptionsUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when question has no options', async () => {
      // Arrange
      const questionId = '550e8400-e29b-41d4-a716-446655440001';
      const mockResponse = {
        options: [],
      };

      listQuestionOptionsUseCase.execute.mockResolvedValue(right(mockResponse));

      // Act
      const result = await controller.listOptions(questionId);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(result.options).toHaveLength(0);
      expect(listQuestionOptionsUseCase.execute).toHaveBeenCalledWith({
        questionId,
      });
    });

    it('should handle single option response', async () => {
      // Arrange
      const questionId = '550e8400-e29b-41d4-a716-446655440001';
      const mockResponse = {
        options: [
          {
            id: '550e8400-e29b-41d4-a716-446655440002',
            text: 'Only option',
            questionId: questionId,
            createdAt: new Date('2024-01-01T10:00:00Z'),
            updatedAt: new Date('2024-01-01T10:00:00Z'),
          },
        ],
      };

      listQuestionOptionsUseCase.execute.mockResolvedValue(right(mockResponse));

      // Act
      const result = await controller.listOptions(questionId);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(result.options).toHaveLength(1);
      expect(result.options[0].text).toBe('Only option');
    });

    it('should handle options with long text', async () => {
      // Arrange
      const questionId = '550e8400-e29b-41d4-a716-446655440001';
      const longText = 'A'.repeat(500);
      const mockResponse = {
        options: [
          {
            id: '550e8400-e29b-41d4-a716-446655440002',
            text: longText,
            questionId: questionId,
            createdAt: new Date('2024-01-01T10:00:00Z'),
            updatedAt: new Date('2024-01-01T10:00:00Z'),
          },
        ],
      };

      listQuestionOptionsUseCase.execute.mockResolvedValue(right(mockResponse));

      // Act
      const result = await controller.listOptions(questionId);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(result.options[0].text).toBe(longText);
      expect(result.options[0].text).toHaveLength(500);
    });
  });

  describe('Error Cases', () => {
    it('should throw BadRequestException for invalid input', async () => {
      // Arrange
      const questionId = 'invalid-uuid';
      const mockError = new InvalidInputError('Question ID must be a valid UUID');

      listQuestionOptionsUseCase.execute.mockResolvedValue(left(mockError));

      // Act & Assert
      await expect(controller.listOptions(questionId)).rejects.toThrow(BadRequestException);
      await expect(controller.listOptions(questionId)).rejects.toThrow('Question ID must be a valid UUID');

      expect(listQuestionOptionsUseCase.execute).toHaveBeenCalledWith({
        questionId,
      });
    });

    it('should throw NotFoundException for question not found', async () => {
      // Arrange
      const questionId = '550e8400-e29b-41d4-a716-446655440001';
      const mockError = new QuestionNotFoundError();

      listQuestionOptionsUseCase.execute.mockResolvedValue(left(mockError));

      // Act & Assert
      await expect(controller.listOptions(questionId)).rejects.toThrow(NotFoundException);
      await expect(controller.listOptions(questionId)).rejects.toThrow('Question not found');

      expect(listQuestionOptionsUseCase.execute).toHaveBeenCalledWith({
        questionId,
      });
    });

    it('should throw InternalServerErrorException for repository error', async () => {
      // Arrange
      const questionId = '550e8400-e29b-41d4-a716-446655440001';
      const mockError = new RepositoryError('Failed to fetch question options');

      listQuestionOptionsUseCase.execute.mockResolvedValue(left(mockError));

      // Act & Assert
      await expect(controller.listOptions(questionId)).rejects.toThrow(InternalServerErrorException);
      await expect(controller.listOptions(questionId)).rejects.toThrow('Failed to fetch question options');

      expect(listQuestionOptionsUseCase.execute).toHaveBeenCalledWith({
        questionId,
      });
    });

    it('should throw InternalServerErrorException for unknown error', async () => {
      // Arrange
      const questionId = '550e8400-e29b-41d4-a716-446655440001';
      const mockError = new Error('Unknown error');

      listQuestionOptionsUseCase.execute.mockResolvedValue(left(mockError));

      // Act & Assert
      await expect(controller.listOptions(questionId)).rejects.toThrow(InternalServerErrorException);
      await expect(controller.listOptions(questionId)).rejects.toThrow('An unexpected error occurred');

      expect(listQuestionOptionsUseCase.execute).toHaveBeenCalledWith({
        questionId,
      });
    });
  });

  describe('Parameter Validation', () => {
    it('should handle empty question ID', async () => {
      // Arrange
      const questionId = '';
      const mockError = new InvalidInputError('Question ID cannot be empty');

      listQuestionOptionsUseCase.execute.mockResolvedValue(left(mockError));

      // Act & Assert
      await expect(controller.listOptions(questionId)).rejects.toThrow(BadRequestException);

      expect(listQuestionOptionsUseCase.execute).toHaveBeenCalledWith({
        questionId,
      });
    });

    it('should handle malformed UUID', async () => {
      // Arrange
      const questionId = '550e8400e29b41d4a716446655440000'; // Missing hyphens
      const mockError = new InvalidInputError('Question ID must be a valid UUID');

      listQuestionOptionsUseCase.execute.mockResolvedValue(left(mockError));

      // Act & Assert
      await expect(controller.listOptions(questionId)).rejects.toThrow(BadRequestException);

      expect(listQuestionOptionsUseCase.execute).toHaveBeenCalledWith({
        questionId,
      });
    });

    it('should handle non-existent question ID', async () => {
      // Arrange
      const questionId = '00000000-0000-0000-0000-000000000000';
      const mockError = new QuestionNotFoundError();

      listQuestionOptionsUseCase.execute.mockResolvedValue(left(mockError));

      // Act & Assert
      await expect(controller.listOptions(questionId)).rejects.toThrow(NotFoundException);

      expect(listQuestionOptionsUseCase.execute).toHaveBeenCalledWith({
        questionId,
      });
    });
  });

  describe('Use Case Integration', () => {
    it('should pass correct parameters to use case', async () => {
      // Arrange
      const questionId = '550e8400-e29b-41d4-a716-446655440001';
      const mockResponse = { options: [] };

      listQuestionOptionsUseCase.execute.mockResolvedValue(right(mockResponse));

      // Act
      await controller.listOptions(questionId);

      // Assert
      expect(listQuestionOptionsUseCase.execute).toHaveBeenCalledWith({
        questionId: questionId,
      });
      expect(listQuestionOptionsUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should handle use case response correctly', async () => {
      // Arrange
      const questionId = '550e8400-e29b-41d4-a716-446655440001';
      const expectedResponse = {
        options: [
          {
            id: '550e8400-e29b-41d4-a716-446655440002',
            text: 'Test option',
            questionId: questionId,
            createdAt: new Date('2024-01-01T10:00:00Z'),
            updatedAt: new Date('2024-01-01T10:00:00Z'),
          },
        ],
      };

      listQuestionOptionsUseCase.execute.mockResolvedValue(right(expectedResponse));

      // Act
      const result = await controller.listOptions(questionId);

      // Assert
      expect(result).toBe(expectedResponse); // Should return exact response from use case
    });

    it('should not call use case multiple times for single request', async () => {
      // Arrange
      const questionId = '550e8400-e29b-41d4-a716-446655440001';
      const mockResponse = { options: [] };

      listQuestionOptionsUseCase.execute.mockResolvedValue(right(mockResponse));

      // Act
      await controller.listOptions(questionId);

      // Assert
      expect(listQuestionOptionsUseCase.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe('Response Structure', () => {
    it('should return response with correct structure', async () => {
      // Arrange
      const questionId = '550e8400-e29b-41d4-a716-446655440001';
      const mockResponse = {
        options: [
          {
            id: '550e8400-e29b-41d4-a716-446655440002',
            text: 'Option A',
            questionId: questionId,
            createdAt: new Date('2024-01-01T10:00:00Z'),
            updatedAt: new Date('2024-01-01T10:00:00Z'),
          },
        ],
      };

      listQuestionOptionsUseCase.execute.mockResolvedValue(right(mockResponse));

      // Act
      const result = await controller.listOptions(questionId);

      // Assert
      expect(result).toHaveProperty('options');
      expect(Array.isArray(result.options)).toBe(true);
      
      if (result.options.length > 0) {
        const option = result.options[0];
        expect(option).toHaveProperty('id');
        expect(option).toHaveProperty('text');
        expect(option).toHaveProperty('questionId');
        expect(option).toHaveProperty('createdAt');
        expect(option).toHaveProperty('updatedAt');
        
        expect(typeof option.id).toBe('string');
        expect(typeof option.text).toBe('string');
        expect(typeof option.questionId).toBe('string');
        expect(option.createdAt).toBeInstanceOf(Date);
        expect(option.updatedAt).toBeInstanceOf(Date);
      }
    });

    it('should maintain data types in response', async () => {
      // Arrange
      const questionId = '550e8400-e29b-41d4-a716-446655440001';
      const createdAt = new Date('2024-01-01T10:00:00Z');
      const updatedAt = new Date('2024-01-01T10:01:00Z');
      
      const mockResponse = {
        options: [
          {
            id: '550e8400-e29b-41d4-a716-446655440002',
            text: 'Test option with special chars: àáâãäåæçèéêë',
            questionId: questionId,
            createdAt: createdAt,
            updatedAt: updatedAt,
          },
        ],
      };

      listQuestionOptionsUseCase.execute.mockResolvedValue(right(mockResponse));

      // Act
      const result = await controller.listOptions(questionId);

      // Assert
      const option = result.options[0];
      expect(option.id).toBe('550e8400-e29b-41d4-a716-446655440002');
      expect(option.text).toBe('Test option with special chars: àáâãäåæçèéêë');
      expect(option.questionId).toBe(questionId);
      expect(option.createdAt).toEqual(createdAt);
      expect(option.updatedAt).toEqual(updatedAt);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long question ID', async () => {
      // Arrange
      const questionId = '550e8400-e29b-41d4-a716-446655440001';
      const mockError = new InvalidInputError('Question ID must be a valid UUID');

      listQuestionOptionsUseCase.execute.mockResolvedValue(left(mockError));

      // Act & Assert
      await expect(controller.listOptions(questionId + '-extra')).rejects.toThrow(BadRequestException);
    });

    it('should handle question with maximum number of options', async () => {
      // Arrange
      const questionId = '550e8400-e29b-41d4-a716-446655440001';
      const maxOptions = Array.from({ length: 10 }, (_, i) => ({
        id: `550e8400-e29b-41d4-a716-44665544000${i}`,
        text: `Option ${String.fromCharCode(65 + i)}`, // A, B, C, etc.
        questionId: questionId,
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T10:00:00Z'),
      }));

      const mockResponse = { options: maxOptions };
      listQuestionOptionsUseCase.execute.mockResolvedValue(right(mockResponse));

      // Act
      const result = await controller.listOptions(questionId);

      // Assert
      expect(result.options).toHaveLength(10);
      expect(result.options[0].text).toBe('Option A');
      expect(result.options[9].text).toBe('Option J');
    });
  });
});