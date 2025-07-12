// src/domain/assessment/application/use-cases/get-argument.use-case.ts
import { Injectable, Inject } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { IArgumentRepository } from '@/domain/assessment/application/repositories/i-argument-repository';
import { GetArgumentRequest } from '@/domain/assessment/application/dtos/get-argument-request.dto';
import { GetArgumentResponse } from '@/domain/assessment/application/dtos/get-argument-response.dto';
import { getArgumentSchema } from '@/domain/assessment/application/use-cases/validations/get-argument.schema';
import { InvalidInputError } from '@/domain/assessment/application/use-cases/errors/invalid-input-error';
import { ArgumentNotFoundError } from '@/domain/assessment/application/use-cases/errors/argument-not-found-error';
import { RepositoryError } from '@/domain/assessment/application/use-cases/errors/repository-error';

export type GetArgumentUseCaseResponse = Either<
  InvalidInputError | ArgumentNotFoundError | RepositoryError,
  GetArgumentResponse
>;

@Injectable()
export class GetArgumentUseCase {
  constructor(
    @Inject('ArgumentRepository')
    private readonly argumentRepository: IArgumentRepository,
  ) {}

  async execute(
    request: GetArgumentRequest,
  ): Promise<GetArgumentUseCaseResponse> {
    // Validate request structure first
    if (!request || typeof request !== 'object' || Array.isArray(request)) {
      return left(
        new InvalidInputError('Invalid request format', [
          'Request must be a valid object',
        ]),
      );
    }

    const parseResult = getArgumentSchema.safeParse(request);
    if (!parseResult.success) {
      const errorMessages = parseResult.error.issues.map((issue) => {
        return `${issue.path.join('.')}: ${issue.message}`;
      });
      return left(new InvalidInputError('Validation failed', errorMessages));
    }

    const { id } = parseResult.data;

    try {
      const result = await this.argumentRepository.findById(id);

      if (result.isLeft()) {
        return left(new ArgumentNotFoundError());
      }

      const argument = result.value;

      // Validate argument data integrity
      if (!argument || !argument.id || !argument.title) {
        return left(
          new RepositoryError(
            'Invalid argument data retrieved from repository',
          ),
        );
      }

      // Create immutable response object
      const response = {
        argument: {
          id: argument.id.toString(),
          title: argument.title,
          assessmentId: argument.assessmentId?.toString(),
          createdAt: new Date(argument.createdAt),
          updatedAt: new Date(argument.updatedAt),
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
