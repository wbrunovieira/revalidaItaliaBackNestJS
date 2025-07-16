// src/infra/controllers/attempt.controller.ts

import { StartAttemptDto } from '@/domain/assessment/application/dtos/start-attempt.dto';
import { SubmitAnswerDto } from '@/domain/assessment/application/dtos/submit-answer.dto';
import { SubmitAttemptParamDto } from '@/domain/assessment/application/dtos/submit-attempt-param.dto';
import { GetAttemptResultsParamDto } from './dtos/get-attempt-results-param.dto';
import { ReviewOpenAnswerParamDto } from './dtos/review-open-answer-param.dto';
import { ReviewOpenAnswerBodyDto } from './dtos/review-open-answer-body.dto';
import { StartAttemptUseCase } from '@/domain/assessment/application/use-cases/start-attempt.use-case';
import { SubmitAnswerUseCase } from '@/domain/assessment/application/use-cases/submit-answer.use-case';
import { SubmitAttemptUseCase } from '@/domain/assessment/application/use-cases/submit-attempt.use-case';
import { GetAttemptResultsUseCase } from '@/domain/assessment/application/use-cases/get-attempt-results.use-case';
import { ReviewOpenAnswerUseCase } from '@/domain/assessment/application/use-cases/review-open-answer.use-case';
import { InvalidInputError } from '@/domain/assessment/application/use-cases/errors/invalid-input-error';
import { UserNotFoundError } from '@/domain/assessment/application/use-cases/errors/user-not-found-error';
import { AssessmentNotFoundError } from '@/domain/assessment/application/use-cases/errors/assessment-not-found-error';
import { AttemptNotFoundError } from '@/domain/assessment/application/use-cases/errors/attempt-not-found-error';
import { AttemptNotActiveError } from '@/domain/assessment/application/use-cases/errors/attempt-not-active-error';
import { QuestionNotFoundError } from '@/domain/assessment/application/use-cases/errors/question-not-found-error';
import { InvalidAnswerTypeError } from '@/domain/assessment/application/use-cases/errors/invalid-answer-type-error';
import { NoAnswersFoundError } from '@/domain/assessment/application/use-cases/errors/no-answers-found-error';
import { AttemptExpiredError } from '@/domain/assessment/application/use-cases/errors/attempt-expired-error';
import { AttemptNotFinalizedError } from '@/domain/assessment/application/use-cases/errors/attempt-not-finalized-error';
import { InsufficientPermissionsError } from '@/domain/assessment/application/use-cases/errors/insufficient-permissions-error';
import { RepositoryError } from '@/domain/assessment/application/use-cases/errors/repository-error';
import { AttemptAnswerNotFoundError } from '@/domain/assessment/application/use-cases/errors/attempt-answer-not-found-error';
import { AnswerNotReviewableError } from '@/domain/assessment/application/use-cases/errors/answer-not-reviewable-error';
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Inject,
  BadRequestException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/infra/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/infra/auth/current-user-decorator';
import { UserPayload } from '@/infra/auth/strategies/jwt.strategy';

@Controller('attempts')
@UseGuards(JwtAuthGuard)
export class AttemptController {
  constructor(
    @Inject(StartAttemptUseCase)
    private readonly startAttemptUseCase: StartAttemptUseCase,
    @Inject(SubmitAnswerUseCase)
    private readonly submitAnswerUseCase: SubmitAnswerUseCase,
    @Inject(SubmitAttemptUseCase)
    private readonly submitAttemptUseCase: SubmitAttemptUseCase,
    @Inject(GetAttemptResultsUseCase)
    private readonly getAttemptResultsUseCase: GetAttemptResultsUseCase,
    @Inject(ReviewOpenAnswerUseCase)
    private readonly reviewOpenAnswerUseCase: ReviewOpenAnswerUseCase,
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

      // AttemptAlreadyActiveError is no longer thrown - existing attempts are returned instead

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

  @Get(':id/results')
  async getAttemptResults(
    @Param() params: GetAttemptResultsParamDto,
    @CurrentUser() user: UserPayload,
  ) {
    const request = {
      attemptId: params.id,
      requesterId: user.sub,
    };

    const result = await this.getAttemptResultsUseCase.execute(request);

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

      if (error instanceof AttemptNotFinalizedError) {
        throw new BadRequestException({
          error: 'ATTEMPT_NOT_FINALIZED',
          message: 'Attempt is not finalized yet',
        });
      }

      if (error instanceof UserNotFoundError) {
        throw new NotFoundException({
          error: 'USER_NOT_FOUND',
          message: 'User not found',
        });
      }

      if (error instanceof InsufficientPermissionsError) {
        throw new ForbiddenException({
          error: 'INSUFFICIENT_PERMISSIONS',
          message: 'Insufficient permissions to view this attempt',
        });
      }

      if (error instanceof AssessmentNotFoundError) {
        throw new NotFoundException({
          error: 'ASSESSMENT_NOT_FOUND',
          message: 'Assessment not found',
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

  @Post('answers/:id/review')
  async reviewAnswer(
    @Param() params: ReviewOpenAnswerParamDto,
    @Body() body: ReviewOpenAnswerBodyDto,
  ) {
    const request = {
      attemptAnswerId: params.id,
      reviewerId: body.reviewerId,
      isCorrect: body.isCorrect,
      teacherComment: body.teacherComment,
    };

    const result = await this.reviewOpenAnswerUseCase.execute(request);

    if (result.isLeft()) {
      const error = result.value;

      if (error instanceof InvalidInputError) {
        throw new BadRequestException({
          error: 'INVALID_INPUT',
          message: 'Invalid input data',
          details: error.details,
        });
      }

      if (error instanceof AttemptAnswerNotFoundError) {
        throw new NotFoundException({
          error: 'ATTEMPT_ANSWER_NOT_FOUND',
          message: 'Attempt answer not found',
        });
      }

      if (error instanceof UserNotFoundError) {
        throw new NotFoundException({
          error: 'USER_NOT_FOUND',
          message: 'User not found',
        });
      }

      if (error instanceof InsufficientPermissionsError) {
        throw new ForbiddenException({
          error: 'INSUFFICIENT_PERMISSIONS',
          message: 'Insufficient permissions to review this answer',
        });
      }

      if (error instanceof AnswerNotReviewableError) {
        throw new BadRequestException({
          error: 'ANSWER_NOT_REVIEWABLE',
          message: 'Answer is not reviewable',
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