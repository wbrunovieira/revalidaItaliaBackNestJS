// src/domain/auth/application/use-cases/delete-user.use-case.ts
import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';
import { IAccountRepository } from '../repositories/i-account-repository';
import { ResourceNotFoundError } from './errors/resource-not-found-error';
import { RepositoryError } from './errors/repository-error';
import { UnauthorizedError } from './errors/unauthorized-error';

export interface DeleteUserRequest {
  id: string;
  requesterId: string; // ID do usuário que está fazendo a requisição
  requesterRole: 'admin' | 'tutor' | 'student';
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
      const { id, requesterId, requesterRole } = request;

      // Only admins can delete users
      if (requesterRole !== 'admin') {
        // Exception: users can delete their own account
        if (id !== requesterId) {
          return left(
            new UnauthorizedError('Only admins can delete other users'),
          );
        }
      }

      // Check if user exists
      const userResult = await this.accountRepo.findById(id);

      if (userResult.isLeft()) {
        return left(new ResourceNotFoundError('User not found'));
      }

      const user = userResult.value;

      // Prevent deleting the last admin
      if (user.role === 'admin' && id !== requesterId) {
        // Optional: Check if this is the last admin
        // This would require a countByRole method in the repository
        // For now, we'll allow it but log a warning
        console.warn(`Admin user ${id} is being deleted by ${requesterId}`);
      }

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
