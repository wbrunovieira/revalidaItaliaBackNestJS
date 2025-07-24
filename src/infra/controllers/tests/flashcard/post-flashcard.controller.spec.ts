// src/infra/controllers/tests/flashcard/post-flashcard.controller.spec.ts

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FlashcardControllerTestSetup } from './shared/flashcard-controller-test-setup';
import { FlashcardControllerTestHelpers } from './shared/flashcard-controller-test-helpers';
import { FlashcardControllerTestData } from './shared/flashcard-controller-test-data';
import { InvalidInputError } from '@/domain/flashcard/application/use-cases/errors/invalid-input-error';
import { ArgumentNotFoundError } from '@/domain/flashcard/application/use-cases/errors/argument-not-found-error';
import { FlashcardTagsNotFoundError } from '@/domain/flashcard/application/use-cases/errors/flashcard-tags-not-found-error';
import { DuplicateFlashcardError } from '@/domain/flashcard/application/use-cases/errors/duplicate-flashcard-error';
import { RepositoryError } from '@/domain/flashcard/application/use-cases/errors/repository-error';

describe('POST /flashcards', () => {
  let testSetup: FlashcardControllerTestSetup;
  let helpers: FlashcardControllerTestHelpers;

  beforeEach(async () => {
    testSetup = new FlashcardControllerTestSetup();
    helpers = new FlashcardControllerTestHelpers(testSetup);
    await testSetup.initialize();
  });

  afterEach(async () => {
    await testSetup.teardown();
    vi.clearAllMocks();
  });

  describe('Success scenarios', () => {
    it('should create a flashcard with text content', async () => {
      const dto =
        FlashcardControllerTestData.validCreateFlashcardDtos.textOnly();
      const expectedResponse =
        FlashcardControllerTestData.successResponses.textOnly();

      await helpers.createFlashcardExpectingSuccess(dto, expectedResponse);

      helpers.verifyUseCaseWasCalledWith({
        question: dto.question,
        answer: dto.answer,
        argumentId: dto.argumentId,
        tagIds: undefined,
        slug: undefined,
        importBatchId: undefined,
      });
    });

    it('should create a flashcard with image content', async () => {
      const dto =
        FlashcardControllerTestData.validCreateFlashcardDtos.imageOnly();
      const expectedResponse =
        FlashcardControllerTestData.successResponses.textOnly();

      await helpers.createFlashcardExpectingSuccess(dto, expectedResponse);

      helpers.verifyUseCaseWasCalledOnce();
    });

    it('should create a flashcard with mixed content (IMAGE/TEXT)', async () => {
      const dto =
        FlashcardControllerTestData.validCreateFlashcardDtos.mixedImageText();
      const expectedResponse =
        FlashcardControllerTestData.successResponses.textOnly();

      await helpers.createFlashcardExpectingSuccess(dto, expectedResponse);

      helpers.verifyUseCaseWasCalledOnce();
    });

    it('should create a flashcard with mixed content (TEXT/IMAGE)', async () => {
      const dto =
        FlashcardControllerTestData.validCreateFlashcardDtos.mixedTextImage();
      const expectedResponse =
        FlashcardControllerTestData.successResponses.textOnly();

      await helpers.createFlashcardExpectingSuccess(dto, expectedResponse);

      helpers.verifyUseCaseWasCalledOnce();
    });

    it('should create a flashcard with tags', async () => {
      const dto =
        FlashcardControllerTestData.validCreateFlashcardDtos.withTags();
      const expectedResponse =
        FlashcardControllerTestData.successResponses.withTags();

      await helpers.createFlashcardExpectingSuccess(dto, expectedResponse);

      helpers.verifyUseCaseWasCalledWith({
        question: dto.question,
        answer: dto.answer,
        argumentId: dto.argumentId,
        tagIds: dto.tagIds,
        slug: undefined,
        importBatchId: undefined,
      });
    });

    it('should create a flashcard with custom slug', async () => {
      const dto =
        FlashcardControllerTestData.validCreateFlashcardDtos.withCustomSlug();
      const expectedResponse =
        FlashcardControllerTestData.successResponses.textOnly();

      await helpers.createFlashcardExpectingSuccess(dto, expectedResponse);

      helpers.verifyUseCaseWasCalledWith({
        question: dto.question,
        answer: dto.answer,
        argumentId: dto.argumentId,
        tagIds: undefined,
        slug: dto.slug,
        importBatchId: undefined,
      });
    });

    it('should create a flashcard with import batch ID', async () => {
      const dto =
        FlashcardControllerTestData.validCreateFlashcardDtos.withImportBatchId();
      const expectedResponse =
        FlashcardControllerTestData.successResponses.textOnly();

      await helpers.createFlashcardExpectingSuccess(dto, expectedResponse);

      helpers.verifyUseCaseWasCalledWith({
        question: dto.question,
        answer: dto.answer,
        argumentId: dto.argumentId,
        tagIds: undefined,
        slug: undefined,
        importBatchId: dto.importBatchId,
      });
    });

    it('should create a flashcard with all optional fields', async () => {
      const dto =
        FlashcardControllerTestData.validCreateFlashcardDtos.complete();
      const expectedResponse =
        FlashcardControllerTestData.successResponses.complete();

      await helpers.createFlashcardExpectingSuccess(dto, expectedResponse);

      helpers.verifyUseCaseWasCalledWith({
        question: dto.question,
        answer: dto.answer,
        argumentId: dto.argumentId,
        tagIds: dto.tagIds,
        slug: dto.slug,
        importBatchId: dto.importBatchId,
      });
    });
  });

  describe('Error scenarios - InvalidInputError', () => {
    it('should return 400 when use case returns InvalidInputError', async () => {
      const dto =
        FlashcardControllerTestData.validCreateFlashcardDtos.textOnly();
      const errorDetails = { 'question.type': ['Invalid type'] };

      testSetup.mockCreateFlashcardError(
        new InvalidInputError('Invalid input data', errorDetails),
      );

      await helpers.createFlashcardExpectingBadRequest(dto, errorDetails);
    });
  });

  describe('Error scenarios - ArgumentNotFoundError', () => {
    it('should return 404 when argument is not found', async () => {
      const dto =
        FlashcardControllerTestData.validCreateFlashcardDtos.textOnly();
      const errorMessage = `Argument with ID "${dto.argumentId}" not found`;

      testSetup.mockCreateFlashcardError(
        new ArgumentNotFoundError(dto.argumentId),
      );

      await helpers.createFlashcardExpectingNotFound(
        dto,
        'ARGUMENT_NOT_FOUND',
        errorMessage,
      );
    });
  });

  describe('Error scenarios - FlashcardTagsNotFoundError', () => {
    it('should return 404 when tags are not found', async () => {
      const dto =
        FlashcardControllerTestData.validCreateFlashcardDtos.withTags();
      const missingTagIds = dto.tagIds || [];
      const errorMessage = `Flashcard tags with IDs "${missingTagIds.join(', ')}" not found`;

      testSetup.mockCreateFlashcardError(
        new FlashcardTagsNotFoundError(missingTagIds),
      );

      await helpers.createFlashcardExpectingNotFound(
        dto,
        'FLASHCARD_TAGS_NOT_FOUND',
        errorMessage,
      );
    });
  });

  describe('Error scenarios - DuplicateFlashcardError', () => {
    it('should return 409 when slug already exists', async () => {
      const dto =
        FlashcardControllerTestData.validCreateFlashcardDtos.withCustomSlug();
      const errorMessage = `Flashcard with slug "${dto.slug}" already exists`;

      testSetup.mockCreateFlashcardError(
        new DuplicateFlashcardError(dto.slug!),
      );

      await helpers.createFlashcardExpectingConflict(dto, errorMessage);
    });
  });

  describe('Error scenarios - RepositoryError', () => {
    it('should return 500 when repository fails', async () => {
      const dto =
        FlashcardControllerTestData.validCreateFlashcardDtos.textOnly();
      const errorMessage = 'Database connection failed';

      testSetup.mockCreateFlashcardError(new RepositoryError(errorMessage));

      await helpers.createFlashcardExpectingInternalError(dto, errorMessage);
    });
  });

  describe('Error scenarios - Unexpected errors', () => {
    it('should return 500 for unexpected errors', async () => {
      const dto =
        FlashcardControllerTestData.validCreateFlashcardDtos.textOnly();

      testSetup.mockCreateFlashcardError(
        new Error('Some unexpected error') as any,
      );

      await helpers.createFlashcardExpectingInternalError(
        dto,
        'Unexpected error occurred',
      );
    });

    it('should return 500 when use case throws', async () => {
      const dto =
        FlashcardControllerTestData.validCreateFlashcardDtos.textOnly();

      testSetup.mockCreateFlashcardThrows(new Error('Async error'));

      await helpers.createFlashcardExpectingInternalError(dto);
    });
  });

  describe('Input validation edge cases', () => {
    it('should handle empty arrays for tagIds', async () => {
      const dto = {
        ...FlashcardControllerTestData.validCreateFlashcardDtos.textOnly(),
        tagIds: [],
      };
      const expectedResponse =
        FlashcardControllerTestData.successResponses.textOnly();

      await helpers.createFlashcardExpectingSuccess(dto, expectedResponse);

      helpers.verifyUseCaseWasCalledWith({
        question: dto.question,
        answer: dto.answer,
        argumentId: dto.argumentId,
        tagIds: [],
        slug: undefined,
        importBatchId: undefined,
      });
    });

    it('should handle very long valid content', async () => {
      const dto = {
        ...FlashcardControllerTestData.validCreateFlashcardDtos.textOnly(),
        question: {
          type: 'TEXT' as const,
          content: 'a'.repeat(1000), // Maximum allowed length
        },
      };
      const expectedResponse =
        FlashcardControllerTestData.successResponses.textOnly();

      await helpers.createFlashcardExpectingSuccess(dto, expectedResponse);

      helpers.verifyUseCaseWasCalledOnce();
    });

    it('should handle valid slug with hyphens and numbers', async () => {
      const dto = {
        ...FlashcardControllerTestData.validCreateFlashcardDtos.textOnly(),
        slug: 'valid-slug-123',
      };
      const expectedResponse =
        FlashcardControllerTestData.successResponses.textOnly();

      await helpers.createFlashcardExpectingSuccess(dto, expectedResponse);

      helpers.verifyUseCaseWasCalledWith({
        question: dto.question,
        answer: dto.answer,
        argumentId: dto.argumentId,
        tagIds: undefined,
        slug: dto.slug,
        importBatchId: undefined,
      });
    });

    it('should handle multiple tags', async () => {
      const dto = {
        ...FlashcardControllerTestData.validCreateFlashcardDtos.textOnly(),
        tagIds: [
          '550e8400-e29b-41d4-a716-446655440001',
          '550e8400-e29b-41d4-a716-446655440002',
          '550e8400-e29b-41d4-a716-446655440003',
        ],
      };
      const expectedResponse =
        FlashcardControllerTestData.successResponses.textOnly();

      await helpers.createFlashcardExpectingSuccess(dto, expectedResponse);

      helpers.verifyUseCaseWasCalledWith({
        question: dto.question,
        answer: dto.answer,
        argumentId: dto.argumentId,
        tagIds: dto.tagIds,
        slug: undefined,
        importBatchId: undefined,
      });
    });
  });
});
