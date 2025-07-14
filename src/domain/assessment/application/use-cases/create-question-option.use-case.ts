// src/domain/assessment/application/use-cases/create-question-option.use-case.ts

import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { QuestionOption } from '@/domain/assessment/enterprise/entities/question-option.entity';
import { IQuestionOptionRepository } from '../repositories/i-question-option-repository';
import { IQuestionRepository } from '../repositories/i-question-repository';
import { CreateQuestionOptionRequest } from '../dtos/create-question-option-request.dto';
import { CreateQuestionOptionResponse } from '../dtos/create-question-option-response.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { RepositoryError } from './errors/repository-error';
import { QuestionNotFoundError } from './errors/question-not-found-error';
import {
  CreateQuestionOptionSchema,
  createQuestionOptionSchema,
} from './validations/create-question-option.schema';

type CreateQuestionOptionUseCaseResponse = Either<
  | InvalidInputError
  | QuestionNotFoundError
  | RepositoryError
  | Error,
  CreateQuestionOptionResponse
>;

@Injectable()
export class CreateQuestionOptionUseCase {
  constructor(
    @Inject('QuestionOptionRepository')
    private readonly questionOptionRepository: IQuestionOptionRepository,
    @Inject('QuestionRepository')
    private readonly questionRepository: IQuestionRepository,
  ) {}

  async execute(
    request: CreateQuestionOptionRequest,
  ): Promise<CreateQuestionOptionUseCaseResponse> {
    // 1. Validate input data
    const validationResult = createQuestionOptionSchema.safeParse(request);
    if (!validationResult.success) {
      return left(new InvalidInputError(validationResult.error.message));
    }

    const validatedData: CreateQuestionOptionSchema = validationResult.data;

    // 2. Check if question exists
    const questionResult = await this.questionRepository.findById(
      validatedData.questionId,
    );
    if (questionResult.isLeft()) {
      const error = questionResult.value;
      if (error.message === 'Question not found') {
        return left(new QuestionNotFoundError());
      }
      return left(new RepositoryError('Failed to fetch question'));
    }

    // 3. Create QuestionOption entity
    const questionOption = QuestionOption.create({
      text: validatedData.text,
      questionId: new UniqueEntityID(validatedData.questionId),
    });

    // 4. Save question option to repository
    const createResult = await this.questionOptionRepository.create(questionOption);
    if (createResult.isLeft()) {
      return left(new RepositoryError('Failed to create question option'));
    }

    // 5. Return response
    const response: CreateQuestionOptionResponse = {
      questionOption: {
        id: questionOption.id.toString(),
        text: questionOption.text,
        questionId: questionOption.questionId.toString(),
        createdAt: questionOption.createdAt,
        updatedAt: questionOption.updatedAt,
      },
    };

    return right(response);
  }
}