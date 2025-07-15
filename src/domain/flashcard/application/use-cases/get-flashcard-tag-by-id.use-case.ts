import { Injectable, Inject } from '@nestjs/common';
import { left, right } from '@/core/either';
import { IFlashcardTagRepository } from '../repositories/i-flashcard-tag-repository';
import { GetFlashcardTagByIdRequest } from '../dtos/get-flashcard-tag-by-id-request.dto';
import { GetFlashcardTagByIdResponse } from '../dtos/get-flashcard-tag-by-id-response.dto';
import { getFlashcardTagByIdSchema } from './validations/get-flashcard-tag-by-id.schema';
import { InvalidInputError } from './errors/invalid-input-error';
import { FlashcardTagNotFoundError } from './errors/flashcard-tag-not-found-error';

@Injectable()
export class GetFlashcardTagByIdUseCase {
  constructor(
    @Inject('FlashcardTagRepository')
    private readonly flashcardTagRepository: IFlashcardTagRepository,
  ) {}

  async execute(
    request: GetFlashcardTagByIdRequest,
  ): Promise<GetFlashcardTagByIdResponse> {
    // 1. Input validation with Zod
    const parseResult = getFlashcardTagByIdSchema.safeParse(request);
    if (!parseResult.success) {
      const details: Record<string, string[]> = {};
      parseResult.error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        if (!details[path]) {
          details[path] = [];
        }

        details[path].push(issue.message);
      });

      return left(new InvalidInputError('Validation failed', details));
    }

    const { id } = parseResult.data;

    // 2. Find flashcard tag by ID
    const flashcardTagResult = await this.flashcardTagRepository.findById(id);
    if (flashcardTagResult.isLeft()) {
      // Check if it's a "not found" error
      if (flashcardTagResult.value.message.includes('not found')) {
        return left(new FlashcardTagNotFoundError());
      }
      return left(new InvalidInputError('Failed to find flashcard tag'));
    }

    if (!flashcardTagResult.value) {
      return left(new FlashcardTagNotFoundError());
    }

    // 3. Return success response
    return right({
      flashcardTag: flashcardTagResult.value.toResponseObject(),
    });
  }
}
