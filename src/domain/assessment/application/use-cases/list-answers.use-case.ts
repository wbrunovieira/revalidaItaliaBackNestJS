// src/domain/assessment/application/use-cases/list-answers.use-case.ts

import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { IAnswerRepository } from '../repositories/i-answer.repository';
import { IQuestionRepository } from '../repositories/i-question-repository';
import { ListAnswersRequest } from '../dtos/list-answers-request.dto';
import { ListAnswersResponse } from '../dtos/list-answers-response.dto';
import { listAnswersSchema } from './validations/list-answers.schema';
import { InvalidInputError } from './errors/invalid-input-error';
import { QuestionNotFoundError } from './errors/question-not-found-error';
import { RepositoryError } from './errors/repository-error';

type ListAnswersUseCaseResponse = Either<
  InvalidInputError | QuestionNotFoundError | RepositoryError,
  ListAnswersResponse
>;

@Injectable()
export class ListAnswersUseCase {
  constructor(
    private answerRepository: IAnswerRepository,
    private questionRepository: IQuestionRepository,
  ) {}

  async execute(
    request: ListAnswersRequest,
  ): Promise<ListAnswersUseCaseResponse> {
    // Validate input
    const validation = listAnswersSchema.safeParse(request);
    if (!validation.success) {
      return left(new InvalidInputError(validation.error.message));
    }

    const { page, limit, questionId } = validation.data;

    try {
      // If questionId is provided, verify it exists
      if (questionId) {
        const questionResult =
          await this.questionRepository.findById(questionId);
        if (questionResult.isLeft()) {
          return left(new QuestionNotFoundError());
        }
      }

      // Calculate offset for pagination
      const offset = (page - 1) * limit;

      // Get paginated answers
      const answersResult = await this.answerRepository.findAllPaginated(
        limit,
        offset,
        questionId,
      );

      if (answersResult.isLeft()) {
        return left(new RepositoryError('Failed to fetch answers'));
      }

      const { answers, total } = answersResult.value;

      // Calculate pagination metadata
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrevious = page > 1;

      return right({
        answers: answers.map((answer) => answer.toResponseObject()),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext,
          hasPrevious,
        },
      });
    } catch (error) {
      return left(new RepositoryError('An unexpected error occurred'));
    }
  }
}
