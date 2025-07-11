// src/domain/assessment/application/use-cases/update-argument.use-case.ts
import { Injectable, Inject } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { IArgumentRepository } from '@/domain/assessment/application/repositories/i-argument-repository';
import { UpdateArgumentRequest } from '@/domain/assessment/application/dtos/update-argument-request.dto';
import { UpdateArgumentResponse } from '@/domain/assessment/application/dtos/update-argument-response.dto';

import { InvalidInputError } from '@/domain/assessment/application/use-cases/errors/invalid-input-error';
import { ArgumentNotFoundError } from '@/domain/assessment/application/use-cases/errors/argument-not-found-error';
import { RepositoryError } from '@/domain/assessment/application/use-cases/errors/repository-error';
import { DuplicateArgumentError } from '@/domain/assessment/application/use-cases/errors/duplicate-argument-error';
import { updateArgumentSchema } from './validations/update-argument.schema';

export type UpdateArgumentUseCaseResponse = Either<
  | InvalidInputError
  | ArgumentNotFoundError
  | RepositoryError
  | DuplicateArgumentError,
  UpdateArgumentResponse
>;

@Injectable()
export class UpdateArgumentUseCase {
  constructor(
    @Inject('ArgumentRepository')
    private readonly argumentRepository: IArgumentRepository,
  ) {}

  async execute(
    request: UpdateArgumentRequest,
  ): Promise<UpdateArgumentUseCaseResponse> {
    try {
      const parseResult = updateArgumentSchema.safeParse(request);
      if (!parseResult.success) {
        const errorMessages = parseResult.error.issues.map((issue) => {
          return `${issue.path.join('.')}: ${issue.message}`;
        });
        return left(new InvalidInputError('Validation failed', errorMessages));
      }

      const { id, title } = parseResult.data;

      const existingArgumentResult = await this.argumentRepository.findById(id);
      if (existingArgumentResult.isLeft()) {
        return left(new ArgumentNotFoundError());
      }

      const argument = existingArgumentResult.value;

      if (title !== undefined) {
        const newTitle = title.trim();
        if (newTitle.length === 0) {
          return left(
            new InvalidInputError('Validation failed', [
              'title: Title cannot be empty',
            ]),
          );
        }

        const existingByTitle =
          await this.argumentRepository.findByTitle(newTitle);
        if (
          existingByTitle.isRight() &&
          existingByTitle.value.id.toString() !== argument.id.toString()
        ) {
          return left(new DuplicateArgumentError());
        }

        argument.update({ title: newTitle });
      }

      const updateResult = await this.argumentRepository.update(argument);
      if (updateResult.isLeft()) {
        return left(new RepositoryError(updateResult.value.message));
      }

      return right({ argument });
    } catch (err: any) {
      console.error('UpdateArgumentUseCase error:', err);

      if (err instanceof InvalidInputError) {
        return left(err);
      }

      if (err instanceof Error) {
        return left(new RepositoryError(err.message));
      }

      return left(new RepositoryError('An unexpected error occurred'));
    }
  }
}
