// src/domain/assessment/application/use-cases/start-attempt.use-case.ts

import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { Attempt } from '@/domain/assessment/enterprise/entities/attempt.entity';
import { AttemptStatusVO } from '@/domain/assessment/enterprise/value-objects/attempt-status.vo';
import { IAttemptRepository } from '../repositories/i-attempt.repository';
import { IAssessmentRepository } from '../repositories/i-assessment-repository';
import { IUserAggregatedViewRepository } from '@/domain/auth/application/repositories/i-user-aggregated-view-repository';
import { StartAttemptRequest } from '../dtos/start-attempt-request.dto';
import { StartAttemptResponse } from '../dtos/start-attempt-response.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { RepositoryError } from './errors/repository-error';
import { UserNotFoundError } from './errors/user-not-found-error';
import { AssessmentNotFoundError } from './errors/assessment-not-found-error';
import { AttemptAlreadyActiveError } from './errors/attempt-already-active-error';
import {
  StartAttemptSchema,
  startAttemptSchema,
} from './validations/start-attempt.schema';

type StartAttemptUseCaseResponse = Either<
  | InvalidInputError
  | UserNotFoundError
  | AssessmentNotFoundError
  | AttemptAlreadyActiveError
  | RepositoryError
  | Error,
  StartAttemptResponse
>;

@Injectable()
export class StartAttemptUseCase {
  constructor(
    @Inject('AttemptRepository')
    private readonly attemptRepository: IAttemptRepository,
    @Inject('AssessmentRepository')
    private readonly assessmentRepository: IAssessmentRepository,
    @Inject('UserAggregatedViewRepository')
    private readonly userAggregatedViewRepository: IUserAggregatedViewRepository,
  ) {}

  async execute(
    request: StartAttemptRequest,
  ): Promise<StartAttemptUseCaseResponse> {
    // 1. Validate input data
    const validationResult = startAttemptSchema.safeParse(request);
    if (!validationResult.success) {
      return left(new InvalidInputError(validationResult.error.message));
    }

    const validatedData: StartAttemptSchema = validationResult.data;

    // 2. Check if user exists
    let userResult;
    try {
      userResult = await this.userAggregatedViewRepository.findByIdentityId(
        validatedData.identityId,
      );
    } catch (error) {
      return left(new RepositoryError('Failed to fetch user'));
    }

    if (userResult.isLeft()) {
      const error = userResult.value;
      if (error.message === 'User not found') {
        return left(new UserNotFoundError());
      }
      return left(new RepositoryError('Failed to fetch user'));
    }

    const user = userResult.value;
    if (!user) {
      return left(new UserNotFoundError());
    }

    // 3. Check if assessment exists
    let assessmentResult;
    try {
      assessmentResult = await this.assessmentRepository.findById(
        validatedData.assessmentId,
      );
    } catch (error) {
      return left(new RepositoryError('Failed to fetch assessment'));
    }

    if (assessmentResult.isLeft()) {
      const error = assessmentResult.value;
      if (error.message === 'Assessment not found') {
        return left(new AssessmentNotFoundError());
      }
      return left(new RepositoryError('Failed to fetch assessment'));
    }

    const assessment = assessmentResult.value;

    // 4. Check if user already has an active attempt for this assessment
    const activeAttemptResult =
      await this.attemptRepository.findActiveByIdentityAndAssessment(
        validatedData.identityId,
        validatedData.assessmentId,
      );

    if (activeAttemptResult.isRight()) {
      // User already has an active attempt - return it instead of error
      const existingAttempt = activeAttemptResult.value;

      // Get total questions count
      const questionsResult = await this.assessmentRepository.findById(
        validatedData.assessmentId,
      );
      let totalQuestions: number | undefined;
      if (questionsResult.isRight()) {
        // This is a simplified count - in a real implementation you'd need to query questions
        totalQuestions = undefined; // Will be implemented when we have question repository access
      }

      // Get answered questions count
      // This would require access to attempt answers repository
      const answeredQuestions = undefined; // Will be implemented when we have attempt answer repository access

      const response: StartAttemptResponse = {
        attempt: {
          id: existingAttempt.id.toString(),
          status: existingAttempt.status.getValue() as any,
          startedAt: existingAttempt.startedAt,
          timeLimitExpiresAt: existingAttempt.timeLimitExpiresAt,
          identityId: existingAttempt.identityId,
          assessmentId: existingAttempt.assessmentId,
          createdAt: existingAttempt.createdAt,
          updatedAt: existingAttempt.updatedAt,
        },
        isNew: false,
        answeredQuestions,
        totalQuestions,
      };

      return right(response);
    }

    // 5. Create new attempt
    const now = new Date();
    const attemptStatus = new AttemptStatusVO('IN_PROGRESS');

    let timeLimitExpiresAt: Date | undefined = undefined;
    if (assessment.type === 'SIMULADO' && assessment.timeLimitInMinutes) {
      timeLimitExpiresAt = new Date(
        now.getTime() + assessment.timeLimitInMinutes * 60 * 1000,
      );
    }

    const attempt = Attempt.create({
      status: attemptStatus,
      startedAt: now,
      identityId: validatedData.identityId,
      assessmentId: validatedData.assessmentId,
      timeLimitExpiresAt,
    });

    // 6. Save attempt to repository
    const createResult = await this.attemptRepository.create(attempt);
    if (createResult.isLeft()) {
      return left(new RepositoryError('Failed to create attempt'));
    }

    // 7. Return response
    const response: StartAttemptResponse = {
      attempt: {
        id: attempt.id.toString(),
        status: attempt.status.getValue(),
        startedAt: attempt.startedAt,
        timeLimitExpiresAt: attempt.timeLimitExpiresAt,
        identityId: attempt.identityId,
        assessmentId: attempt.assessmentId,
        createdAt: attempt.createdAt,
        updatedAt: attempt.updatedAt,
      },
      isNew: true,
      answeredQuestions: 0,
      totalQuestions: undefined, // Will be implemented when we have question repository access
    };

    return right(response);
  }
}
