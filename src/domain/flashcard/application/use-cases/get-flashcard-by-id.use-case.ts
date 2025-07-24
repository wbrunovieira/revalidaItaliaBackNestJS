// src/domain/flashcard/application/use-cases/get-flashcard-by-id.use-case.ts
import { Inject, Injectable } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { ZodError } from 'zod';
import { IFlashcardRepository } from '../repositories/i-flashcard-repository';
import { IFlashcardTagRepository } from '../repositories/i-flashcard-tag-repository';
import { GetFlashcardByIdRequestDto } from '../dtos/get-flashcard-by-id-request.dto';
import {
  GetFlashcardByIdResponseDto,
  FlashcardTagDto,
} from '../dtos/get-flashcard-by-id-response.dto';
import { getFlashcardByIdSchema } from './validations/get-flashcard-by-id.schema';
import { InvalidInputError } from './errors/invalid-input-error';
import { FlashcardNotFoundError } from './errors/flashcard-not-found-error';
import { RepositoryError } from './errors/repository-error';
import { Flashcard } from '../../enterprise/entities/flashcard.entity';
import { FlashcardTag } from '../../enterprise/entities/flashcard-tag.entity';

type GetFlashcardByIdUseCaseResponse = Either<
  InvalidInputError | FlashcardNotFoundError | RepositoryError,
  GetFlashcardByIdResponseDto
>;

@Injectable()
export class GetFlashcardByIdUseCase {
  constructor(
    @Inject('FlashcardRepository')
    private readonly flashcardRepository: IFlashcardRepository,
    @Inject('FlashcardTagRepository')
    private readonly flashcardTagRepository: IFlashcardTagRepository,
  ) {}

  async execute(
    request: GetFlashcardByIdRequestDto,
  ): Promise<GetFlashcardByIdUseCaseResponse> {
    try {
      // Validate input
      const validationResult = getFlashcardByIdSchema.safeParse(request);
      if (!validationResult.success) {
        const details = this.formatZodErrors(validationResult.error);
        return left(new InvalidInputError('Invalid input data', details));
      }

      // Find flashcard by ID
      const flashcardResult = await this.flashcardRepository.findById(
        request.id,
      );

      if (flashcardResult.isLeft()) {
        if (flashcardResult.value.message === 'Flashcard not found') {
          return left(new FlashcardNotFoundError(request.id));
        }
        return left(new RepositoryError(flashcardResult.value.message));
      }

      const flashcard = flashcardResult.value;
      const response: GetFlashcardByIdResponseDto = {
        flashcard: this.mapFlashcardToDto(flashcard),
      };

      // Include tags if requested
      if (request.filters?.includeTags && flashcard.tagIds.length > 0) {
        const tagIds = flashcard.tagIds.map((id) => id.toString());
        const tagsResult = await this.flashcardTagRepository.findByIds(tagIds);

        if (tagsResult.isRight()) {
          response.flashcard.tags = tagsResult.value.map(this.mapTagToDto);
        }
      }

      return right(response);
    } catch (error: any) {
      return left(
        new RepositoryError(error.message || 'Failed to get flashcard'),
      );
    }
  }

  private mapFlashcardToDto(flashcard: Flashcard) {
    return {
      id: flashcard.id.toString(),
      slug: flashcard.slug,
      question: {
        type: flashcard.question.getType().getValue() as 'TEXT' | 'IMAGE',
        content: flashcard.question.getContent(),
      },
      answer: {
        type: flashcard.answer.getType().getValue() as 'TEXT' | 'IMAGE',
        content: flashcard.answer.getContent(),
      },
      argumentId: flashcard.argumentId.toString(),
      importBatchId: flashcard.importBatchId,
      exportedAt: flashcard.exportedAt,
      createdAt: flashcard.createdAt,
      updatedAt: flashcard.updatedAt,
    };
  }

  private mapTagToDto(tag: FlashcardTag): FlashcardTagDto {
    return {
      id: tag.id.toString(),
      name: tag.name,
      slug: tag.slug,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
    };
  }

  private formatZodErrors(error: ZodError): Record<string, string[]> {
    const details: Record<string, string[]> = {};

    error.issues.forEach((issue) => {
      const path = issue.path.join('.');
      if (!details[path]) {
        details[path] = [];
      }
      details[path].push(issue.message);
    });

    return details;
  }
}
