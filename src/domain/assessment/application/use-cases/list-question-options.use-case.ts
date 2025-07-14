// src/domain/assessment/application/use-cases/list-question-options.use-case.ts

import { Injectable, Inject } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { IQuestionOptionRepository } from '../repositories/i-question-option-repository';
import { IQuestionRepository } from '../repositories/i-question-repository';
import { ListQuestionOptionsRequest } from '../dtos/list-question-options-request.dto';
import { ListQuestionOptionsResponse } from '../dtos/list-question-options-response.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { QuestionNotFoundError } from './errors/question-not-found-error';
import { RepositoryError } from './errors/repository-error';
import { listQuestionOptionsSchema } from './validations/list-question-options.schema';

@Injectable()
export class ListQuestionOptionsUseCase {
  constructor(
    @Inject('QuestionOptionRepository')
    private readonly questionOptionRepository: IQuestionOptionRepository,
    @Inject('QuestionRepository')
    private readonly questionRepository: IQuestionRepository,
  ) {}

  async execute(
    request: ListQuestionOptionsRequest,
  ): Promise<
    Either<
      InvalidInputError | QuestionNotFoundError | RepositoryError,
      ListQuestionOptionsResponse
    >
  > {
    // Validate input
    const validation = listQuestionOptionsSchema.safeParse(request);
    if (!validation.success) {
      return left(new InvalidInputError(validation.error.message));
    }

    const { questionId } = validation.data;

    try {
      // Check if question exists
      const questionResult = await this.questionRepository.findById(questionId);
      if (questionResult.isLeft()) {
        return left(new QuestionNotFoundError());
      }
    } catch (error) {
      return left(new RepositoryError('Failed to fetch question'));
    }

    try {
      // Get question options
      const optionsResult = await this.questionOptionRepository.findByQuestionId(questionId);
      if (optionsResult.isLeft()) {
        return left(new RepositoryError('Failed to fetch question options'));
      }

      // Convert entities to response objects
      const options = optionsResult.value.map((option) => option.toResponseObject());

      return right({
        options,
      });
    } catch (error) {
      return left(new RepositoryError('Failed to fetch question options'));
    }
  }
}