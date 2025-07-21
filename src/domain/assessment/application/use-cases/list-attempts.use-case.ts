// src/domain/assessment/application/use-cases/list-attempts.use-case.ts

import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';
import { IAttemptRepository } from '../repositories/i-attempt.repository';
import { IAssessmentRepository } from '../repositories/i-assessment-repository';
import { IAccountRepository } from '@/domain/auth/application/repositories/i-account-repository';
import { ListAttemptsRequest } from '../dtos/list-attempts-request.dto';
import { ListAttemptsResponse, AttemptSummary } from '../dtos/list-attempts-response.dto';
import { listAttemptsSchema } from './validations/list-attempts.schema';
import { InvalidInputError } from './errors/invalid-input-error';
import { UserNotFoundError } from './errors/user-not-found-error';
import { InsufficientPermissionsError } from './errors/insufficient-permissions-error';
import { RepositoryError } from './errors/repository-error';

type ListAttemptsUseCaseResponse = Either<
  | InvalidInputError
  | UserNotFoundError
  | InsufficientPermissionsError
  | RepositoryError,
  ListAttemptsResponse
>;

@Injectable()
export class ListAttemptsUseCase {
  constructor(
    @Inject('AttemptRepository')
    private attemptRepository: IAttemptRepository,
    @Inject('AssessmentRepository')
    private assessmentRepository: IAssessmentRepository,
    @Inject('AccountRepository')
    private accountRepository: IAccountRepository,
  ) {}

  async execute(request: ListAttemptsRequest): Promise<ListAttemptsUseCaseResponse> {
    // Validate input
    const validation = listAttemptsSchema.safeParse(request);
    if (!validation.success) {
      return left(new InvalidInputError(validation.error.message));
    }

    const { status, identityId, assessmentId, page, pageSize, requesterId } = validation.data;

    try {
      // Verify requester exists and has permission
      const requesterResult = await this.accountRepository.findById(requesterId);
      if (requesterResult.isLeft()) {
        return left(new UserNotFoundError());
      }

      const requester = requesterResult.value;

      // Check permissions: students can only view own attempts, tutors/admins can view any
      if (requester.role === 'student') {
        if (identityId && identityId !== requesterId) {
          return left(new InsufficientPermissionsError());
        }
        // Force filter by student's own identityId if not provided
        if (!identityId) {
          request.identityId = requesterId;
        }
      }

      // Build filters
      const filters = {
        status,
        identityId: request.identityId || identityId,
        assessmentId,
      };

      // Apply pagination
      const pagination = {
        page: page || 1,
        pageSize: pageSize || 20,
      };

      // Get attempts with filters
      const attemptsResult = await this.attemptRepository.findWithFilters(filters, pagination);
      if (attemptsResult.isLeft()) {
        return left(new RepositoryError('Failed to fetch attempts'));
      }

      const attempts = attemptsResult.value;

      // Build response with assessment and student info
      const attemptSummaries: AttemptSummary[] = [];
      
      for (const attempt of attempts) {
        // Get assessment info
        const assessmentResult = await this.assessmentRepository.findById(attempt.assessmentId);
        if (assessmentResult.isLeft()) {
          continue; // Skip attempts with missing assessments
        }
        const assessment = assessmentResult.value;

        // Get student info
        const studentResult = await this.accountRepository.findById(attempt.identityId);
        if (studentResult.isLeft()) {
          continue; // Skip attempts with missing students
        }
        const student = studentResult.value;

        // TODO: Calculate pending answers for PROVA_ABERTA
        const pendingAnswers = assessment.type === 'PROVA_ABERTA' ? 0 : undefined;

        attemptSummaries.push({
          id: attempt.id.toString(),
          status: attempt.status.getValue() as 'IN_PROGRESS' | 'SUBMITTED' | 'GRADING' | 'GRADED',
          score: attempt.score?.getValue(),
          startedAt: attempt.startedAt,
          submittedAt: attempt.submittedAt,
          gradedAt: attempt.gradedAt,
          timeLimitExpiresAt: attempt.timeLimitExpiresAt,
          identityId: attempt.identityId,
          assessmentId: attempt.assessmentId,
          assessment: {
            id: assessment.id.toString(),
            title: assessment.title,
            type: assessment.type as 'QUIZ' | 'SIMULADO' | 'PROVA_ABERTA',
            passingScore: assessment.passingScore,
          },
          student: {
            id: student.id.toString(),
            name: student.name,
            email: student.email,
          },
          pendingAnswers,
          createdAt: attempt.createdAt,
          updatedAt: attempt.updatedAt,
        });
      }

      // Calculate pagination info (simplified - would need count from repository)
      const totalPages = Math.ceil(attemptSummaries.length / pagination.pageSize);

      return right({
        attempts: attemptSummaries,
        pagination: {
          page: pagination.page,
          pageSize: pagination.pageSize,
          total: attemptSummaries.length, // Simplified - should be total count
          totalPages,
        },
      });
    } catch (error) {
      return left(new RepositoryError('An unexpected error occurred'));
    }
  }
}