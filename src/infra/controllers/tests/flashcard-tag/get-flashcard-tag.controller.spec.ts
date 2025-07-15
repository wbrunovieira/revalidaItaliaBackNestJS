import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { FlashcardTagController } from '@/infra/controllers/flashcard-tag.controller';
import { GetFlashcardTagByIdUseCase } from '@/domain/flashcard/application/use-cases/get-flashcard-tag-by-id.use-case';
import { CreateFlashcardTagUseCase } from '@/domain/flashcard/application/use-cases/create-flashcard-tag.use-case';
import { ListAllFlashcardTagsUseCase } from '@/domain/flashcard/application/use-cases/list-all-flashcard-tags.use-case';
import {
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { FlashcardTagControllerTestHelpers } from './shared/flashcard-tag-controller-test-helpers';
import { FlashcardTagControllerTestData } from './shared/flashcard-tag-controller-test-data';

describe('FlashcardTagController - GET /flashcard-tags/:id', () => {
  let controller: FlashcardTagController;
  let mockGetByIdUseCase: GetFlashcardTagByIdUseCase;
  let mockCreateUseCase: CreateFlashcardTagUseCase;
  let mockListAllUseCase: ListAllFlashcardTagsUseCase;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [FlashcardTagController],
      providers: [
        {
          provide: GetFlashcardTagByIdUseCase,
          useValue: {
            execute: vi.fn(),
          },
        },
        {
          provide: CreateFlashcardTagUseCase,
          useValue: {
            execute: vi.fn(),
          },
        },
        {
          provide: ListAllFlashcardTagsUseCase,
          useValue: {
            execute: vi.fn(),
          },
        },
      ],
    }).compile();

    controller = moduleRef.get<FlashcardTagController>(FlashcardTagController);
    mockGetByIdUseCase = moduleRef.get<GetFlashcardTagByIdUseCase>(
      GetFlashcardTagByIdUseCase,
    );
    mockCreateUseCase = moduleRef.get<CreateFlashcardTagUseCase>(
      CreateFlashcardTagUseCase,
    );
    mockListAllUseCase = moduleRef.get<ListAllFlashcardTagsUseCase>(
      ListAllFlashcardTagsUseCase,
    );
  });

  describe('Success cases', () => {
    it('should return flashcard tag when found', async () => {
      const testData = FlashcardTagControllerTestData.validFlashcardTag();
      const mockResponse = {
        flashcardTag: testData,
      };

      FlashcardTagControllerTestHelpers.mockUseCaseSuccess(
        mockGetByIdUseCase,
        mockResponse,
      );

      const result = await controller.findById(
        '550e8400-e29b-41d4-a716-446655440001',
      );

      expect(mockGetByIdUseCase.execute).toHaveBeenCalledWith({
        id: '550e8400-e29b-41d4-a716-446655440001',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle different valid UUID formats', async () => {
      const testData = FlashcardTagControllerTestData.validFlashcardTag();
      const mockResponse = {
        flashcardTag: testData,
      };

      FlashcardTagControllerTestHelpers.mockUseCaseSuccess(
        mockGetByIdUseCase,
        mockResponse,
      );

      const uuidUpperCase = '550E8400-E29B-41D4-A716-446655440001';
      const result = await controller.findById(uuidUpperCase);

      expect(mockGetByIdUseCase.execute).toHaveBeenCalledWith({
        id: uuidUpperCase,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Error handling', () => {
    describe('InvalidInputError', () => {
      it('should throw BadRequestException when ID is invalid', async () => {
        FlashcardTagControllerTestHelpers.mockUseCaseInvalidInput(
          mockGetByIdUseCase,
          {
            id: ['ID must be a valid UUID'],
          },
        );

        await expect(controller.findById('invalid-uuid')).rejects.toThrow(
          BadRequestException,
        );

        try {
          await controller.findById('invalid-uuid');
        } catch (error) {
          FlashcardTagControllerTestHelpers.expectBadRequestException(error, {
            id: ['ID must be a valid UUID'],
          });
        }
      });

      it('should throw BadRequestException when ID is empty', async () => {
        FlashcardTagControllerTestHelpers.mockUseCaseInvalidInput(
          mockGetByIdUseCase,
          {
            id: ['ID cannot be empty'],
          },
        );

        await expect(controller.findById('')).rejects.toThrow(
          BadRequestException,
        );
      });

      it('should throw BadRequestException with multiple validation errors', async () => {
        FlashcardTagControllerTestHelpers.mockUseCaseInvalidInput(
          mockGetByIdUseCase,
          {
            id: ['ID must be a valid UUID', 'ID cannot be empty'],
          },
        );

        await expect(controller.findById('')).rejects.toThrow(
          BadRequestException,
        );

        try {
          await controller.findById('');
        } catch (error) {
          FlashcardTagControllerTestHelpers.expectBadRequestException(error, {
            id: ['ID must be a valid UUID', 'ID cannot be empty'],
          });
        }
      });
    });

    describe('FlashcardTagNotFoundError', () => {
      it('should throw NotFoundException when tag not found', async () => {
        FlashcardTagControllerTestHelpers.mockUseCaseNotFound(
          mockGetByIdUseCase,
        );

        await expect(
          controller.findById('550e8400-e29b-41d4-a716-446655440001'),
        ).rejects.toThrow(NotFoundException);

        try {
          await controller.findById('550e8400-e29b-41d4-a716-446655440001');
        } catch (error) {
          expect(error).toBeInstanceOf(NotFoundException);
          expect(error.getStatus()).toBe(404);
          expect(error.getResponse()).toEqual({
            error: 'FLASHCARD_TAG_NOT_FOUND',
            message: 'FlashcardTag not found',
          });
        }
      });
    });

    describe('Unexpected errors', () => {
      it('should throw InternalServerErrorException for unexpected errors', async () => {
        FlashcardTagControllerTestHelpers.mockUseCaseUnexpectedError(
          mockGetByIdUseCase,
        );

        await expect(
          controller.findById('550e8400-e29b-41d4-a716-446655440001'),
        ).rejects.toThrow(InternalServerErrorException);

        try {
          await controller.findById('550e8400-e29b-41d4-a716-446655440001');
        } catch (error) {
          FlashcardTagControllerTestHelpers.expectInternalServerErrorException(
            error,
          );
        }
      });
    });
  });

  describe('Integration scenarios', () => {
    it('should handle special characters in flashcard tag name', async () => {
      const testData =
        FlashcardTagControllerTestData.flashcardTagWithSpecialChars();
      const mockResponse = {
        flashcardTag: testData,
      };

      FlashcardTagControllerTestHelpers.mockUseCaseSuccess(
        mockGetByIdUseCase,
        mockResponse,
      );

      const result = await controller.findById(testData.id);

      expect(result.flashcardTag.name).toBe('Anatomia & Fisiologia');
      expect(result.flashcardTag.slug).toBe('anatomia-fisiologia');
    });

    it('should return tag with custom slug', async () => {
      const testData =
        FlashcardTagControllerTestData.flashcardTagWithCustomSlug();
      const mockResponse = {
        flashcardTag: testData,
      };

      FlashcardTagControllerTestHelpers.mockUseCaseSuccess(
        mockGetByIdUseCase,
        mockResponse,
      );

      const result = await controller.findById(testData.id);

      expect(result.flashcardTag.slug).toBe('med-legal');
    });

    it('should return tag with updated timestamps', async () => {
      const testData =
        FlashcardTagControllerTestData.flashcardTagWithDifferentTimestamps();
      const mockResponse = {
        flashcardTag: testData,
      };

      FlashcardTagControllerTestHelpers.mockUseCaseSuccess(
        mockGetByIdUseCase,
        mockResponse,
      );

      const result = await controller.findById(testData.id);

      expect(new Date(result.flashcardTag.updatedAt).getTime()).toBeGreaterThan(
        new Date(result.flashcardTag.createdAt).getTime(),
      );
    });
  });
});
