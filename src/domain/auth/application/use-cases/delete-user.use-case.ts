// src/domain/auth/application/use-cases/delete-user.use-case.ts
import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';
import { IAccountRepository } from '../repositories/i-account-repository';
import { ResourceNotFoundError } from './errors/resource-not-found-error';
import { RepositoryError } from './errors/repository-error';
import { UnauthorizedError } from './errors/unauthorized-error';

export interface DeleteUserRequest {
  id: string;
}

export interface DeleteUserResponse {
  message: string;
}

export type DeleteUserUseCaseResponse = Either<
  ResourceNotFoundError | UnauthorizedError | RepositoryError,
  DeleteUserResponse
>;

@Injectable()
export class DeleteUserUseCase {
  constructor(
    @Inject(IAccountRepository)
    private readonly accountRepo: IAccountRepository,
  ) {}

  async execute(
    request: DeleteUserRequest,
  ): Promise<DeleteUserUseCaseResponse> {
    try {
      const { id } = request;

      // Check if user exists
      const userResult = await this.accountRepo.findById(id);

      if (userResult.isLeft()) {
        return left(new ResourceNotFoundError('User not found'));
      }

      const user = userResult.value;

      // Delete the user
      const deleteResult = await this.accountRepo.delete(user);

      if (deleteResult.isLeft()) {
        return left(new RepositoryError(deleteResult.value.message));
      }

      return right({
        message: 'User deleted successfully',
      });
    } catch (error: any) {
      return left(
        new RepositoryError(error.message || 'Failed to delete user'),
      );
    }
  }
}
