// src/infra/controllers/answer.controller.ts

import { GetAnswerUseCase } from '@/domain/assessment/application/use-cases/get-answer.use-case';
import { CreateAnswerUseCase } from '@/domain/assessment/application/use-cases/create-answer.use-case';
import { ListAnswersUseCase } from '@/domain/assessment/application/use-cases/list-answers.use-case';
import { CreateAnswerDto } from '@/domain/assessment/application/dtos/create-answer.dto';
import { InvalidInputError } from '@/domain/assessment/application/use-cases/errors/invalid-input-error';
import { AnswerNotFoundError } from '@/domain/assessment/application/use-cases/errors/answer-not-found-error';
import { AnswerAlreadyExistsError } from '@/domain/assessment/application/use-cases/errors/answer-already-exists-error';
import { QuestionNotFoundError } from '@/domain/assessment/application/use-cases/errors/question-not-found-error';
import { AssessmentNotFoundError } from '@/domain/assessment/application/use-cases/errors/assessment-not-found-error';
import { InvalidAnswerTypeError } from '@/domain/assessment/application/use-cases/errors/invalid-answer-type-error';
import { RepositoryError } from '@/domain/assessment/application/use-cases/errors/repository-error';
import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Inject,
  BadRequestException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';

@Controller('answers')
export class AnswerController {
  constructor(
    @Inject(GetAnswerUseCase)
    private readonly getAnswerUseCase: GetAnswerUseCase,
    @Inject(CreateAnswerUseCase)
    private readonly createAnswerUseCase: CreateAnswerUseCase,
    @Inject(ListAnswersUseCase)
    private readonly listAnswersUseCase: ListAnswersUseCase,
  ) {}

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('questionId') questionId?: string,
  ) {
    const request = {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      questionId,
    };

    const result = await this.listAnswersUseCase.execute(request);

    if (result.isLeft()) {
      const error = result.value;

      if (error instanceof InvalidInputError) {
        throw new BadRequestException({
          error: 'INVALID_INPUT',
          message: 'Invalid input data',
          details: error.details,
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

    return result.value;
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const request = { id };

    const result = await this.getAnswerUseCase.execute(request);

    if (result.isLeft()) {
      const error = result.value;

      if (error instanceof InvalidInputError) {
        throw new BadRequestException({
          error: 'INVALID_INPUT',
          message: 'Invalid input data',
          details: error.details,
        });
      }

      if (error instanceof AnswerNotFoundError) {
        throw new NotFoundException({
          error: 'ANSWER_NOT_FOUND',
          message: 'Answer not found',
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

    return result.value;
  }

  @Post()
  async create(@Body() dto: CreateAnswerDto) {
    const request = {
      correctOptionId: dto.correctOptionId,
      explanation: dto.explanation,
      questionId: dto.questionId,
      translations: dto.translations,
    };

    const result = await this.createAnswerUseCase.execute(request);

    if (result.isLeft()) {
      const error = result.value;

      if (error instanceof InvalidInputError) {
        throw new BadRequestException({
          error: 'INVALID_INPUT',
          message: 'Invalid input data',
          details: error.details,
        });
      }

      if (error instanceof AnswerAlreadyExistsError) {
        throw new ConflictException({
          error: 'ANSWER_ALREADY_EXISTS',
          message: 'Answer already exists for this question',
        });
      }

      if (error instanceof QuestionNotFoundError) {
        throw new NotFoundException({
          error: 'QUESTION_NOT_FOUND',
          message: 'Question not found',
        });
      }

      if (error instanceof AssessmentNotFoundError) {
        throw new NotFoundException({
          error: 'ASSESSMENT_NOT_FOUND',
          message: 'Assessment not found',
        });
      }

      if (error instanceof InvalidAnswerTypeError) {
        throw new BadRequestException({
          error: 'INVALID_ANSWER_TYPE',
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

    return result.value;
  }
}