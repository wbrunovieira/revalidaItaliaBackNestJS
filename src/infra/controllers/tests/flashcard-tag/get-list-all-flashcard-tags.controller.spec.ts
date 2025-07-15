import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { FlashcardTagControllerTestSetup } from './shared/flashcard-tag-controller-test-setup';
import { FlashcardTagControllerTestData } from './shared/flashcard-tag-controller-test-data';
import { left, right } from '@/core/either';
import { InvalidInputError } from '@/domain/flashcard/application/use-cases/errors/invalid-input-error';

describe('FlashcardTagController - GET / (List All)', () => {
  let testSetup: FlashcardTagControllerTestSetup;

  beforeEach(() => {
    testSetup = new FlashcardTagControllerTestSetup();
  });

  describe('Success Cases', () => {
    it('should successfully list all flashcard tags', async () => {
      // Arrange
      const mockTags = FlashcardTagControllerTestData.multipleFlashcardTags();
      const mockResult = right({ flashcardTags: mockTags });

      vi.spyOn(testSetup.listAllFlashcardTagsUseCase, 'execute').mockResolvedValue(mockResult);

      // Act
      const result = await testSetup.controller.findAll();

      // Assert
      expect(testSetup.listAllFlashcardTagsUseCase.execute).toHaveBeenCalledWith({});
      expect(result).toEqual({
        flashcardTags: mockTags,
      });
    });

    it('should return empty array when no flashcard tags exist', async () => {
      // Arrange
      const mockResult = right({ flashcardTags: [] });

      vi.spyOn(testSetup.listAllFlashcardTagsUseCase, 'execute').mockResolvedValue(mockResult);

      // Act
      const result = await testSetup.controller.findAll();

      // Assert
      expect(testSetup.listAllFlashcardTagsUseCase.execute).toHaveBeenCalledWith({});
      expect(result).toEqual({
        flashcardTags: [],
      });
    });

    it('should handle single flashcard tag correctly', async () => {
      // Arrange
      const mockTags = FlashcardTagControllerTestData.singleFlashcardTag();
      const mockResult = right({ flashcardTags: mockTags });

      vi.spyOn(testSetup.listAllFlashcardTagsUseCase, 'execute').mockResolvedValue(mockResult);

      // Act
      const result = await testSetup.controller.findAll();

      // Assert
      expect(testSetup.listAllFlashcardTagsUseCase.execute).toHaveBeenCalledWith({});
      expect(result).toEqual({
        flashcardTags: mockTags,
      });
    });

    it('should handle flashcard tags with special characters', async () => {
      // Arrange
      const mockTags = FlashcardTagControllerTestData.flashcardTagsWithSpecialChars();
      const mockResult = right({ flashcardTags: mockTags });

      vi.spyOn(testSetup.listAllFlashcardTagsUseCase, 'execute').mockResolvedValue(mockResult);

      // Act
      const result = await testSetup.controller.findAll();

      // Assert
      expect(testSetup.listAllFlashcardTagsUseCase.execute).toHaveBeenCalledWith({});
      expect(result).toEqual({
        flashcardTags: mockTags,
      });
    });

    it('should maintain response structure with correct properties', async () => {
      // Arrange
      const mockTags = FlashcardTagControllerTestData.multipleFlashcardTags();
      const mockResult = right({ flashcardTags: mockTags });

      vi.spyOn(testSetup.listAllFlashcardTagsUseCase, 'execute').mockResolvedValue(mockResult);

      // Act
      const result = await testSetup.controller.findAll();

      // Assert
      expect(result).toHaveProperty('flashcardTags');
      expect(Array.isArray(result.flashcardTags)).toBe(true);
      
      if (result.flashcardTags.length > 0) {
        const tag = result.flashcardTags[0];
        expect(tag).toHaveProperty('id');
        expect(tag).toHaveProperty('name');
        expect(tag).toHaveProperty('slug');
        expect(tag).toHaveProperty('createdAt');
        expect(tag).toHaveProperty('updatedAt');
      }
    });

    it('should return tags in correct order (sorted by name)', async () => {
      // Arrange
      const mockTags = FlashcardTagControllerTestData.multipleFlashcardTags();
      const mockResult = right({ flashcardTags: mockTags });

      vi.spyOn(testSetup.listAllFlashcardTagsUseCase, 'execute').mockResolvedValue(mockResult);

      // Act
      const result = await testSetup.controller.findAll();

      // Assert
      expect(result.flashcardTags[0].name).toBe('Anatomia');
      expect(result.flashcardTags[1].name).toBe('Farmacologia');
      expect(result.flashcardTags[2].name).toBe('Fisiologia');
    });
  });

  describe('Error Cases', () => {
    it('should throw BadRequestException when InvalidInputError occurs', async () => {
      // Arrange
      const mockError = new InvalidInputError('Validation failed', {
        general: ['Invalid request']
      });
      const mockResult = left(mockError);

      vi.spyOn(testSetup.listAllFlashcardTagsUseCase, 'execute').mockResolvedValue(mockResult);

      // Act & Assert
      await expect(testSetup.controller.findAll()).rejects.toThrow(BadRequestException);
      
      try {
        await testSetup.controller.findAll();
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.getResponse()).toEqual({
          error: 'INVALID_INPUT',
          message: 'Invalid input data',
          details: { general: ['Invalid request'] },
        });
      }
    });

    it('should throw InternalServerErrorException for unexpected errors', async () => {
      // Arrange
      const mockError = new Error('Database connection failed');
      const mockResult = left(mockError);

      vi.spyOn(testSetup.listAllFlashcardTagsUseCase, 'execute').mockResolvedValue(mockResult);

      // Act & Assert
      await expect(testSetup.controller.findAll()).rejects.toThrow(InternalServerErrorException);
      
      try {
        await testSetup.controller.findAll();
      } catch (error) {
        expect(error).toBeInstanceOf(InternalServerErrorException);
        expect(error.getResponse()).toEqual({
          error: 'INTERNAL_ERROR',
          message: 'Unexpected error occurred',
        });
      }
    });

    it('should handle use case rejections gracefully', async () => {
      // Arrange
      vi.spyOn(testSetup.listAllFlashcardTagsUseCase, 'execute').mockRejectedValue(
        new Error('Unexpected rejection')
      );

      // Act & Assert
      await expect(testSetup.controller.findAll()).rejects.toThrow('Unexpected rejection');
    });
  });

  describe('Use Case Integration', () => {
    it('should call use case with empty object', async () => {
      // Arrange
      const mockResult = right({ flashcardTags: [] });
      const executeSpy = vi.spyOn(testSetup.listAllFlashcardTagsUseCase, 'execute').mockResolvedValue(mockResult);

      // Act
      await testSetup.controller.findAll();

      // Assert
      expect(executeSpy).toHaveBeenCalledTimes(1);
      expect(executeSpy).toHaveBeenCalledWith({});
    });

    it('should handle use case execution only once per request', async () => {
      // Arrange
      const mockResult = right({ flashcardTags: [] });
      const executeSpy = vi.spyOn(testSetup.listAllFlashcardTagsUseCase, 'execute').mockResolvedValue(mockResult);

      // Act
      await testSetup.controller.findAll();
      await testSetup.controller.findAll();

      // Assert
      expect(executeSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large number of tags', async () => {
      // Arrange
      const largeMockTags = Array.from({ length: 1000 }, (_, i) => ({
        id: `550e8400-e29b-41d4-a716-${i.toString().padStart(12, '0')}`,
        name: `Tag ${i + 1}`,
        slug: `tag-${i + 1}`,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      }));
      const mockResult = right({ flashcardTags: largeMockTags });

      vi.spyOn(testSetup.listAllFlashcardTagsUseCase, 'execute').mockResolvedValue(mockResult);

      // Act
      const result = await testSetup.controller.findAll();

      // Assert
      expect(result.flashcardTags).toHaveLength(1000);
      expect(result.flashcardTags[0].name).toBe('Tag 1');
      expect(result.flashcardTags[999].name).toBe('Tag 1000');
    });

    it('should handle tags with null-like values gracefully', async () => {
      // Arrange
      const mockTags = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Valid Tag',
          slug: 'valid-tag',
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        },
      ];
      const mockResult = right({ flashcardTags: mockTags });

      vi.spyOn(testSetup.listAllFlashcardTagsUseCase, 'execute').mockResolvedValue(mockResult);

      // Act
      const result = await testSetup.controller.findAll();

      // Assert
      expect(result.flashcardTags).toHaveLength(1);
      expect(result.flashcardTags[0].name).toBe('Valid Tag');
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data integrity between use case and controller response', async () => {
      // Arrange
      const mockTags = FlashcardTagControllerTestData.multipleFlashcardTags();
      const mockResult = right({ flashcardTags: mockTags });

      vi.spyOn(testSetup.listAllFlashcardTagsUseCase, 'execute').mockResolvedValue(mockResult);

      // Act
      const result = await testSetup.controller.findAll();

      // Assert
      expect(result.flashcardTags).toEqual(mockTags);
      expect(result.flashcardTags).toHaveLength(mockTags.length);
      
      result.flashcardTags.forEach((tag, index) => {
        expect(tag.id).toBe(mockTags[index].id);
        expect(tag.name).toBe(mockTags[index].name);
        expect(tag.slug).toBe(mockTags[index].slug);
        expect(tag.createdAt).toBe(mockTags[index].createdAt);
        expect(tag.updatedAt).toBe(mockTags[index].updatedAt);
      });
    });

    it('should not modify use case result data', async () => {
      // Arrange
      const mockTags = FlashcardTagControllerTestData.multipleFlashcardTags();
      const originalTags = mockTags.map(tag => ({ ...tag })); // Shallow copy preserving Date objects
      const mockResult = right({ flashcardTags: mockTags });

      vi.spyOn(testSetup.listAllFlashcardTagsUseCase, 'execute').mockResolvedValue(mockResult);

      // Act
      const result = await testSetup.controller.findAll();

      // Assert
      expect(result.flashcardTags).toEqual(originalTags);
    });
  });

  describe('Performance', () => {
    it('should handle concurrent requests efficiently', async () => {
      // Arrange
      const mockTags = FlashcardTagControllerTestData.multipleFlashcardTags();
      const mockResult = right({ flashcardTags: mockTags });

      vi.spyOn(testSetup.listAllFlashcardTagsUseCase, 'execute').mockResolvedValue(mockResult);

      // Act
      const promises = Array.from({ length: 10 }, () => testSetup.controller.findAll());
      const results = await Promise.all(promises);

      // Assert
      results.forEach((result) => {
        expect(result).toEqual({ flashcardTags: mockTags });
      });
      expect(testSetup.listAllFlashcardTagsUseCase.execute).toHaveBeenCalledTimes(10);
    });
  });
});