// src/domain/assessment/application/use-cases/list-pending-reviews.use-case.ts

import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';
import { IAttemptAnswerRepository } from '../repositories/i-attempt-answer-repository';
import { IAttemptRepository } from '../repositories/i-attempt.repository';
import { IAssessmentRepository } from '../repositories/i-assessment-repository';
import { IQuestionRepository } from '../repositories/i-question-repository';
import { IUserAggregatedViewRepository } from '@/domain/auth/application/repositories/i-user-aggregated-view-repository';
import { ListPendingReviewsRequest } from '../dtos/list-pending-reviews-request.dto';
import { ListPendingReviewsResponse, PendingReviewAttempt } from '../dtos/list-pending-reviews-response.dto';
import { listPendingReviewsSchema } from './validations/list-pending-reviews.schema';
import { InvalidInputError } from './errors/invalid-input-error';
import { UserNotFoundError } from './errors/user-not-found-error';
import { InsufficientPermissionsError } from './errors/insufficient-permissions-error';
import { RepositoryError } from './errors/repository-error';

type ListPendingReviewsUseCaseResponse = Either<
  | InvalidInputError
  | UserNotFoundError
  | InsufficientPermissionsError
  | RepositoryError,
  ListPendingReviewsResponse
>;

@Injectable()
export class ListPendingReviewsUseCase {
  constructor(
    @Inject('AttemptAnswerRepository')
    private attemptAnswerRepository: IAttemptAnswerRepository,
    @Inject('AttemptRepository')
    private attemptRepository: IAttemptRepository,
    @Inject('AssessmentRepository')
    private assessmentRepository: IAssessmentRepository,
    @Inject('QuestionRepository')
    private questionRepository: IQuestionRepository,
    @Inject('UserAggregatedViewRepository')
    private userAggregatedViewRepository: IUserAggregatedViewRepository,
  ) {}

  async execute(request: ListPendingReviewsRequest): Promise<ListPendingReviewsUseCaseResponse> {
    // Validate input
    const validation = listPendingReviewsSchema.safeParse(request);
    if (!validation.success) {
      return left(new InvalidInputError(validation.error.message));
    }

    const { requesterId, page, pageSize } = validation.data;

    try {
      // Verify requester exists and has permission (only tutors and admins can review)
      const requesterResult = await this.userAggregatedViewRepository.findByIdentityId(requesterId);
      if (requesterResult.isLeft()) {
        return left(new UserNotFoundError());
      }

      const requester = requesterResult.value;
      if (requester && requester.role !== 'tutor' && requester.role !== 'admin') {
        return left(new InsufficientPermissionsError());
      }

      // Get pending answers (SUBMITTED status)
      const pendingAnswersResult = await this.attemptAnswerRepository.findPendingReviewsByStatus('SUBMITTED');
      if (pendingAnswersResult.isLeft()) {
        return left(new RepositoryError('Failed to fetch pending answers'));
      }

      const pendingAnswers = pendingAnswersResult.value;

      // Group answers by attempt ID
      const attemptGroupedAnswers = new Map<string, typeof pendingAnswers>();
      for (const answer of pendingAnswers) {
        const attemptId = answer.attemptId;
        if (!attemptGroupedAnswers.has(attemptId)) {
          attemptGroupedAnswers.set(attemptId, []);
        }
        attemptGroupedAnswers.get(attemptId)!.push(answer);
      }

      // Build response with attempt, assessment and student info
      const pendingReviewAttempts: PendingReviewAttempt[] = [];

      for (const [attemptId, answers] of attemptGroupedAnswers) {
        // Get attempt info
        const attemptResult = await this.attemptRepository.findById(attemptId);
        if (attemptResult.isLeft()) {
          continue; // Skip attempts that can't be found
        }
        const attempt = attemptResult.value;

        // Only include SUBMITTED attempts (not IN_PROGRESS or GRADED)
        if (!attempt.isSubmitted()) {
          continue;
        }

        // Get assessment info
        const assessmentResult = await this.assessmentRepository.findById(attempt.assessmentId);
        if (assessmentResult.isLeft()) {
          continue; // Skip attempts with missing assessments
        }
        const assessment = assessmentResult.value;

        // Only include PROVA_ABERTA assessments
        if (assessment.type !== 'PROVA_ABERTA') {
          continue;
        }

        // Get student info
        const studentResult = await this.userAggregatedViewRepository.findByIdentityId(attempt.identityId);
        if (studentResult.isLeft()) {
          continue; // Skip attempts with missing students
        }
        const student = studentResult.value;

        // Count total open questions for this assessment
        const questionsResult = await this.questionRepository.findByAssessmentId(assessment.id.toString());
        if (questionsResult.isLeft()) {
          continue; // Skip if can't get questions
        }
        const questions = questionsResult.value;
        const totalOpenQuestions = questions.filter(q => q.type.isOpen()).length;

        pendingReviewAttempts.push({
          id: attempt.id.toString(),
          status: attempt.status.getValue() as 'SUBMITTED' | 'GRADING',
          submittedAt: attempt.submittedAt!,
          assessment: {
            id: assessment.id.toString(),
            title: assessment.title,
            type: 'PROVA_ABERTA',
          },
          student: student ? {
            id: student.identityId,
            name: student.fullName,
            email: student.email,
          } : undefined,
          pendingAnswers: answers.length,
          totalOpenQuestions,
          createdAt: attempt.createdAt,
          updatedAt: attempt.updatedAt,
        });
      }

      // Sort by submittedAt (oldest first for review priority)
      pendingReviewAttempts.sort((a, b) => a.submittedAt.getTime() - b.submittedAt.getTime());

      // Apply pagination
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedAttempts = pendingReviewAttempts.slice(startIndex, endIndex);

      // Calculate pagination info
      const total = pendingReviewAttempts.length;
      const totalPages = Math.ceil(total / pageSize);

      return right({
        attempts: paginatedAttempts,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
        },
      });
    } catch (error) {
      return left(new RepositoryError('An unexpected error occurred'));
    }
  }
}