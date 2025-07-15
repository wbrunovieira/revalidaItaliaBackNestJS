import { Injectable, Inject } from '@nestjs/common';
import { left, right } from '@/core/either';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { IFlashcardTagRepository } from '../repositories/i-flashcard-tag-repository';
import { FlashcardTag } from '../../enterprise/entities/flashcard-tag.entity';
import { CreateFlashcardTagRequest } from '../dtos/create-flashcard-tag-request.dto';
import { CreateFlashcardTagResponse } from '../dtos/create-flashcard-tag-response.dto';
import { createFlashcardTagSchema } from './validations/create-flashcard-tag.schema';
import { InvalidInputError } from './errors/invalid-input-error';
import { DuplicateFlashcardTagError } from './errors/duplicate-flashcard-tag-error';

@Injectable()
export class CreateFlashcardTagUseCase {
  constructor(
    @Inject('FlashcardTagRepository')
    private readonly flashcardTagRepository: IFlashcardTagRepository,
  ) {}

  async execute(
    request: CreateFlashcardTagRequest,
  ): Promise<CreateFlashcardTagResponse> {
    // 1. Input validation with Zod
    const parseResult = createFlashcardTagSchema.safeParse(request);
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

    const { name, slug } = parseResult.data;

    // 2. Check if name already exists
    const existingByNameResult =
      await this.flashcardTagRepository.checkIfNameExists(name);
    if (existingByNameResult.isLeft()) {
      return left(new InvalidInputError('Failed to check name existence'));
    }

    if (existingByNameResult.value) {
      return left(new DuplicateFlashcardTagError());
    }

    // 3. Check if custom slug already exists (if provided)
    if (slug) {
      const existingBySlugResult =
        await this.flashcardTagRepository.checkIfSlugExists(slug);
      if (existingBySlugResult.isLeft()) {
        return left(new InvalidInputError('Failed to check slug existence'));
      }

      if (existingBySlugResult.value) {
        return left(
          new InvalidInputError('Validation failed', {
            slug: ['Slug already exists'],
          }),
        );
      }
    }

    // 4. Create FlashcardTag entity
    const flashcardTag = FlashcardTag.create(
      {
        name,
        slug,
      },
      new UniqueEntityID(),
    );

    // 5. Save to repository
    const createResult = await this.flashcardTagRepository.create(flashcardTag);
    if (createResult.isLeft()) {
      return left(new InvalidInputError('Failed to create flashcard tag'));
    }

    // 6. Return success response
    return right({
      flashcardTag: flashcardTag.toResponseObject(),
    });
  }
}
