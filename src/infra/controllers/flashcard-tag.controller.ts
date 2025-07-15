import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  Inject,
  UseFilters,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CreateFlashcardTagUseCase } from '@/domain/flashcard/application/use-cases/create-flashcard-tag.use-case';
import { GetFlashcardTagByIdUseCase } from '@/domain/flashcard/application/use-cases/get-flashcard-tag-by-id.use-case';
import { ListAllFlashcardTagsUseCase } from '@/domain/flashcard/application/use-cases/list-all-flashcard-tags.use-case';
import { CreateFlashcardTagDto } from './dtos/create-flashcard-tag.dto';
import { InvalidInputError } from '@/domain/flashcard/application/use-cases/errors/invalid-input-error';
import { DuplicateFlashcardTagError } from '@/domain/flashcard/application/use-cases/errors/duplicate-flashcard-tag-error';
import { FlashcardTagNotFoundError } from '@/domain/flashcard/application/use-cases/errors/flashcard-tag-not-found-error';
import { ValidationExceptionFilter } from '../filters/validation-exception.filter';

@Controller('flashcard-tags')
@UseFilters(ValidationExceptionFilter)
export class FlashcardTagController {
  constructor(
    @Inject(CreateFlashcardTagUseCase)
    private readonly createFlashcardTagUseCase: CreateFlashcardTagUseCase,
    @Inject(GetFlashcardTagByIdUseCase)
    private readonly getFlashcardTagByIdUseCase: GetFlashcardTagByIdUseCase,
    @Inject(ListAllFlashcardTagsUseCase)
    private readonly listAllFlashcardTagsUseCase: ListAllFlashcardTagsUseCase,
  ) {}

  @Get(':id')
  async findById(@Param('id') id: string) {
    const result = await this.getFlashcardTagByIdUseCase.execute({ id });

    if (result.isLeft()) {
      const error = result.value;

      if (error instanceof InvalidInputError) {
        throw new BadRequestException({
          error: 'INVALID_INPUT',
          message: 'Invalid input data',
          details: error.details,
        });
      }

      if (error instanceof FlashcardTagNotFoundError) {
        throw new NotFoundException({
          error: 'FLASHCARD_TAG_NOT_FOUND',
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

  @Get()
  async findAll() {
    const result = await this.listAllFlashcardTagsUseCase.execute({});

    if (result.isLeft()) {
      const error = result.value;

      if (error instanceof InvalidInputError) {
        throw new BadRequestException({
          error: 'INVALID_INPUT',
          message: 'Invalid input data',
          details: error.details,
        });
      }

      throw new InternalServerErrorException({
        error: 'INTERNAL_ERROR',
        message: 'Unexpected error occurred',
      });
    }

    return {
      flashcardTags: result.value.flashcardTags,
    };
  }

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