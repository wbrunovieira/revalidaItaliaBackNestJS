// src/infra/controllers/attempt.controller.ts

import { StartAttemptDto } from '@/domain/assessment/application/dtos/start-attempt.dto';
import { StartAttemptUseCase } from '@/domain/assessment/application/use-cases/start-attempt.use-case';
import { InvalidInputError } from '@/domain/assessment/application/use-cases/errors/invalid-input-error';
import { UserNotFoundError } from '@/domain/assessment/application/use-cases/errors/user-not-found-error';
import { AssessmentNotFoundError } from '@/domain/assessment/application/use-cases/errors/assessment-not-found-error';
import { AttemptAlreadyActiveError } from '@/domain/assessment/application/use-cases/errors/attempt-already-active-error';
import { RepositoryError } from '@/domain/assessment/application/use-cases/errors/repository-error';
import {
  Controller,
  Post,
  Body,
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
}