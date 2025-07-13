// src/domain/assessment/application/use-cases/get-attempt-results.use-case.ts

import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { IAttemptRepository } from '../repositories/i-attempt.repository';
import { IAttemptAnswerRepository } from '../repositories/i-attempt-answer-repository';

import { IQuestionRepository } from '../repositories/i-question-repository';
import { IArgumentRepository } from '../repositories/i-argument-repository';
import { IAnswerRepository } from '../repositories/i-answer.repository';
import { IAccountRepository } from '@/domain/auth/application/repositories/i-account-repository';
import { GetAttemptResultsRequest } from '../dtos/get-attempt-results-request.dto';
import {
  GetAttemptResultsResponse,
  ArgumentResult,
  AttemptAnswerResult,
} from '../dtos/get-attempt-results-response.dto';
import { getAttemptResultsSchema } from './validations/get-attempt-results.schema';
import { InvalidInputError } from './errors/invalid-input-error';
import { AttemptNotFoundError } from './errors/attempt-not-found-error';
import { AttemptNotFinalizedError } from './errors/attempt-not-finalized-error';
import { UserNotFoundError } from './errors/user-not-found-error';
import { InsufficientPermissionsError } from './errors/insufficient-permissions-error';
import { AssessmentNotFoundError } from './errors/assessment-not-found-error';
import { RepositoryError } from './errors/repository-error';
import { Assessment } from '../../enterprise/entities/assessment.entity';
import { Attempt } from '../../enterprise/entities/attempt.entity';
import { AttemptAnswer } from '../../enterprise/entities/attempt-answer.entity';
import { Question } from '../../enterprise/entities/question.entity';
import { Answer } from '../../enterprise/entities/answer.entity';
import { Argument } from '../../enterprise/entities/argument.entity';
import { IAssessmentRepository } from '../repositories/i-assessment-repository';

type GetAttemptResultsUseCaseResponse = Either<
  | InvalidInputError
  | AttemptNotFoundError
  | AttemptNotFinalizedError
  | UserNotFoundError
  | InsufficientPermissionsError
  | AssessmentNotFoundError
  | RepositoryError,
  GetAttemptResultsResponse
>;

@Injectable()
export class GetAttemptResultsUseCase {
  constructor(
    private attemptRepository: IAttemptRepository,
    private attemptAnswerRepository: IAttemptAnswerRepository,
    private assessmentRepository: IAssessmentRepository,
    private questionRepository: IQuestionRepository,
    private argumentRepository: IArgumentRepository,
    private answerRepository: IAnswerRepository,
    private accountRepository: IAccountRepository,
  ) {}

  async execute(
    request: GetAttemptResultsRequest,
  ): Promise<GetAttemptResultsUseCaseResponse> {
    // Validate input
    const validation = getAttemptResultsSchema.safeParse(request);
    if (!validation.success) {
      return left(new InvalidInputError(validation.error.message));
    }

    const { attemptId, requesterId } = validation.data;

    try {
      // Get attempt
      const attemptResult = await this.attemptRepository.findById(attemptId);
      if (attemptResult.isLeft()) {
        return left(new AttemptNotFoundError());
      }

      const attempt = attemptResult.value;

      // Verify attempt is finalized (not in progress)
      if (attempt.isInProgress()) {
        return left(new AttemptNotFinalizedError());
      }

      // Verify requester exists and has permission
      const requesterResult =
        await this.accountRepository.findById(requesterId);
      if (requesterResult.isLeft()) {
        return left(new UserNotFoundError());
      }

      const requester = requesterResult.value;

      // Check permissions: student can only view own attempts, tutors/admins can view any
      if (requester.role === 'student' && attempt.userId !== requesterId) {
        return left(new InsufficientPermissionsError());
      }

      // Get assessment
      const assessmentResult = await this.assessmentRepository.findById(
        attempt.assessmentId,
      );
      if (assessmentResult.isLeft()) {
        return left(new AssessmentNotFoundError());
      }

      const assessment = assessmentResult.value;

      // Get attempt answers
      const attemptAnswersResult =
        await this.attemptAnswerRepository.findByAttemptId(attemptId);
      if (attemptAnswersResult.isLeft()) {
        return left(new RepositoryError('Failed to fetch attempt answers'));
      }

      const attemptAnswers = attemptAnswersResult.value;

      // Get questions for this assessment
      const questionsResult = await this.questionRepository.findByAssessmentId(
        assessment.id.toString(),
      );
      if (questionsResult.isLeft()) {
        return left(new RepositoryError('Failed to fetch questions'));
      }

      const questions = questionsResult.value;

      // Get correct answers for multiple choice questions
      const questionIds = questions.map((q) => q.id.toString());
      const correctAnswersResult =
        await this.answerRepository.findManyByQuestionIds(questionIds);
      if (correctAnswersResult.isLeft()) {
        return left(new RepositoryError('Failed to fetch correct answers'));
      }

      const correctAnswers = correctAnswersResult.value;

      // Get arguments if assessment is SIMULADO
      let argumentsMap = new Map<string, Argument>();
      if (assessment.type === 'SIMULADO') {
        const argumentsResult =
          await this.argumentRepository.findByAssessmentId(
            assessment.id.toString(),
          );
        if (argumentsResult.isRight()) {
          const argumentsList = argumentsResult.value;
          argumentsList.forEach((arg) => argumentsMap.set(arg.id.toString(), arg));
        }
      }

      // Process results based on assessment type
      const results = this.calculateResults(
        assessment,
        attempt,
        attemptAnswers,
        questions,
        correctAnswers,
        argumentsMap,
      );

      // Build detailed answers
      const answerDetails = await this.buildAnswerDetails(
        attemptAnswers,
        questions,
        correctAnswers,
        argumentsMap,
      );

      return right({
        attempt: {
          id: attempt.id.toString(),
          status: attempt.status.getValue() as
            | 'SUBMITTED'
            | 'GRADING'
            | 'GRADED',
          score: attempt.score?.getValue(),
          startedAt: attempt.startedAt,
          submittedAt: attempt.submittedAt,
          gradedAt: attempt.gradedAt,
          timeLimitExpiresAt: attempt.timeLimitExpiresAt,
          userId: attempt.userId,
          assessmentId: attempt.assessmentId,
        },
        assessment: {
          id: assessment.id.toString(),
          title: assessment.title,
          type: assessment.type as
            | 'QUIZ'
            | 'SIMULADO'
            | 'PROVA_ABERTA',
          passingScore: assessment.passingScore,
          timeLimitInMinutes: assessment.timeLimitInMinutes,
        },
        results,
        answers: answerDetails,
      });
    } catch (error) {
      return left(new RepositoryError('An unexpected error occurred'));
    }
  }

