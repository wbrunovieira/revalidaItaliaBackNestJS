// src/infra/controllers/flashcard.controller.ts

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  BadRequestException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import { CreateFlashcardDto } from './dtos/create-flashcard.dto';
import { GetFlashcardByIdQueryDto } from './dtos/get-flashcard-by-id-query.dto';
import { CreateFlashcardUseCase } from '@/domain/flashcard/application/use-cases/create-flashcard.use-case';
import { GetFlashcardByIdUseCase } from '@/domain/flashcard/application/use-cases/get-flashcard-by-id.use-case';
import { InvalidInputError } from '@/domain/flashcard/application/use-cases/errors/invalid-input-error';
import { ArgumentNotFoundError } from '@/domain/flashcard/application/use-cases/errors/argument-not-found-error';
import { FlashcardTagsNotFoundError } from '@/domain/flashcard/application/use-cases/errors/flashcard-tags-not-found-error';
import { DuplicateFlashcardError } from '@/domain/flashcard/application/use-cases/errors/duplicate-flashcard-error';
import { FlashcardNotFoundError } from '@/domain/flashcard/application/use-cases/errors/flashcard-not-found-error';
import { RepositoryError } from '@/domain/flashcard/application/use-cases/errors/repository-error';

@Controller('flashcards')
export class FlashcardController {
  constructor(
    @Inject(CreateFlashcardUseCase)
    private readonly createFlashcardUseCase: CreateFlashcardUseCase,
    @Inject(GetFlashcardByIdUseCase)
    private readonly getFlashcardByIdUseCase: GetFlashcardByIdUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateFlashcardDto) {
    try {
      const result = await this.createFlashcardUseCase.execute({
        question: {
          type: dto.question.type,
          content: dto.question.content,
        },
        answer: {
          type: dto.answer.type,
          content: dto.answer.content,
        },
        argumentId: dto.argumentId,
        tagIds: dto.tagIds,
        slug: dto.slug,
        importBatchId: dto.importBatchId,
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

        if (error instanceof ArgumentNotFoundError) {
          throw new NotFoundException({
            error: 'ARGUMENT_NOT_FOUND',
            message: error.message,
          });
        }

        if (error instanceof FlashcardTagsNotFoundError) {
          throw new NotFoundException({
            error: 'FLASHCARD_TAGS_NOT_FOUND',
            message: error.message,
          });
        }

        if (error instanceof DuplicateFlashcardError) {
          throw new ConflictException({
            error: 'DUPLICATE_FLASHCARD',
            message: error.message,
          });
        }

        if (error instanceof RepositoryError) {
          throw new InternalServerErrorException({
            error: 'INTERNAL_ERROR',
            message: error.message,
          });
        }

        // Fallback para erros não mapeados
        throw new InternalServerErrorException({
          error: 'INTERNAL_ERROR',
          message: 'Unexpected error occurred',
        });
      }

      return {
        success: true,
        ...result.value,
      };
    } catch (error) {
      // Re-throw NestJS exceptions
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      // Handle unexpected errors
      throw new InternalServerErrorException({
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unexpected error occurred',
      });
    }
  }

  @Get(':id')
  async findById(@Param('id') id: string, @Query() query: GetFlashcardByIdQueryDto) {
    try {
      const result = await this.getFlashcardByIdUseCase.execute({
        id,
        filters: {
          includeTags: query.includeTags,
          includeInteractionStats: query.includeInteractionStats,
          includeRelatedFlashcards: query.includeRelatedFlashcards,
        },
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

        if (error instanceof FlashcardNotFoundError) {
          throw new NotFoundException({
            error: 'FLASHCARD_NOT_FOUND',
            message: error.message,
          });
        }

        if (error instanceof RepositoryError) {
          throw new InternalServerErrorException({
            error: 'INTERNAL_ERROR',
            message: error.message,
          });
        }

        // Fallback para erros não mapeados
        throw new InternalServerErrorException({
          error: 'INTERNAL_ERROR',
          message: 'Unexpected error occurred',
        });
      }

      return {
        success: true,
        ...result.value,
      };
    } catch (error) {
      // Re-throw NestJS exceptions
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      // Handle unexpected errors
      throw new InternalServerErrorException({
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unexpected error occurred',
      });
    }
  }
}