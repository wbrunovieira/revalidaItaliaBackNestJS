// src/infra/controllers/tests/flashcard/get-flashcard.controller.spec.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { FlashcardControllerTestSetup } from './shared/flashcard-controller-test-setup';
import { FlashcardControllerTestData } from './shared/flashcard-controller-test-data';
import { InvalidInputError } from '@/domain/flashcard/application/use-cases/errors/invalid-input-error';
import { FlashcardNotFoundError } from '@/domain/flashcard/application/use-cases/errors/flashcard-not-found-error';
import { RepositoryError } from '@/domain/flashcard/application/use-cases/errors/repository-error';

describe('FlashcardController - GET /flashcards/:id', () => {
  let setup: FlashcardControllerTestSetup;

  beforeAll(async () => {
    setup = new FlashcardControllerTestSetup();
    await setup.initialize();
  });

  afterAll(async () => {
    await setup.teardown();
  });

  beforeEach(() => {
    setup.resetMocks();
  });

  describe('Success scenarios', () => {
    it('should get a flashcard by ID without filters', async () => {
      // Arrange
      const flashcardId = '550e8400-e29b-41d4-a716-446655440000';
      const expectedResponse =
        FlashcardControllerTestData.getByIdResponses.withoutTags();
      setup.mockGetFlashcardByIdSuccess(expectedResponse);

      // Act
      const result = await setup.controller.findById(flashcardId, {});

      // Assert
      expect(result).toEqual({
        success: true,
        ...expectedResponse,
      });
      expect(setup.getFlashcardByIdUseCaseMock.execute).toHaveBeenCalledWith({
        id: flashcardId,
        filters: {
          includeTags: undefined,
          includeInteractionStats: undefined,
          includeRelatedFlashcards: undefined,
        },
      });
    });

    it('should get a flashcard with tags when includeTags is true', async () => {
      // Arrange
      const flashcardId = '550e8400-e29b-41d4-a716-446655440000';
      const expectedResponse =
        FlashcardControllerTestData.getByIdResponses.withTags();
      setup.mockGetFlashcardByIdSuccess(expectedResponse);

      // Act
      const result = await setup.controller.findById(flashcardId, {
        includeTags: true,
      });

      // Assert
      expect(result).toEqual({
        success: true,
        ...expectedResponse,
      });
      expect(setup.getFlashcardByIdUseCaseMock.execute).toHaveBeenCalledWith({
        id: flashcardId,
        filters: {
          includeTags: true,
          includeInteractionStats: undefined,
          includeRelatedFlashcards: undefined,
        },
      });
    });

    it('should handle all filters set to true', async () => {
      // Arrange
      const flashcardId = '550e8400-e29b-41d4-a716-446655440000';
      const expectedResponse =
        FlashcardControllerTestData.getByIdResponses.withTags();
      setup.mockGetFlashcardByIdSuccess(expectedResponse);

      // Act
      const result = await setup.controller.findById(flashcardId, {
        includeTags: true,
        includeInteractionStats: true,
        includeRelatedFlashcards: true,
      });

      // Assert
      expect(result).toEqual({
        success: true,
        ...expectedResponse,
      });
      expect(setup.getFlashcardByIdUseCaseMock.execute).toHaveBeenCalledWith({
        id: flashcardId,
        filters: {
          includeTags: true,
          includeInteractionStats: true,
          includeRelatedFlashcards: true,
        },
      });
    });

    it('should handle all filters set to false', async () => {
      // Arrange
      const flashcardId = '550e8400-e29b-41d4-a716-446655440000';
      const expectedResponse =
        FlashcardControllerTestData.getByIdResponses.withoutTags();
      setup.mockGetFlashcardByIdSuccess(expectedResponse);

      // Act
      const result = await setup.controller.findById(flashcardId, {
        includeTags: false,
        includeInteractionStats: false,
        includeRelatedFlashcards: false,
      });

      // Assert
      expect(result).toEqual({
        success: true,
        ...expectedResponse,
      });
      expect(setup.getFlashcardByIdUseCaseMock.execute).toHaveBeenCalledWith({
        id: flashcardId,
        filters: {
          includeTags: false,
          includeInteractionStats: false,
          includeRelatedFlashcards: false,
        },
      });
    });
  });

  describe('Error scenarios', () => {
    it('should throw BadRequestException when InvalidInputError occurs', async () => {
      // Arrange
      const flashcardId = 'invalid-uuid';
      const error = new InvalidInputError('Invalid input data', {
        id: ['ID must be a valid UUID'],
      });
      setup.mockGetFlashcardByIdError(error);

      // Act & Assert
      try {
        await setup.controller.findById(flashcardId, {});
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = error.getResponse();
        expect(response).toEqual({
          error: 'INVALID_INPUT',
          message: 'Invalid input data',
          details: {
            id: ['ID must be a valid UUID'],
          },
        });
      }
    });

    it('should throw NotFoundException when FlashcardNotFoundError occurs', async () => {
      // Arrange
      const flashcardId = '550e8400-e29b-41d4-a716-446655440000';
      const error = new FlashcardNotFoundError(flashcardId);
      setup.mockGetFlashcardByIdError(error);

      // Act & Assert
      try {
        await setup.controller.findById(flashcardId, {});
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        const response = error.getResponse();
        expect(response).toEqual({
          error: 'FLASHCARD_NOT_FOUND',
          message: `Flashcard with ID "${flashcardId}" not found`,
        });
      }
    });

    it('should throw InternalServerErrorException when RepositoryError occurs', async () => {
      // Arrange
      const flashcardId = '550e8400-e29b-41d4-a716-446655440000';
      const error = new RepositoryError('Database connection failed');
      setup.mockGetFlashcardByIdError(error);

      // Act & Assert
      try {
        await setup.controller.findById(flashcardId, {});
      } catch (error) {
        expect(error).toBeInstanceOf(InternalServerErrorException);
        const response = error.getResponse();
        expect(response).toEqual({
          error: 'INTERNAL_ERROR',
          message: 'Database connection failed',
        });
      }
    });

    it('should throw InternalServerErrorException when use case throws unexpected error', async () => {
      // Arrange
      const flashcardId = '550e8400-e29b-41d4-a716-446655440000';
      setup.mockGetFlashcardByIdThrows(new Error('Unexpected error'));

      // Act & Assert
      try {
        await setup.controller.findById(flashcardId, {});
      } catch (error) {
        expect(error).toBeInstanceOf(InternalServerErrorException);
        const response = error.getResponse();
        expect(response).toEqual({
          error: 'INTERNAL_ERROR',
          message: 'Unexpected error',
        });
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle empty query object', async () => {
      // Arrange
      const flashcardId = '550e8400-e29b-41d4-a716-446655440000';
      const expectedResponse =
        FlashcardControllerTestData.getByIdResponses.withoutTags();
      setup.mockGetFlashcardByIdSuccess(expectedResponse);

      // Act
      const result = await setup.controller.findById(flashcardId, {});

      // Assert
      expect(result).toEqual({
        success: true,
        ...expectedResponse,
      });
    });

    it('should handle mixed filter values', async () => {
      // Arrange
      const flashcardId = '550e8400-e29b-41d4-a716-446655440000';
      const expectedResponse =
        FlashcardControllerTestData.getByIdResponses.withTags();
      setup.mockGetFlashcardByIdSuccess(expectedResponse);

      // Act
      const result = await setup.controller.findById(flashcardId, {
        includeTags: true,
        includeInteractionStats: false,
        includeRelatedFlashcards: true,
      });

      // Assert
      expect(result).toEqual({
        success: true,
        ...expectedResponse,
      });
      expect(setup.getFlashcardByIdUseCaseMock.execute).toHaveBeenCalledWith({
        id: flashcardId,
        filters: {
          includeTags: true,
          includeInteractionStats: false,
          includeRelatedFlashcards: true,
        },
      });
    });
  });
});
