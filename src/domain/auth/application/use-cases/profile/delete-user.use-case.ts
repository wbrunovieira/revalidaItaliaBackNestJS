// src/domain/auth/application/use-cases/profile/delete-user.use-case.ts
import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';

import {
  ResourceNotFoundError,
  RepositoryError,
  UnauthorizedError,
} from '@/domain/auth/domain/exceptions';
import { IUserIdentityRepository } from '../../repositories/i-user-identity-repository';
import { IUserProfileRepository } from '../../repositories/i-user-profile-repository';
import { IUserAuthorizationRepository } from '../../repositories/i-user-authorization-repository';

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
    @Inject(IUserIdentityRepository)
    private readonly identityRepo: IUserIdentityRepository,
    @Inject(IUserProfileRepository)
    private readonly profileRepo: IUserProfileRepository,
    @Inject(IUserAuthorizationRepository)
    private readonly authorizationRepo: IUserAuthorizationRepository,
  ) {}

  async execute(
    request: DeleteUserRequest,
  ): Promise<DeleteUserUseCaseResponse> {
    try {
      const { id } = request;

      // Check if identity exists
      const identityResult = await this.identityRepo.findById(id);

      if (identityResult.isLeft() || !identityResult.value) {
        return left(ResourceNotFoundError.withId('UserIdentity', id));
      }

      const identity = identityResult.value;

      // Delete in order: authorization, profile, then identity
      // Authorization first (least critical)
      const authResult = await this.authorizationRepo.findByIdentityId(id);
      if (authResult.isRight() && authResult.value) {
        const deleteAuthResult = await this.authorizationRepo.delete(
          authResult.value.id.toString(),
        );
        if (deleteAuthResult.isLeft()) {
          return left(
            RepositoryError.operationFailed(
              'delete authorization',
              deleteAuthResult.value,
            ),
          );
        }
      }

      // Profile second
      const profileResult = await this.profileRepo.findByIdentityId(id);
      if (profileResult.isRight() && profileResult.value) {
        const deleteProfileResult = await this.profileRepo.delete(
          profileResult.value.id.toString(),
        );
        if (deleteProfileResult.isLeft()) {
          return left(
            RepositoryError.operationFailed(
              'delete profile',
              deleteProfileResult.value,
            ),
          );
        }
      }

      // Identity last (most critical)
      const deleteIdentityResult = await this.identityRepo.delete(identity.id.toString());
      if (deleteIdentityResult.isLeft()) {
        return left(
          RepositoryError.operationFailed(
            'delete identity',
            deleteIdentityResult.value,
          ),
        );
      }

      return right({
        message: 'User deleted successfully',
      });
    } catch (error: any) {
      return left(RepositoryError.operationFailed('delete', error));
    }
  }
}
