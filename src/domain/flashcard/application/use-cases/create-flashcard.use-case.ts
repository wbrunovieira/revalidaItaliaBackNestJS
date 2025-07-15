// src/domain/flashcard/application/use-cases/create-flashcard.use-case.ts

import { Either, left, right } from '@/core/either';
import { Inject, Injectable } from '@nestjs/common';
import { ZodError } from 'zod';
import { CreateFlashcardRequestDto } from '../dtos/create-flashcard-request.dto';
import { CreateFlashcardResponseDto } from '../dtos/create-flashcard-response.dto';
import { createFlashcardSchema } from './validations/create-flashcard.schema';
import { InvalidInputError } from './errors/invalid-input-error';
import { ArgumentNotFoundError } from './errors/argument-not-found-error';
import { FlashcardTagsNotFoundError } from './errors/flashcard-tags-not-found-error';
import { DuplicateFlashcardError } from './errors/duplicate-flashcard-error';
import { RepositoryError } from './errors/repository-error';
import { IFlashcardRepository } from '../repositories/i-flashcard-repository';
import { IFlashcardTagRepository } from '../repositories/i-flashcard-tag-repository';
import { IArgumentRepository } from '@/domain/assessment/application/repositories/i-argument-repository';
import { Flashcard } from '../../enterprise/entities/flashcard.entity';
import { FlashcardContentVO } from '../../enterprise/value-objects/flashcard-content.vo';
import { UniqueEntityID } from '@/core/unique-entity-id';

type CreateFlashcardUseCaseResponse = Either<
  | InvalidInputError
  | ArgumentNotFoundError
  | FlashcardTagsNotFoundError
  | DuplicateFlashcardError
  | RepositoryError,
  CreateFlashcardResponseDto
>;

@Injectable()
export class CreateFlashcardUseCase {
  constructor(
    @Inject('FlashcardRepository')
    private flashcardRepository: IFlashcardRepository,
    @Inject('FlashcardTagRepository')
    private flashcardTagRepository: IFlashcardTagRepository,
    @Inject('ArgumentRepository')
    private argumentRepository: IArgumentRepository,
  ) {}

  async execute(
    request: CreateFlashcardRequestDto,
  ): Promise<CreateFlashcardUseCaseResponse> {
    try {
      // 1. Validate input
      const validationResult = createFlashcardSchema.safeParse(request);
      if (!validationResult.success) {
        const details = this.formatZodErrors(validationResult.error);
        return left(new InvalidInputError('Invalid input data', details));
      }

      const validatedData = validationResult.data;

      // 2. Validate argument exists
      const argumentResult = await this.argumentRepository.findById(
        validatedData.argumentId,
      );
      if (argumentResult.isLeft()) {
        return left(new ArgumentNotFoundError(validatedData.argumentId));
      }

      // 3. Validate tags exist (if provided)
      if (validatedData.tagIds && validatedData.tagIds.length > 0) {
        const tagIdsResult = await this.flashcardTagRepository.findByIds(
          validatedData.tagIds,
        );
        if (tagIdsResult.isLeft()) {
          return left(new RepositoryError(tagIdsResult.value.message));
        }

        const foundTags = tagIdsResult.value;
        const foundTagIds = foundTags.map((tag) => tag.id.toString());
        const missingTagIds = validatedData.tagIds.filter(
          (tagId) => !foundTagIds.includes(tagId),
        );

        if (missingTagIds.length > 0) {
          return left(new FlashcardTagsNotFoundError(missingTagIds));
        }
      }

      // 4. Create flashcard content value objects
      const questionContent = this.createFlashcardContent(
        validatedData.question.type,
        validatedData.question.content,
      );
      const answerContent = this.createFlashcardContent(
        validatedData.answer.type,
        validatedData.answer.content,
      );

      // 5. Create flashcard entity
      const flashcard = Flashcard.create({
        question: questionContent,
        answer: answerContent,
        argumentId: new UniqueEntityID(validatedData.argumentId),
        tagIds:
          validatedData.tagIds?.map((tagId) => new UniqueEntityID(tagId)) || [],
        slug: validatedData.slug,
        importBatchId: validatedData.importBatchId,
      });

      // 6. Check for duplicate slug
      const existingFlashcardResult = await this.flashcardRepository.findBySlug(
        flashcard.slug,
      );
      if (existingFlashcardResult.isRight()) {
        return left(new DuplicateFlashcardError(flashcard.slug));
      }

      // 7. Save flashcard
      const saveResult = await this.flashcardRepository.create(flashcard);
      if (saveResult.isLeft()) {
        return left(new RepositoryError(saveResult.value.message));
      }

      // 8. Return success response
      return right({
        flashcard: {
          id: flashcard.id.toString(),
          slug: flashcard.slug,
          question: {
            type: flashcard.question.getType().getValue(),
            content: flashcard.question.getContent(),
          },
          answer: {
            type: flashcard.answer.getType().getValue(),
            content: flashcard.answer.getContent(),
          },
          argumentId: flashcard.argumentId.toString(),
          tagIds: flashcard.tagIds.map((tagId) => tagId.toString()),
          importBatchId: flashcard.importBatchId,
          exportedAt: flashcard.exportedAt,
          createdAt: flashcard.createdAt,
          updatedAt: flashcard.updatedAt,
        },
      });
    } catch (error) {
      return left(new RepositoryError(error.message));
    }
  }

  private createFlashcardContent(
    type: 'TEXT' | 'IMAGE',
    content: string,
  ): FlashcardContentVO {
    if (type === 'TEXT') {
      return FlashcardContentVO.createText(content);
    } else {
      return FlashcardContentVO.createImage(content);
    }
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
