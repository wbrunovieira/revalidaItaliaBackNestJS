// src/infra/controllers/question-option.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateQuestionOptionUseCase } from '@/domain/assessment/application/use-cases/create-question-option.use-case';
import { ListQuestionOptionsUseCase } from '@/domain/assessment/application/use-cases/list-question-options.use-case';
import { CreateQuestionOptionDto } from '@/domain/assessment/application/dtos/create-question-option.dto';
import { InvalidInputError } from '@/domain/assessment/application/use-cases/errors/invalid-input-error';
import { QuestionNotFoundError } from '@/domain/assessment/application/use-cases/errors/question-not-found-error';
import { RepositoryError } from '@/domain/assessment/application/use-cases/errors/repository-error';

@Controller('questions')
export class QuestionOptionController {
  constructor(
    private readonly createQuestionOptionUseCase: CreateQuestionOptionUseCase,
    private readonly listQuestionOptionsUseCase: ListQuestionOptionsUseCase,
  ) {}

  @Post(':questionId/options')
  async createOption(
    @Param('questionId') questionId: string,
    @Body() dto: CreateQuestionOptionDto,
  ) {
    const request = {
      text: dto.text,
      questionId,
    };

    const result = await this.createQuestionOptionUseCase.execute(request);

    if (result.isLeft()) {
      const error = result.value;

      if (error instanceof InvalidInputError) {
        throw new BadRequestException({
          error: 'INVALID_INPUT',
          message: error.message,
        });
      }

      if (error instanceof QuestionNotFoundError) {
        throw new NotFoundException({
          error: 'QUESTION_NOT_FOUND',
          message: 'Question not found',
        });
      }

      if (error instanceof RepositoryError) {
        throw new InternalServerErrorException({
          error: 'REPOSITORY_ERROR',
          message: error.message,
        });
      }

      throw new InternalServerErrorException({
        error: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
      });
    }

    return result.value;
  }

  @Get(':questionId/options')
  async listOptions(@Param('questionId') questionId: string) {
    const request = { questionId };

    const result = await this.listQuestionOptionsUseCase.execute(request);

    if (result.isLeft()) {
      const error = result.value;

      if (error instanceof InvalidInputError) {
        throw new BadRequestException({
          error: 'INVALID_INPUT',
          message: error.message,
        });
      }

      if (error instanceof QuestionNotFoundError) {
        throw new NotFoundException({
          error: 'QUESTION_NOT_FOUND',
          message: 'Question not found',
        });
      }

      if (error instanceof RepositoryError) {
        throw new InternalServerErrorException({
          error: 'REPOSITORY_ERROR',
          message: error.message,
        });
      }

      throw new InternalServerErrorException({
        error: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
      });
    }

    return result.value;
  }
}