  private calculateResults(
    assessment: Assessment,
    attempt: Attempt,
    attemptAnswers: AttemptAnswer[],
    questions: Question[],
    correctAnswers: Answer[],
    argumentsMap: Map<string, Argument>,
  ) {
    const assessmentType = assessment.type;
    const totalQuestions = questions.length;
    const answeredQuestions = attemptAnswers.filter((answer) =>
      answer.hasAnswer(),
    ).length;

    let correctAnswersCount = 0;
    let reviewedQuestions = 0;
    let pendingReview = 0;

    // Calculate time spent
    const timeSpent =
      attempt.submittedAt && attempt.startedAt
        ? Math.round(
            (attempt.submittedAt.getTime() - attempt.startedAt.getTime()) /
              (1000 * 60),
          )
        : undefined;

    // Process answers to calculate metrics
    attemptAnswers.forEach((attemptAnswer) => {
      if (attemptAnswer.isGraded()) {
        reviewedQuestions++;
        if (attemptAnswer.isCorrect) {
          correctAnswersCount++;
        }
      } else if (attemptAnswer.isSubmitted()) {
        // For multiple choice, we can auto-check correctness
        const question = questions.find(
          (q) => q.id.toString() === attemptAnswer.questionId,
        );
        if (
          question?.type.isMultipleChoice() &&
          attemptAnswer.selectedOptionId
        ) {
          const correctAnswer = correctAnswers.find(
            (a) => a.questionId.toString() === question.id.toString(),
          );
          if (
            correctAnswer &&
            attemptAnswer.selectedOptionId === correctAnswer.id.toString()
          ) {
            correctAnswersCount++;
          }
          reviewedQuestions++;
        } else if (question?.type.isOpen()) {
          pendingReview++;
        }
      }
    });

    const baseResults = {
      totalQuestions,
      answeredQuestions,
      timeSpent,
    };

    // For PROVA_ABERTA, don't calculate final score until all questions are reviewed
    if (assessmentType === 'PROVA_ABERTA') {
      return {
        ...baseResults,
        reviewedQuestions,
        pendingReview,
        correctAnswers: pendingReview === 0 ? correctAnswersCount : undefined,
        scorePercentage:
          pendingReview === 0
            ? Math.round((correctAnswersCount / totalQuestions) * 100)
            : undefined,
        passed:
          pendingReview === 0
            ? (correctAnswersCount / totalQuestions) * 100 >=
              assessment.passingScore
            : undefined,
      };
    }

    // For QUIZ and SIMULADO, calculate score
    const scorePercentage =
      totalQuestions > 0
        ? Math.round((correctAnswersCount / totalQuestions) * 100)
        : 0;
    const passed = scorePercentage >= assessment.passingScore;

    const results = {
      ...baseResults,
      correctAnswers: correctAnswersCount,
      scorePercentage,
      passed,
    };

    // For SIMULADO, add argument results
    if (assessmentType === 'SIMULADO' && argumentsMap.size > 0) {
      const argumentResults = this.calculateArgumentResults(
        attemptAnswers,
        questions,
        correctAnswers,
        argumentsMap,
      );

      return {
        ...results,
        argumentResults,
      };
    }

    return results;
  }

