// src/infra/controllers/answer.controller.ts

import { GetAnswerUseCase } from '@/domain/assessment/application/use-cases/get-answer.use-case';
import { InvalidInputError } from '@/domain/assessment/application/use-cases/errors/invalid-input-error';
import { AnswerNotFoundError } from '@/domain/assessment/application/use-cases/errors/answer-not-found-error';
import { RepositoryError } from '@/domain/assessment/application/use-cases/errors/repository-error';
import {
  Controller,
  Get,
  Param,
  Inject,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';

@Controller('answers')
export class AnswerController {
  constructor(
    @Inject(GetAnswerUseCase)
    private readonly getAnswerUseCase: GetAnswerUseCase,
  ) {}

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
}