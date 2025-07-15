import {
  Controller,
  Post,
  Body,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import { CreateFlashcardTagUseCase } from '@/domain/flashcard/application/use-cases/create-flashcard-tag.use-case';
import { CreateFlashcardTagDto } from './dtos/create-flashcard-tag.dto';
import { InvalidInputError } from '@/domain/flashcard/application/use-cases/errors/invalid-input-error';
import { DuplicateFlashcardTagError } from '@/domain/flashcard/application/use-cases/errors/duplicate-flashcard-tag-error';

@Controller('flashcard-tags')
export class FlashcardTagController {
  constructor(
    @Inject(CreateFlashcardTagUseCase)
    private readonly createFlashcardTagUseCase: CreateFlashcardTagUseCase,
  ) {}

  @Post()
  async create(@Body() createFlashcardTagDto: CreateFlashcardTagDto) {
    const result = await this.createFlashcardTagUseCase.execute({
      name: createFlashcardTagDto.name,
      slug: createFlashcardTagDto.slug,
    });

    if (result.isLeft()) {
      const error = result.value;

      if (error instanceof InvalidInputError) {
        throw new BadRequestException({
          error: 'INVALID_INPUT',
          message: 'Invalid input data',
          details: error.details,
        });
      }

      if (error instanceof DuplicateFlashcardTagError) {
        throw new ConflictException({
          error: 'DUPLICATE_FLASHCARD_TAG',
          message: error.message,
        });
      }

      throw new InternalServerErrorException({
        error: 'INTERNAL_ERROR',
        message: 'Unexpected error occurred',
      });
    }

    return {
      flashcardTag: result.value.flashcardTag,
    };
  }
}