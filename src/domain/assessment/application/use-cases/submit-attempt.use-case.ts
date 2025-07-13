// src/domain/assessment/application/use-cases/submit-attempt.use-case.ts

import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { IAttemptRepository } from '../repositories/i-attempt.repository';
import { IAttemptAnswerRepository } from '../repositories/i-attempt-answer-repository';
import { IAssessmentRepository } from '../repositories/i-assessment-repository';
import { IQuestionRepository } from '../repositories/i-question-repository';
import { IAnswerRepository } from '../repositories/i-answer.repository';
import { SubmitAttemptRequest } from '../dtos/submit-attempt-request.dto';
import { SubmitAttemptResponse } from '../dtos/submit-attempt-response.dto';
import { ScoreVO } from '../../enterprise/value-objects/score.vo';
import { AttemptStatusVO } from '../../enterprise/value-objects/attempt-status.vo';
import { submitAttemptSchema } from './validations/submit-attempt.schema';
import { InvalidInputError } from './errors/invalid-input-error';
import { AttemptNotFoundError } from './errors/attempt-not-found-error';
import { AttemptNotActiveError } from './errors/attempt-not-active-error';
import { AssessmentNotFoundError } from './errors/assessment-not-found-error';
import { NoAnswersFoundError } from './errors/no-answers-found-error';
import { AttemptExpiredError } from './errors/attempt-expired-error';
import { RepositoryError } from './errors/repository-error';

type SubmitAttemptUseCaseResponse = Either<
  | InvalidInputError
  | AttemptNotFoundError
  | AttemptNotActiveError
  | AssessmentNotFoundError
  | NoAnswersFoundError
  | AttemptExpiredError
  | RepositoryError,
  SubmitAttemptResponse
>;

@Injectable()
export class SubmitAttemptUseCase {
  constructor(
    private attemptRepository: IAttemptRepository,
    private attemptAnswerRepository: IAttemptAnswerRepository,
    private assessmentRepository: IAssessmentRepository,
    private questionRepository: IQuestionRepository,
    private answerRepository: IAnswerRepository,
  ) {}

  async execute(
    request: SubmitAttemptRequest,
  ): Promise<SubmitAttemptUseCaseResponse> {
    // Validate input
    const validation = submitAttemptSchema.safeParse(request);
    if (!validation.success) {
      return left(new InvalidInputError(validation.error.message));
    }

    const { attemptId } = validation.data;

    try {
      // Get attempt
      const attemptResult = await this.attemptRepository.findById(attemptId);
      if (attemptResult.isLeft()) {
        return left(new AttemptNotFoundError());
      }

      const attempt = attemptResult.value;

      // Verify attempt is in progress
      if (!attempt.isInProgress()) {
        return left(new AttemptNotActiveError());
      }

      // Check if attempt has expired (for time-limited assessments)
      if (attempt.hasTimeLimit() && attempt.isExpired()) {
        return left(new AttemptExpiredError());
      }

      // Get assessment to determine type
      const assessmentResult = await this.assessmentRepository.findById(
        attempt.assessmentId,
      );
      if (assessmentResult.isLeft()) {
        return left(new AssessmentNotFoundError());
      }

      const assessment = assessmentResult.value;

      // Get all answers for this attempt
      const answersResult =
        await this.attemptAnswerRepository.findByAttemptId(attemptId);
      if (answersResult.isLeft()) {
        return left(new RepositoryError('Failed to fetch attempt answers'));
      }

      const answers = answersResult.value;

      // Verify there are answers
      if (answers.length === 0) {
        return left(new NoAnswersFoundError());
      }

      // Get total questions for this assessment
      const questionsResult = await this.questionRepository.findByAssessmentId(
        attempt.assessmentId,
      );
      if (questionsResult.isLeft()) {
        return left(
          new RepositoryError('Failed to fetch assessment questions'),
        );
      }

      const questions = questionsResult.value;
      const totalQuestions = questions.length;
      const answeredQuestions = answers.length;

      // Calculate score for multiple choice questions
      let correctAnswers = 0;
      let hasOpenQuestions = false;

      // Get all question IDs from answers for batch lookup
      const questionIds = answers.map((answer) => answer.questionId);

      // Get correct answers for all questions at once
      const correctAnswersResult =
        await this.answerRepository.findManyByQuestionIds(questionIds);
      const correctAnswersMap = new Map<string, string | undefined>();

      if (correctAnswersResult.isRight()) {
        correctAnswersResult.value.forEach((correctAnswer) => {
          correctAnswersMap.set(
            correctAnswer.questionId.toString(),
            correctAnswer.correctOptionId?.toString(),
          );
        });
      }

      for (const attemptAnswer of answers) {
        // Get question to check its type
        const questionResult = await this.questionRepository.findById(
          attemptAnswer.questionId,
        );
        if (questionResult.isRight()) {
          const question = questionResult.value;

          if (question.type.isMultipleChoice()) {
            // For multiple choice, check if answer is correct
            if (attemptAnswer.selectedOptionId) {
              const correctOptionId = correctAnswersMap.get(
                attemptAnswer.questionId,
              );
              if (
                correctOptionId &&
                attemptAnswer.selectedOptionId === correctOptionId
              ) {
                correctAnswers++;
              }
            }
          } else {
            // Has open questions - cannot auto-grade
            hasOpenQuestions = true;
          }
        }
      }

      // Submit the attempt using domain method
      if (hasOpenQuestions) {
        // For assessments with open questions, just submit (teacher will grade later)
        attempt.submit();
      } else {
        // For pure multiple choice, calculate and set score immediately
        const scoreValue =
          totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
        const score = new ScoreVO(scoreValue);

        attempt.submit();
        attempt.grade(score);
      }

      // Update attempt in repository
      const updateResult = await this.attemptRepository.update(attempt);
      if (updateResult.isLeft()) {
        return left(new RepositoryError('Failed to update attempt'));
      }

      // Prepare response
      const scorePercentage = attempt.score?.getValue();

      return right({
        attempt: {
          id: attempt.id.toString(),
          status: attempt.status.getValue() as 'SUBMITTED' | 'GRADED',
          score: attempt.score?.getValue(),
          startedAt: attempt.startedAt,
          submittedAt: attempt.submittedAt!,
          gradedAt: attempt.gradedAt,
          timeLimitExpiresAt: attempt.timeLimitExpiresAt,
          userId: attempt.userId,
          assessmentId: attempt.assessmentId,
          createdAt: attempt.createdAt,
          updatedAt: attempt.updatedAt,
        },
        summary: {
          totalQuestions,
          answeredQuestions,
          correctAnswers: hasOpenQuestions ? undefined : correctAnswers,
          scorePercentage,
        },
      });
    } catch (error) {
      return left(new RepositoryError('An unexpected error occurred'));
    }
  }
}
