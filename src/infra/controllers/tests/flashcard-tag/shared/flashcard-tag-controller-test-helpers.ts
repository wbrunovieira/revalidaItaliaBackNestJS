import { left, right } from '@/core/either';
import { InvalidInputError } from '@/domain/flashcard/application/use-cases/errors/invalid-input-error';
import { DuplicateFlashcardTagError } from '@/domain/flashcard/application/use-cases/errors/duplicate-flashcard-tag-error';
import { FlashcardTagControllerTestData } from './flashcard-tag-controller-test-data';
import { vi } from 'vitest';

export class FlashcardTagControllerTestHelpers {
  static createSuccessUseCaseResponse(data: any) {
    return right(data);
  }

  static createInvalidInputErrorResponse(
    details: Record<string, string[]> = {},
  ) {
    return left(new InvalidInputError('Validation failed', details));
  }

  static createDuplicateTagErrorResponse() {
    return left(new DuplicateFlashcardTagError());
  }

  static createUnexpectedErrorResponse() {
    return left(new Error('Unexpected database error'));
  }

  static expectBadRequestException(
    error: any,
    expectedDetails?: Record<string, string[]>,
  ) {
    expect(error.getStatus()).toBe(400);
    expect(error.getResponse()).toEqual({
      error: 'INVALID_INPUT',
      message: 'Invalid input data',
      details: expectedDetails || expect.any(Object),
    });
  }

  static expectConflictException(error: any) {
    expect(error.getStatus()).toBe(409);
    expect(error.getResponse()).toEqual({
      error: 'DUPLICATE_FLASHCARD_TAG',
      message: 'FlashcardTag with this name already exists',
    });
  }

  static expectInternalServerErrorException(error: any) {
    expect(error.getStatus()).toBe(500);
    expect(error.getResponse()).toEqual({
      error: 'INTERNAL_ERROR',
      message: 'Unexpected error occurred',
    });
  }

  static expectSuccessResponse(result: any, expectedData: any) {
    expect(result).toEqual({
      flashcardTag: expectedData.flashcardTag,
    });
  }

  static mockUseCaseSuccess(mockUseCase: any, responseData: any) {
    mockUseCase.execute = vi
      .fn()
      .mockResolvedValue(
        FlashcardTagControllerTestHelpers.createSuccessUseCaseResponse(
          responseData,
        ),
      );
  }

  static mockUseCaseInvalidInput(
    mockUseCase: any,
    details?: Record<string, string[]>,
  ) {
    mockUseCase.execute = vi
      .fn()
      .mockResolvedValue(
        FlashcardTagControllerTestHelpers.createInvalidInputErrorResponse(
          details,
        ),
      );
  }

  static mockUseCaseDuplicateTag(mockUseCase: any) {
    mockUseCase.execute = vi
      .fn()
      .mockResolvedValue(
        FlashcardTagControllerTestHelpers.createDuplicateTagErrorResponse(),
      );
  }

  static mockUseCaseUnexpectedError(mockUseCase: any) {
    mockUseCase.execute = vi
      .fn()
      .mockResolvedValue(
        FlashcardTagControllerTestHelpers.createUnexpectedErrorResponse(),
      );
  }
}
