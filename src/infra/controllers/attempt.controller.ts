// src/infra/controllers/attempt.controller.ts

import { StartAttemptDto } from '@/domain/assessment/application/dtos/start-attempt.dto';
import { SubmitAnswerDto } from '@/domain/assessment/application/dtos/submit-answer.dto';
import { SubmitAttemptParamDto } from '@/domain/assessment/application/dtos/submit-attempt-param.dto';
import { StartAttemptUseCase } from '@/domain/assessment/application/use-cases/start-attempt.use-case';
import { SubmitAnswerUseCase } from '@/domain/assessment/application/use-cases/submit-answer.use-case';
import { SubmitAttemptUseCase } from '@/domain/assessment/application/use-cases/submit-attempt.use-case';
import { InvalidInputError } from '@/domain/assessment/application/use-cases/errors/invalid-input-error';
import { UserNotFoundError } from '@/domain/assessment/application/use-cases/errors/user-not-found-error';
import { AssessmentNotFoundError } from '@/domain/assessment/application/use-cases/errors/assessment-not-found-error';
import { AttemptAlreadyActiveError } from '@/domain/assessment/application/use-cases/errors/attempt-already-active-error';
import { AttemptNotFoundError } from '@/domain/assessment/application/use-cases/errors/attempt-not-found-error';
import { AttemptNotActiveError } from '@/domain/assessment/application/use-cases/errors/attempt-not-active-error';
import { QuestionNotFoundError } from '@/domain/assessment/application/use-cases/errors/question-not-found-error';
import { InvalidAnswerTypeError } from '@/domain/assessment/application/use-cases/errors/invalid-answer-type-error';
import { NoAnswersFoundError } from '@/domain/assessment/application/use-cases/errors/no-answers-found-error';
import { AttemptExpiredError } from '@/domain/assessment/application/use-cases/errors/attempt-expired-error';
import { RepositoryError } from '@/domain/assessment/application/use-cases/errors/repository-error';
import {
  Controller,
  Post,
  Body,
  Param,
  Inject,
  BadRequestException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';

@Controller('attempts')
export class AttemptController {
  constructor(
    @Inject(StartAttemptUseCase)
    private readonly startAttemptUseCase: StartAttemptUseCase,
    @Inject(SubmitAnswerUseCase)
    private readonly submitAnswerUseCase: SubmitAnswerUseCase,
    @Inject(SubmitAttemptUseCase)
    private readonly submitAttemptUseCase: SubmitAttemptUseCase,
  ) {}

  @Post('start')
  async startAttempt(@Body() dto: StartAttemptDto) {
    const request = {
      userId: dto.userId,
      assessmentId: dto.assessmentId,
    };

    const result = await this.startAttemptUseCase.execute(request);

    if (result.isLeft()) {
      const error = result.value;

      if (error instanceof InvalidInputError) {
        throw new BadRequestException({
          error: 'INVALID_INPUT',
          message: 'Invalid input data',
          details: error.details,
        });
      }

      if (error instanceof UserNotFoundError) {
        throw new NotFoundException({
          error: 'USER_NOT_FOUND',
          message: 'User not found',
        });
      }

      if (error instanceof AssessmentNotFoundError) {
        throw new NotFoundException({
          error: 'ASSESSMENT_NOT_FOUND',
          message: 'Assessment not found',
        });
      }

      if (error instanceof AttemptAlreadyActiveError) {
        throw new ConflictException({
          error: 'ATTEMPT_ALREADY_ACTIVE',
          message: 'User already has an active attempt for this assessment',
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

  @Post(':id/answers')
  async submitAnswer(@Param('id') attemptId: string, @Body() dto: SubmitAnswerDto) {
    const request = {
      attemptId,
      questionId: dto.questionId,
      selectedOptionId: dto.selectedOptionId,
      textAnswer: dto.textAnswer,
    };

    const result = await this.submitAnswerUseCase.execute(request);

    if (result.isLeft()) {
      const error = result.value;

      if (error instanceof InvalidInputError) {
        throw new BadRequestException({
          error: 'INVALID_INPUT',
          message: 'Invalid input data',
          details: error.details,
        });
      }

      if (error instanceof AttemptNotFoundError) {
        throw new NotFoundException({
          error: 'ATTEMPT_NOT_FOUND',
          message: 'Attempt not found',
        });
      }

      if (error instanceof AttemptNotActiveError) {
        throw new BadRequestException({
          error: 'ATTEMPT_NOT_ACTIVE',
          message: 'Attempt is not active',
        });
      }

      if (error instanceof QuestionNotFoundError) {
        throw new NotFoundException({
          error: 'QUESTION_NOT_FOUND',
          message: 'Question not found',
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

  @Post(':id/submit')
  async submitAttempt(@Param() params: SubmitAttemptParamDto) {
    const request = {
      attemptId: params.id,
    };

    const result = await this.submitAttemptUseCase.execute(request);

    if (result.isLeft()) {
      const error = result.value;

      if (error instanceof InvalidInputError) {
        throw new BadRequestException({
          error: 'INVALID_INPUT',
          message: 'Invalid input data',
          details: error.details,
        });
      }

      if (error instanceof AttemptNotFoundError) {
        throw new NotFoundException({
          error: 'ATTEMPT_NOT_FOUND',
          message: 'Attempt not found',
        });
      }

      if (error instanceof AttemptNotActiveError) {
        throw new BadRequestException({
          error: 'ATTEMPT_NOT_ACTIVE',
          message: 'Attempt is not active',
        });
      }

      if (error instanceof AssessmentNotFoundError) {
        throw new NotFoundException({
          error: 'ASSESSMENT_NOT_FOUND',
          message: 'Assessment not found',
        });
      }

      if (error instanceof NoAnswersFoundError) {
        throw new BadRequestException({
          error: 'NO_ANSWERS_FOUND',
          message: 'No answers found for this attempt',
        });
      }

      if (error instanceof AttemptExpiredError) {
        throw new BadRequestException({
          error: 'ATTEMPT_EXPIRED',
          message: 'Attempt has expired',
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