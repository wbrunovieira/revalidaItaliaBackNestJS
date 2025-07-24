// src/domain/assessment/application/use-cases/submit-answer.use-case.ts

import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';
import { IAttemptRepository } from '../repositories/i-attempt.repository';
import { IQuestionRepository } from '../repositories/i-question-repository';
import { IAttemptAnswerRepository } from '../repositories/i-attempt-answer-repository';
import { SubmitAnswerRequest } from '../dtos/submit-answer-request.dto';
import { SubmitAnswerResponse } from '../dtos/submit-answer-response.dto';
import { AttemptAnswer } from '../../enterprise/entities/attempt-answer.entity';
import { AttemptStatusVO } from '../../enterprise/value-objects/attempt-status.vo';
import { submitAnswerSchema } from './validations/submit-answer.schema';
import { InvalidInputError } from './errors/invalid-input-error';
import { AttemptNotFoundError } from './errors/attempt-not-found-error';
import { AttemptNotActiveError } from './errors/attempt-not-active-error';
import { QuestionNotFoundError } from './errors/question-not-found-error';
import { InvalidAnswerTypeError } from './errors/invalid-answer-type-error';
import { RepositoryError } from './errors/repository-error';

type SubmitAnswerUseCaseResponse = Either<
  | InvalidInputError
  | AttemptNotFoundError
  | AttemptNotActiveError
  | QuestionNotFoundError
  | InvalidAnswerTypeError
  | RepositoryError,
  SubmitAnswerResponse
>;

@Injectable()
export class SubmitAnswerUseCase {
  constructor(
    @Inject('AttemptRepository')
    private attemptRepository: IAttemptRepository,
    @Inject('QuestionRepository')
    private questionRepository: IQuestionRepository,
    @Inject('AttemptAnswerRepository')
    private attemptAnswerRepository: IAttemptAnswerRepository,
  ) {}

  async execute(
    request: SubmitAnswerRequest,
  ): Promise<SubmitAnswerUseCaseResponse> {
    // Validate input
    const validation = submitAnswerSchema.safeParse(request);
    if (!validation.success) {
      return left(new InvalidInputError(validation.error.message));
    }

    const { attemptId, questionId, selectedOptionId, textAnswer } =
      validation.data;

    try {
      // Verify attempt exists and is active
      const attemptResult = await this.attemptRepository.findById(attemptId);
      if (attemptResult.isLeft()) {
        return left(new AttemptNotFoundError());
      }

      const attempt = attemptResult.value;
      if (!attempt.status.isInProgress()) {
        return left(new AttemptNotActiveError());
      }

      // Verify question exists
      const questionResult = await this.questionRepository.findById(questionId);
      if (questionResult.isLeft()) {
        return left(new QuestionNotFoundError());
      }

      const question = questionResult.value;

      // Validate answer type matches question type
      const isMultipleChoice = selectedOptionId !== undefined;
      const isOpenAnswer = textAnswer !== undefined;

      if (question.type.isMultipleChoice() && !isMultipleChoice) {
        return left(
          new InvalidAnswerTypeError(
            'Multiple choice questions require selectedOptionId',
          ),
        );
      }

      if (question.type.isOpen() && !isOpenAnswer) {
        return left(
          new InvalidAnswerTypeError('Open questions require textAnswer'),
        );
      }

      // Check if answer already exists for this attempt and question
      const existingAnswerResult =
        await this.attemptAnswerRepository.findByAttemptIdAndQuestionId(
          attemptId,
          questionId,
        );

      let attemptAnswer: AttemptAnswer;

      if (existingAnswerResult.isRight()) {
        // Update existing answer
        attemptAnswer = existingAnswerResult.value;

        // For PROVA_ABERTA: prevent updating answers that are approved (isCorrect=true)
        if (question.type.isOpen() && attemptAnswer.isCorrect === true) {
          return left(
            new InvalidAnswerTypeError(
              'Cannot modify approved answers in open assessments',
            ),
          );
        }

        // For PROVA_ABERTA: prevent updating if not rejected by teacher
        if (
          question.type.isOpen() &&
          attemptAnswer.status.isGraded() &&
          attemptAnswer.isCorrect !== false
        ) {
          return left(
            new InvalidAnswerTypeError(
              'Can only resubmit answers that were rejected by teacher',
            ),
          );
        }

        if (isMultipleChoice) {
          attemptAnswer.selectOption(selectedOptionId);
        } else {
          attemptAnswer.answerText(textAnswer!);
        }

        const updateResult =
          await this.attemptAnswerRepository.update(attemptAnswer);
        if (updateResult.isLeft()) {
          return left(new RepositoryError('Failed to update answer'));
        }
      } else {
        // For PROVA_ABERTA: Check if any previous answer exists and was approved
        if (question.type.isOpen()) {
          const allAnswersResult =
            await this.attemptAnswerRepository.findByAttemptId(attemptId);
          if (allAnswersResult.isRight()) {
            const existingApprovedAnswer = allAnswersResult.value.find(
              (answer) =>
                answer.questionId === questionId && answer.isCorrect === true,
            );
            if (existingApprovedAnswer) {
              return left(
                new InvalidAnswerTypeError(
                  'Cannot create new answer for approved question in open assessments',
                ),
              );
            }
          }
        }

        // Create new answer
        attemptAnswer = AttemptAnswer.create({
          selectedOptionId,
          textAnswer,
          status: new AttemptStatusVO('IN_PROGRESS'),
          attemptId,
          questionId,
        });

        const createResult =
          await this.attemptAnswerRepository.create(attemptAnswer);
        if (createResult.isLeft()) {
          return left(new RepositoryError('Failed to create answer'));
        }
      }

      return right({
        attemptAnswer: {
          id: attemptAnswer.id.toString(),
          selectedOptionId: attemptAnswer.selectedOptionId,
          textAnswer: attemptAnswer.textAnswer,
          status: attemptAnswer.status.getValue() as
            | 'IN_PROGRESS'
            | 'SUBMITTED'
            | 'GRADING'
            | 'GRADED',
          isCorrect: attemptAnswer.isCorrect,
          attemptId: attemptAnswer.attemptId,
          questionId: attemptAnswer.questionId,
          createdAt: attemptAnswer.createdAt,
          updatedAt: attemptAnswer.updatedAt,
        },
      });
    } catch (error) {
      return left(new RepositoryError('An unexpected error occurred'));
    }
  }
}
