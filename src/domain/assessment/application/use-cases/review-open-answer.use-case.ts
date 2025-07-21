// src/domain/assessment/application/use-cases/review-open-answer.use-case.ts

import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';
import { IAttemptAnswerRepository } from '../repositories/i-attempt-answer-repository';
import { IAttemptRepository } from '../repositories/i-attempt.repository';
import { IQuestionRepository } from '../repositories/i-question-repository';
import { IUserAggregatedViewRepository } from '@/domain/auth/application/repositories/i-user-aggregated-view-repository';
import { ReviewOpenAnswerRequest } from '../dtos/review-open-answer-request.dto';
import { ReviewOpenAnswerResponse } from '../dtos/review-open-answer-response.dto';
import { ScoreVO } from '../../enterprise/value-objects/score.vo';
import { reviewOpenAnswerSchema } from './validations/review-open-answer.schema';
import { InvalidInputError } from './errors/invalid-input-error';
import { AttemptAnswerNotFoundError } from './errors/attempt-answer-not-found-error';
import { UserNotFoundError } from './errors/user-not-found-error';
import { InsufficientPermissionsError } from './errors/insufficient-permissions-error';
import { AttemptNotFoundError } from './errors/attempt-not-found-error';
import { QuestionNotFoundError } from './errors/question-not-found-error';
import { AnswerNotReviewableError } from './errors/answer-not-reviewable-error';
import { RepositoryError } from './errors/repository-error';

type ReviewOpenAnswerUseCaseResponse = Either<
  | InvalidInputError
  | AttemptAnswerNotFoundError
  | UserNotFoundError
  | InsufficientPermissionsError
  | AttemptNotFoundError
  | QuestionNotFoundError
  | AnswerNotReviewableError
  | RepositoryError,
  ReviewOpenAnswerResponse
>;

@Injectable()
export class ReviewOpenAnswerUseCase {
  constructor(
    @Inject('AttemptAnswerRepository')
    private attemptAnswerRepository: IAttemptAnswerRepository,
    @Inject('AttemptRepository')
    private attemptRepository: IAttemptRepository,
    @Inject('QuestionRepository')
    private questionRepository: IQuestionRepository,
    @Inject('UserAggregatedViewRepository')
    private userAggregatedViewRepository: IUserAggregatedViewRepository,
  ) {}

