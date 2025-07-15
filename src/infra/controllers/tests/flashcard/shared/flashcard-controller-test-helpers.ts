// src/infra/controllers/tests/flashcard/shared/flashcard-controller-test-helpers.ts

import { FlashcardControllerTestSetup } from './flashcard-controller-test-setup';
import { CreateFlashcardResponseDto } from '@/domain/flashcard/application/dtos/create-flashcard-response.dto';
import { CreateFlashcardDto } from '@/infra/controllers/dtos/create-flashcard.dto';
import {
  BadRequestException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';

export class FlashcardControllerTestHelpers {
  constructor(private readonly testSetup: FlashcardControllerTestSetup) {}

  async createFlashcard(dto: CreateFlashcardDto): Promise<any> {
    return await this.testSetup.controller.create(dto);
  }

  async createFlashcardExpectingSuccess(
    dto: CreateFlashcardDto,
    expectedResponse: CreateFlashcardResponseDto,
  ): Promise<any> {
    this.testSetup.mockCreateFlashcardSuccess(expectedResponse);
    const result = await this.createFlashcard(dto);

    expect(result).toEqual({
      success: true,
      ...expectedResponse,
    });

    return result;
  }

  async createFlashcardExpectingBadRequest(
    dto: CreateFlashcardDto,
    errorDetails?: Record<string, string[]>,
  ): Promise<void> {
    try {
      await this.createFlashcard(dto);
      fail('Expected BadRequestException to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const response = (error as BadRequestException).getResponse() as any;
      expect(response.error).toBe('INVALID_INPUT');
      expect(response.message).toBe('Invalid input data');
      if (errorDetails) {
        expect(response.details).toEqual(errorDetails);
      }
    }
  }

  async createFlashcardExpectingNotFound(
    dto: CreateFlashcardDto,
    errorType: 'ARGUMENT_NOT_FOUND' | 'FLASHCARD_TAGS_NOT_FOUND',
    errorMessage: string,
  ): Promise<void> {
    try {
      await this.createFlashcard(dto);
      fail('Expected NotFoundException to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException);
      const response = (error as NotFoundException).getResponse() as any;
      expect(response.error).toBe(errorType);
      expect(response.message).toBe(errorMessage);
    }
  }

  async createFlashcardExpectingConflict(
    dto: CreateFlashcardDto,
    errorMessage: string,
  ): Promise<void> {
    try {
      await this.createFlashcard(dto);
      fail('Expected ConflictException to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictException);
      const response = (error as ConflictException).getResponse() as any;
      expect(response.error).toBe('DUPLICATE_FLASHCARD');
      expect(response.message).toBe(errorMessage);
    }
  }

  async createFlashcardExpectingInternalError(
    dto: CreateFlashcardDto,
    errorMessage?: string,
  ): Promise<void> {
    try {
      await this.createFlashcard(dto);
      fail('Expected InternalServerErrorException to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(InternalServerErrorException);
      const response = (
        error as InternalServerErrorException
      ).getResponse() as any;
      expect(response.error).toBe('INTERNAL_ERROR');
      if (errorMessage) {
        expect(response.message).toBe(errorMessage);
      }
    }
  }

  verifyUseCaseWasCalledWith(expectedRequest: any): void {
    expect(
      this.testSetup.createFlashcardUseCaseMock.execute,
    ).toHaveBeenCalledWith(expectedRequest);
  }

  verifyUseCaseWasCalledOnce(): void {
    expect(
      this.testSetup.createFlashcardUseCaseMock.execute,
    ).toHaveBeenCalledTimes(1);
  }

  verifyUseCaseWasNotCalled(): void {
    expect(
      this.testSetup.createFlashcardUseCaseMock.execute,
    ).not.toHaveBeenCalled();
  }
}