  private calculateArgumentResults(
    attemptAnswers: AttemptAnswer[],
    questions: Question[],
    correctAnswers: Answer[],
    argumentsMap: Map<string, Argument>,
  ): ArgumentResult[] {
    const argumentResults = new Map<
      string,
      {
        argumentId: string;
        argumentTitle: string;
        totalQuestions: number;
        correctAnswers: number;
      }
    >();

    // Initialize argument results
    argumentsMap.forEach((argument, argumentId) => {
      argumentResults.set(argumentId, {
        argumentId,
        argumentTitle: argument.title,
        totalQuestions: 0,
        correctAnswers: 0,
      });
    });

    // Count questions and correct answers per argument
    questions.forEach((question) => {
      const argumentId = question.argumentId?.toString();
      if (argumentId && argumentResults.has(argumentId)) {
        const result = argumentResults.get(argumentId)!;
        result.totalQuestions++;

        // Check if this question was answered correctly
        const attemptAnswer = attemptAnswers.find(
          (a) => a.questionId === question.id.toString(),
        );
        if (attemptAnswer) {
          if (attemptAnswer.isGraded() && attemptAnswer.isCorrect) {
            result.correctAnswers++;
          } else if (
            question.type.isMultipleChoice() &&
            attemptAnswer.selectedOptionId
          ) {
            const correctAnswer = correctAnswers.find(
              (a) => a.questionId.toString() === question.id.toString(),
            );
            if (
              correctAnswer &&
              attemptAnswer.selectedOptionId === correctAnswer.id.toString()
            ) {
              result.correctAnswers++;
            }
          }
        }
      }
    });

    // Convert to final format with score percentage
    return Array.from(argumentResults.values()).map((result) => ({
      ...result,
      scorePercentage:
        result.totalQuestions > 0
          ? Math.round((result.correctAnswers / result.totalQuestions) * 100)
          : 0,
    }));
  }

  private async buildAnswerDetails(
    attemptAnswers: AttemptAnswer[],
    questions: Question[],
    correctAnswers: Answer[],
    argumentsMap: Map<string, Argument>,
  ): Promise<AttemptAnswerResult[]> {
    return attemptAnswers.map((attemptAnswer) => {
      const question = questions.find(
        (q) => q.id.toString() === attemptAnswer.questionId,
      );
      const correctAnswer = correctAnswers.find(
        (a) => a.questionId.toString() === attemptAnswer.questionId,
      );

      const baseResult: AttemptAnswerResult = {
        questionId: attemptAnswer.questionId,
        questionText: question?.text || '',
        questionType: question?.type.isMultipleChoice()
          ? 'MULTIPLE_CHOICE'
          : 'OPEN',
        isCorrect: attemptAnswer.isCorrect,
        status: attemptAnswer.status.getValue() as
          | 'IN_PROGRESS'
          | 'SUBMITTED'
          | 'GRADING'
          | 'GRADED',
      };

      // Add argument info if applicable
      if (question?.argumentId) {
        const argument = argumentsMap.get(question.argumentId.toString());
        if (argument) {
          baseResult.argumentId = argument.id.toString();
          baseResult.argumentTitle = argument.title;
        }
      }

      // Add multiple choice specific data
      if (question?.type.isMultipleChoice() && attemptAnswer.selectedOptionId) {
        // In a real implementation, you'd need to fetch option texts
        // For now, we'll just include the IDs
        baseResult.selectedOptionId = attemptAnswer.selectedOptionId;
        baseResult.selectedOptionText = `Option ${attemptAnswer.selectedOptionId}`; // Placeholder

        if (correctAnswer) {
          baseResult.correctOptionId = correctAnswer.id.toString();
          baseResult.correctOptionText = `Option ${correctAnswer.id.toString()}`; // Placeholder
          baseResult.explanation = correctAnswer.explanation;
        }
      }

      // Add open answer specific data
      if (question?.type.isOpen()) {
        baseResult.textAnswer = attemptAnswer.textAnswer;
        baseResult.teacherComment = attemptAnswer.teacherComment;
        baseResult.submittedAt = attemptAnswer.createdAt;
        baseResult.reviewedAt = attemptAnswer.isGraded()
          ? attemptAnswer.updatedAt
          : undefined;
      }

      return baseResult;
    });
  }
}
