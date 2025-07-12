// src/infra/controllers/question.controller.ts
import { CreateQuestionDto } from '@/domain/assessment/application/dtos/create-question.dto';
import { CreateQuestionUseCase } from '@/domain/assessment/application/use-cases/create-question.use-case';
import { DuplicateQuestionError } from '@/domain/assessment/application/use-cases/errors/duplicate-question-error';
import { InvalidInputError } from '@/domain/assessment/application/use-cases/errors/invalid-input-error';
import { AssessmentNotFoundError } from '@/domain/assessment/application/use-cases/errors/assessment-not-found-error';
import { ArgumentNotFoundError } from '@/domain/assessment/application/use-cases/errors/argument-not-found-error';
import { QuestionTypeMismatchError } from '@/domain/assessment/application/use-cases/errors/question-type-mismatch-error';
import { RepositoryError } from '@/domain/assessment/application/use-cases/errors/repository-error';
import {
  Controller,
  Post,
  Body,
  Inject,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

@Controller('questions')
export class QuestionController {
  constructor(
    @Inject(CreateQuestionUseCase)
    private readonly createQuestionUseCase: CreateQuestionUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateQuestionDto) {
    const request = {
      text: dto.text,
      type: dto.type,
      assessmentId: dto.assessmentId,
      argumentId: dto.argumentId,
    };

    const result = await this.createQuestionUseCase.execute(request);

    if (result.isLeft()) {
      const error = result.value;

      if (error instanceof InvalidInputError) {
        throw new BadRequestException({
          error: 'INVALID_INPUT',
          message: 'Invalid input data',
          details: error.details,
        });
      }

      if (error instanceof DuplicateQuestionError) {
        throw new ConflictException({
          error: 'DUPLICATE_QUESTION',
          message: error.message,
        });
      }

      if (error instanceof AssessmentNotFoundError) {
        throw new NotFoundException({
          error: 'ASSESSMENT_NOT_FOUND',
          message: 'Assessment not found',
        });
      }

      if (error instanceof ArgumentNotFoundError) {
        throw new NotFoundException({
          error: 'ARGUMENT_NOT_FOUND',
          message: 'Argument not found',
        });
      }

      if (error instanceof QuestionTypeMismatchError) {
        throw new BadRequestException({
          error: 'QUESTION_TYPE_MISMATCH',
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

    const { question } = result.value as any;
    return {
      success: true,
      question,
    };
  }
}