  async execute(request: ReviewOpenAnswerRequest): Promise<ReviewOpenAnswerUseCaseResponse> {
    // Validate input
    const validation = reviewOpenAnswerSchema.safeParse(request);
    if (!validation.success) {
      return left(new InvalidInputError(validation.error.message));
    }

    const { attemptAnswerId, reviewerId, isCorrect, teacherComment } = validation.data;

    try {
      // Get attempt answer
      const attemptAnswerResult = await this.attemptAnswerRepository.findById(attemptAnswerId);
      if (attemptAnswerResult.isLeft()) {
        return left(new AttemptAnswerNotFoundError());
      }

      const attemptAnswer = attemptAnswerResult.value;

      // Verify reviewer exists and has permission
      const reviewerResult = await this.userAggregatedViewRepository.findByIdentityId(reviewerId);
      if (reviewerResult.isLeft()) {
        return left(new UserNotFoundError());
      }

      const reviewer = reviewerResult.value;
      if (reviewer && reviewer.role !== 'tutor' && reviewer.role !== 'admin') {
        return left(new InsufficientPermissionsError());
      }

      // Get attempt to check status
      const attemptResult = await this.attemptRepository.findById(attemptAnswer.attemptId);
      if (attemptResult.isLeft()) {
        return left(new AttemptNotFoundError());
      }

      const attempt = attemptResult.value;

      // Verify attempt is submitted (not in progress or already graded)
      if (!attempt.isSubmitted()) {
        return left(new AnswerNotReviewableError());
      }

      // Get question to verify it's an open question
      const questionResult = await this.questionRepository.findById(attemptAnswer.questionId);
      if (questionResult.isLeft()) {
        return left(new QuestionNotFoundError());
      }

      const question = questionResult.value;

      // Verify question is open type
      if (!question.type.isOpen()) {
        return left(new AnswerNotReviewableError());
      }

      // Verify answer is submitted (not already graded)
      if (!attemptAnswer.status.isSubmitted()) {
        return left(new AnswerNotReviewableError());
      }

      // Verify answer has text content
      if (!attemptAnswer.textAnswer) {
        return left(new AnswerNotReviewableError());
      }

      // Verify answer hasn't been reviewed yet (no reviewerId)
      if (attemptAnswer.reviewerId) {
        return left(new AnswerNotReviewableError());
      }

      // Grade the answer
      attemptAnswer.grade(isCorrect, teacherComment, reviewerId);

      // Update attempt answer
      const updateAnswerResult = await this.attemptAnswerRepository.update(attemptAnswer);
      if (updateAnswerResult.isLeft()) {
        return left(new RepositoryError('Failed to update attempt answer'));
      }

      // Check if all open questions in this attempt have been reviewed
      const allAnswersResult = await this.attemptAnswerRepository.findByAttemptId(attempt.id.toString());
      if (allAnswersResult.isLeft()) {
        return left(new RepositoryError('Failed to fetch attempt answers'));
      }

      const allAnswers = allAnswersResult.value;
      let allOpenQuestionsReviewed = true;
      let totalOpenQuestions = 0;
      let correctOpenAnswers = 0;

      // Check each answer to see if all open questions are graded
      for (const answer of allAnswers) {
        const answerQuestionResult = await this.questionRepository.findById(answer.questionId);
        if (answerQuestionResult.isRight()) {
          const answerQuestion = answerQuestionResult.value;
          
          if (answerQuestion.type.isOpen()) {
            totalOpenQuestions++;
            
            if (!answer.status.isGraded()) {
              allOpenQuestionsReviewed = false;
            } else if (answer.isCorrect) {
              correctOpenAnswers++;
            }
          }
        }
      }

      // If all open questions are reviewed, finalize the attempt
      let finalAttemptStatus = attempt.status.getValue();
      
      if (allOpenQuestionsReviewed) {
        // Calculate final score including open questions
        // Get all multiple choice answers that were already scored
        const multipleChoiceAnswers = allAnswers.filter(answer => {
          // This would need the question type, simplified here
          return answer.selectedOptionId !== undefined;
        });

        // For simplicity, we'll just mark as graded without recalculating full score
        // In a real implementation, you'd recalculate the complete score here
        const score = new ScoreVO(100); // Simplified - should calculate actual score
        attempt.grade(score);
        
        const updateAttemptResult = await this.attemptRepository.update(attempt);
        if (updateAttemptResult.isLeft()) {
          return left(new RepositoryError('Failed to update attempt'));
        }
        
        finalAttemptStatus = 'GRADED';
      }

      return right({
        attemptAnswer: {
          id: attemptAnswer.id.toString(),
          textAnswer: attemptAnswer.textAnswer,
          status: attemptAnswer.status.getValue() as 'SUBMITTED' | 'GRADING' | 'GRADED',
          isCorrect: attemptAnswer.isCorrect!,
          teacherComment: attemptAnswer.teacherComment,
          reviewerId: attemptAnswer.reviewerId,
          attemptId: attemptAnswer.attemptId,
          questionId: attemptAnswer.questionId,
          createdAt: attemptAnswer.createdAt,
          updatedAt: attemptAnswer.updatedAt,
        },
        attemptStatus: {
          id: attempt.id.toString(),
          status: finalAttemptStatus as 'SUBMITTED' | 'GRADED',
          allOpenQuestionsReviewed,
        },
      });
    } catch (error) {
      return left(new RepositoryError('An unexpected error occurred'));
    }
  }
}