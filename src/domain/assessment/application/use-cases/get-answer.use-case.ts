// src/domain/assessment/application/use-cases/get-answer.use-case.ts

import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';
import { IAnswerRepository } from '../repositories/i-answer.repository';
import { GetAnswerRequest } from '../dtos/get-answer-request.dto';
import { GetAnswerResponse } from '../dtos/get-answer-response.dto';
import { getAnswerSchema } from './validations/get-answer.schema';
import { InvalidInputError } from './errors/invalid-input-error';
import { AnswerNotFoundError } from './errors/answer-not-found-error';
import { RepositoryError } from './errors/repository-error';

type GetAnswerUseCaseResponse = Either<
  | InvalidInputError
  | AnswerNotFoundError
  | RepositoryError,
  GetAnswerResponse
>;

@Injectable()
export class GetAnswerUseCase {
  constructor(
    @Inject('AnswerRepository')
    private readonly answerRepository: IAnswerRepository,
  ) {}

  async execute(request: GetAnswerRequest): Promise<GetAnswerUseCaseResponse> {
    // Validate input
    const validation = getAnswerSchema.safeParse(request);
    if (!validation.success) {
      return left(new InvalidInputError(validation.error.message));
    }

    const { id } = validation.data;

    try {
      // Get answer
      const answerResult = await this.answerRepository.findById(id);
      if (answerResult.isLeft()) {
        return left(new AnswerNotFoundError());
      }

      const answer = answerResult.value;

      return right({
        answer: answer.toResponseObject(),
      });
    } catch (error) {
      return left(new RepositoryError('An unexpected error occurred'));
    }
  }
}