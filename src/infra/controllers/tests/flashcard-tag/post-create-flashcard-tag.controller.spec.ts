import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { FlashcardTagControllerTestSetup } from './shared/flashcard-tag-controller-test-setup';
import { FlashcardTagControllerTestData } from './shared/flashcard-tag-controller-test-data';
import { FlashcardTagControllerTestHelpers } from './shared/flashcard-tag-controller-test-helpers';

describe('FlashcardTagController - POST /flashcard-tags', () => {
  let setup: FlashcardTagControllerTestSetup;

  beforeEach(() => {
    vi.clearAllMocks();
    setup = new FlashcardTagControllerTestSetup();
  });

  describe('Success Cases', () => {
    it('should create a flashcard tag with valid data', async () => {
      const dto = FlashcardTagControllerTestData.VALID_DTOS.SIMPLE_TAG;
      const expectedResponse =
        FlashcardTagControllerTestData.SUCCESS_RESPONSES.SIMPLE_TAG;

      FlashcardTagControllerTestHelpers.mockUseCaseSuccess(
        setup.createFlashcardTagUseCase,
        expectedResponse,
      );

      const result = await setup.controller.create(dto);

      expect(setup.createFlashcardTagUseCase.execute).toHaveBeenCalledWith({
        name: dto.name,
        slug: undefined,
      });
      FlashcardTagControllerTestHelpers.expectSuccessResponse(
        result,
        expectedResponse,
      );
    });

    it('should create a flashcard tag with custom slug', async () => {
      const dto = FlashcardTagControllerTestData.VALID_DTOS.TAG_WITH_SLUG;
      const expectedResponse =
        FlashcardTagControllerTestData.SUCCESS_RESPONSES.TAG_WITH_SLUG;

      FlashcardTagControllerTestHelpers.mockUseCaseSuccess(
        setup.createFlashcardTagUseCase,
        expectedResponse,
      );

      const result = await setup.controller.create(dto);

      expect(setup.createFlashcardTagUseCase.execute).toHaveBeenCalledWith({
        name: dto.name,
        slug: dto.slug,
      });
      FlashcardTagControllerTestHelpers.expectSuccessResponse(
        result,
        expectedResponse,
      );
    });

    it('should create a flashcard tag with minimal valid name', async () => {
      const dto = FlashcardTagControllerTestData.VALID_DTOS.MINIMAL_NAME;
      const expectedResponse =
        FlashcardTagControllerTestData.SUCCESS_RESPONSES.SIMPLE_TAG;

      FlashcardTagControllerTestHelpers.mockUseCaseSuccess(
        setup.createFlashcardTagUseCase,
        expectedResponse,
      );

      const result = await setup.controller.create(dto);

      expect(setup.createFlashcardTagUseCase.execute).toHaveBeenCalledWith({
        name: dto.name,
        slug: undefined,
      });
      FlashcardTagControllerTestHelpers.expectSuccessResponse(
        result,
        expectedResponse,
      );
    });

    it('should create a flashcard tag with maximum valid name', async () => {
      const dto = FlashcardTagControllerTestData.VALID_DTOS.MAXIMUM_NAME;
      const expectedResponse =
        FlashcardTagControllerTestData.SUCCESS_RESPONSES.SIMPLE_TAG;

      FlashcardTagControllerTestHelpers.mockUseCaseSuccess(
        setup.createFlashcardTagUseCase,
        expectedResponse,
      );

      const result = await setup.controller.create(dto);

      expect(setup.createFlashcardTagUseCase.execute).toHaveBeenCalledWith({
        name: dto.name,
        slug: undefined,
      });
      FlashcardTagControllerTestHelpers.expectSuccessResponse(
        result,
        expectedResponse,
      );
    });
  });

  describe('Validation Errors', () => {
    it('should throw BadRequestException for empty name', async () => {
      const dto = FlashcardTagControllerTestData.INVALID_DTOS.EMPTY_NAME;
      const errorDetails = {
        name: ['Name must be at least 3 characters long'],
      };

      FlashcardTagControllerTestHelpers.mockUseCaseInvalidInput(
        setup.createFlashcardTagUseCase,
        errorDetails,
      );

      await expect(setup.controller.create(dto)).rejects.toThrow(
        BadRequestException,
      );

      try {
        await setup.controller.create(dto);
      } catch (error) {
        FlashcardTagControllerTestHelpers.expectBadRequestException(
          error,
          errorDetails,
        );
      }
    });

    it('should throw BadRequestException for too short name', async () => {
      const dto = FlashcardTagControllerTestData.INVALID_DTOS.TOO_SHORT_NAME;
      const errorDetails = {
        name: ['Name must be at least 3 characters long'],
      };

      FlashcardTagControllerTestHelpers.mockUseCaseInvalidInput(
        setup.createFlashcardTagUseCase,
        errorDetails,
      );

      await expect(setup.controller.create(dto)).rejects.toThrow(
        BadRequestException,
      );

      try {
        await setup.controller.create(dto);
      } catch (error) {
        FlashcardTagControllerTestHelpers.expectBadRequestException(
          error,
          errorDetails,
        );
      }
    });

    it('should throw BadRequestException for too long name', async () => {
      const dto = FlashcardTagControllerTestData.INVALID_DTOS.TOO_LONG_NAME;
      const errorDetails = { name: ['Name cannot exceed 50 characters'] };

      FlashcardTagControllerTestHelpers.mockUseCaseInvalidInput(
        setup.createFlashcardTagUseCase,
        errorDetails,
      );

      await expect(setup.controller.create(dto)).rejects.toThrow(
        BadRequestException,
      );

      try {
        await setup.controller.create(dto);
      } catch (error) {
        FlashcardTagControllerTestHelpers.expectBadRequestException(
          error,
          errorDetails,
        );
      }
    });

    it('should throw BadRequestException for invalid slug with uppercase', async () => {
      const dto =
        FlashcardTagControllerTestData.INVALID_DTOS.INVALID_SLUG_UPPERCASE;
      const errorDetails = {
        slug: [
          'Slug must contain only lowercase letters, numbers, and hyphens',
        ],
      };

      FlashcardTagControllerTestHelpers.mockUseCaseInvalidInput(
        setup.createFlashcardTagUseCase,
        errorDetails,
      );

      await expect(setup.controller.create(dto)).rejects.toThrow(
        BadRequestException,
      );

      try {
        await setup.controller.create(dto);
      } catch (error) {
        FlashcardTagControllerTestHelpers.expectBadRequestException(
          error,
          errorDetails,
        );
      }
    });

    it('should throw BadRequestException for invalid slug with spaces', async () => {
      const dto =
        FlashcardTagControllerTestData.INVALID_DTOS.INVALID_SLUG_SPACES;
      const errorDetails = {
        slug: [
          'Slug must contain only lowercase letters, numbers, and hyphens',
        ],
      };

      FlashcardTagControllerTestHelpers.mockUseCaseInvalidInput(
        setup.createFlashcardTagUseCase,
        errorDetails,
      );

      await expect(setup.controller.create(dto)).rejects.toThrow(
        BadRequestException,
      );

      try {
        await setup.controller.create(dto);
      } catch (error) {
        FlashcardTagControllerTestHelpers.expectBadRequestException(
          error,
          errorDetails,
        );
      }
    });

    it('should throw BadRequestException for invalid slug with underscore', async () => {
      const dto =
        FlashcardTagControllerTestData.INVALID_DTOS.INVALID_SLUG_UNDERSCORE;
      const errorDetails = {
        slug: [
          'Slug must contain only lowercase letters, numbers, and hyphens',
        ],
      };

      FlashcardTagControllerTestHelpers.mockUseCaseInvalidInput(
        setup.createFlashcardTagUseCase,
        errorDetails,
      );

      await expect(setup.controller.create(dto)).rejects.toThrow(
        BadRequestException,
      );

      try {
        await setup.controller.create(dto);
      } catch (error) {
        FlashcardTagControllerTestHelpers.expectBadRequestException(
          error,
          errorDetails,
        );
      }
    });

    it('should throw BadRequestException for too short slug', async () => {
      const dto = FlashcardTagControllerTestData.INVALID_DTOS.TOO_SHORT_SLUG;
      const errorDetails = {
        slug: ['Slug must be at least 3 characters long'],
      };

      FlashcardTagControllerTestHelpers.mockUseCaseInvalidInput(
        setup.createFlashcardTagUseCase,
        errorDetails,
      );

      await expect(setup.controller.create(dto)).rejects.toThrow(
        BadRequestException,
      );

      try {
        await setup.controller.create(dto);
      } catch (error) {
        FlashcardTagControllerTestHelpers.expectBadRequestException(
          error,
          errorDetails,
        );
      }
    });

    it('should throw BadRequestException for too long slug', async () => {
      const dto = FlashcardTagControllerTestData.INVALID_DTOS.TOO_LONG_SLUG;
      const errorDetails = { slug: ['Slug cannot exceed 50 characters'] };

      FlashcardTagControllerTestHelpers.mockUseCaseInvalidInput(
        setup.createFlashcardTagUseCase,
        errorDetails,
      );

      await expect(setup.controller.create(dto)).rejects.toThrow(
        BadRequestException,
      );

      try {
        await setup.controller.create(dto);
      } catch (error) {
        FlashcardTagControllerTestHelpers.expectBadRequestException(
          error,
          errorDetails,
        );
      }
    });
  });

  describe('Business Logic Errors', () => {
    it('should throw ConflictException when flashcard tag name already exists', async () => {
      const dto = FlashcardTagControllerTestData.VALID_DTOS.SIMPLE_TAG;

      FlashcardTagControllerTestHelpers.mockUseCaseDuplicateTag(
        setup.createFlashcardTagUseCase,
      );

      await expect(setup.controller.create(dto)).rejects.toThrow(
        ConflictException,
      );

      try {
        await setup.controller.create(dto);
      } catch (error) {
        FlashcardTagControllerTestHelpers.expectConflictException(error);
      }
    });

    it('should throw BadRequestException when slug already exists', async () => {
      const dto = FlashcardTagControllerTestData.VALID_DTOS.TAG_WITH_SLUG;
      const errorDetails = { slug: ['Slug already exists'] };

      FlashcardTagControllerTestHelpers.mockUseCaseInvalidInput(
        setup.createFlashcardTagUseCase,
        errorDetails,
      );

      await expect(setup.controller.create(dto)).rejects.toThrow(
        BadRequestException,
      );

      try {
        await setup.controller.create(dto);
      } catch (error) {
        FlashcardTagControllerTestHelpers.expectBadRequestException(
          error,
          errorDetails,
        );
      }
    });
  });

  describe('Repository Errors', () => {
    it('should throw InternalServerErrorException for unexpected errors', async () => {
      const dto = FlashcardTagControllerTestData.VALID_DTOS.SIMPLE_TAG;

      FlashcardTagControllerTestHelpers.mockUseCaseUnexpectedError(
        setup.createFlashcardTagUseCase,
      );

      await expect(setup.controller.create(dto)).rejects.toThrow(
        InternalServerErrorException,
      );

      try {
        await setup.controller.create(dto);
      } catch (error) {
        FlashcardTagControllerTestHelpers.expectInternalServerErrorException(
          error,
        );
      }
    });
  });

  describe('Edge Cases', () => {
    it('should pass undefined slug when not provided', async () => {
      const dto = { name: 'Test Name' };
      const expectedResponse =
        FlashcardTagControllerTestData.SUCCESS_RESPONSES.SIMPLE_TAG;

      FlashcardTagControllerTestHelpers.mockUseCaseSuccess(
        setup.createFlashcardTagUseCase,
        expectedResponse,
      );

      await setup.controller.create(dto);

      expect(setup.createFlashcardTagUseCase.execute).toHaveBeenCalledWith({
        name: dto.name,
        slug: undefined,
      });
    });

    it('should handle slug with numbers and hyphens', async () => {
      const dto = { name: 'Test Name', slug: 'test-123-slug' };
      const expectedResponse =
        FlashcardTagControllerTestData.SUCCESS_RESPONSES.SIMPLE_TAG;

      FlashcardTagControllerTestHelpers.mockUseCaseSuccess(
        setup.createFlashcardTagUseCase,
        expectedResponse,
      );

      const result = await setup.controller.create(dto);

      expect(setup.createFlashcardTagUseCase.execute).toHaveBeenCalledWith({
        name: dto.name,
        slug: dto.slug,
      });
      FlashcardTagControllerTestHelpers.expectSuccessResponse(
        result,
        expectedResponse,
      );
    });
  });
});
