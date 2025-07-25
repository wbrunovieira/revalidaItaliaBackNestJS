// src/infra/controllers/tests/flashcard/shared/flashcard-controller-test-setup.ts

import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { FlashcardController } from '../../../flashcard.controller';
import { CreateFlashcardUseCase } from '@/domain/flashcard/application/use-cases/create-flashcard.use-case';
import { GetFlashcardByIdUseCase } from '@/domain/flashcard/application/use-cases/get-flashcard-by-id.use-case';
import { Either, left, right } from '@/core/either';
import { CreateFlashcardResponseDto } from '@/domain/flashcard/application/dtos/create-flashcard-response.dto';
import { GetFlashcardByIdResponseDto } from '@/domain/flashcard/application/dtos/get-flashcard-by-id-response.dto';
import { InvalidInputError } from '@/domain/flashcard/application/use-cases/errors/invalid-input-error';
import { ArgumentNotFoundError } from '@/domain/flashcard/application/use-cases/errors/argument-not-found-error';
import { FlashcardTagsNotFoundError } from '@/domain/flashcard/application/use-cases/errors/flashcard-tags-not-found-error';
import { DuplicateFlashcardError } from '@/domain/flashcard/application/use-cases/errors/duplicate-flashcard-error';
import { FlashcardNotFoundError } from '@/domain/flashcard/application/use-cases/errors/flashcard-not-found-error';
import { RepositoryError } from '@/domain/flashcard/application/use-cases/errors/repository-error';

export class FlashcardControllerTestSetup {
  private module: TestingModule;
  public controller: FlashcardController;
  public createFlashcardUseCaseMock: any;
  public getFlashcardByIdUseCaseMock: any;

  async initialize(): Promise<void> {
    this.createFlashcardUseCaseMock = {
      execute: vi.fn(),
    };

    this.getFlashcardByIdUseCaseMock = {
      execute: vi.fn(),
    };

    this.module = await Test.createTestingModule({
      controllers: [FlashcardController],
      providers: [
        {
          provide: CreateFlashcardUseCase,
          useValue: this.createFlashcardUseCaseMock,
        },
        {
          provide: GetFlashcardByIdUseCase,
          useValue: this.getFlashcardByIdUseCaseMock,
        },
      ],
    }).compile();

    this.controller = this.module.get<FlashcardController>(FlashcardController);
  }

  async teardown(): Promise<void> {
    await this.module.close();
  }

  mockCreateFlashcardSuccess(response: CreateFlashcardResponseDto): void {
    this.createFlashcardUseCaseMock.execute.mockResolvedValueOnce(
      right(response),
    );
  }

  mockCreateFlashcardError(
    error:
      | InvalidInputError
      | ArgumentNotFoundError
      | FlashcardTagsNotFoundError
      | DuplicateFlashcardError
      | RepositoryError,
  ): void {
    this.createFlashcardUseCaseMock.execute.mockResolvedValueOnce(left(error));
  }

  mockCreateFlashcardThrows(error: Error): void {
    this.createFlashcardUseCaseMock.execute.mockRejectedValueOnce(error);
  }

  mockGetFlashcardByIdSuccess(response: GetFlashcardByIdResponseDto): void {
    this.getFlashcardByIdUseCaseMock.execute.mockResolvedValueOnce(
      right(response),
    );
  }

  mockGetFlashcardByIdError(
    error: InvalidInputError | FlashcardNotFoundError | RepositoryError,
  ): void {
    this.getFlashcardByIdUseCaseMock.execute.mockResolvedValueOnce(left(error));
  }

  mockGetFlashcardByIdThrows(error: Error): void {
    this.getFlashcardByIdUseCaseMock.execute.mockRejectedValueOnce(error);
  }

  resetMocks(): void {
    vi.clearAllMocks();
  }
}
