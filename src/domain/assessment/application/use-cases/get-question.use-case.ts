// src/domain/assessment/application/use-cases/get-question.use-case.ts
import { Injectable, Inject } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { IQuestionRepository } from '@/domain/assessment/application/repositories/i-question-repository';
import { GetQuestionRequest } from '@/domain/assessment/application/dtos/get-question-request.dto';
import { GetQuestionResponse } from '@/domain/assessment/application/dtos/get-question-response.dto';
import { getQuestionSchema } from '@/domain/assessment/application/use-cases/validations/get-question.schema';
import { InvalidInputError } from '@/domain/assessment/application/use-cases/errors/invalid-input-error';
import { QuestionNotFoundError } from '@/domain/assessment/application/use-cases/errors/question-not-found-error';
import { RepositoryError } from '@/domain/assessment/application/use-cases/errors/repository-error';
export type GetQuestionUseCaseResponse = Either<
  InvalidInputError | QuestionNotFoundError | RepositoryError,
  GetQuestionResponse
>;

@Injectable()
export class GetQuestionUseCase {
  constructor(
    @Inject('QuestionRepository')
    private readonly questionRepository: IQuestionRepository,
  ) {}

  async execute(
    request: GetQuestionRequest,
  ): Promise<GetQuestionUseCaseResponse> {
    // Validate request structure first
    if (!request || typeof request !== 'object' || Array.isArray(request)) {
      return left(
        new InvalidInputError('Invalid request format', [
          'Request must be a valid object',
        ]),
      );
    }

    const parseResult = getQuestionSchema.safeParse(request);
    if (!parseResult.success) {
      const errorMessages = parseResult.error.issues.map((issue) => {
        return `${issue.path.join('.')}: ${issue.message}`;
      });
      return left(new InvalidInputError('Validation failed', errorMessages));
    }

    const { id } = parseResult.data;

    try {
      const result = await this.questionRepository.findById(id);

      if (result.isLeft()) {
        return left(new QuestionNotFoundError());
      }

      const question = result.value;

      // Validate question data integrity
      if (!question || !question.id || !question.text || !question.type) {
        return left(
          new RepositoryError(
            'Invalid question data retrieved from repository',
          ),
        );
      }

      // Create immutable response object
      const response: GetQuestionResponse = {
        question: {
          id: question.id.toString(),
          text: question.text,
          type: question.type.getValue(),
          assessmentId: question.assessmentId.toString(),
          argumentId: question.argumentId?.toString(),
          createdAt: new Date(question.createdAt),
          updatedAt: new Date(question.updatedAt),
        },
      };

      return right(response);
    } catch (err: any) {
      // Enhanced error handling for different error types
      if (err && err.name === 'TimeoutError') {
        return left(new RepositoryError('Database operation timed out'));
      }

      if (err && err.name === 'ConnectionError') {
        return left(new RepositoryError('Database connection failed'));
      }

      if (err && err.code === 'ECONNREFUSED') {
        return left(new RepositoryError('Unable to connect to database'));
      }

      if (err && err.code === 'ENOTFOUND') {
        return left(new RepositoryError('Database host not found'));
      }

      const errorMessage = err?.message || 'Unknown repository error occurred';
      return left(new RepositoryError(errorMessage));
    }
  }
}
