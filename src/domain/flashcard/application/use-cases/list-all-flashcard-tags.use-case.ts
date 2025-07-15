import { Injectable, Inject } from '@nestjs/common';
import { left, right } from '@/core/either';
import { IFlashcardTagRepository } from '../repositories/i-flashcard-tag-repository';
import { ListAllFlashcardTagsRequest } from '../dtos/list-all-flashcard-tags-request.dto';
import { ListAllFlashcardTagsResponse } from '../dtos/list-all-flashcard-tags-response.dto';
import { listAllFlashcardTagsSchema } from './validations/list-all-flashcard-tags.schema';
import { InvalidInputError } from './errors/invalid-input-error';

@Injectable()
export class ListAllFlashcardTagsUseCase {
  constructor(
    @Inject('FlashcardTagRepository')
    private readonly flashcardTagRepository: IFlashcardTagRepository,
  ) {}

  async execute(
    request: ListAllFlashcardTagsRequest,
  ): Promise<ListAllFlashcardTagsResponse> {
    // 1. Input validation with Zod
    const parseResult = listAllFlashcardTagsSchema.safeParse(request);
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

    // 2. Retrieve all flashcard tags from repository
    const flashcardTagsResult = await this.flashcardTagRepository.findAll();
    if (flashcardTagsResult.isLeft()) {
      return left(new InvalidInputError('Failed to retrieve flashcard tags'));
    }

    // 3. Transform entities to response objects
    const flashcardTags = flashcardTagsResult.value.map((tag) =>
      tag.toResponseObject(),
    );

    // 4. Return success response
    return right({
      flashcardTags,
    });
  }
}
