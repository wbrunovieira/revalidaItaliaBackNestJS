// src/domain/auth/application/use-cases/profile/get-user-by-id.use-case.ts
import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';
import { validateSync } from 'class-validator';

import { GetUserResponseDto } from '../../dtos/user-response.dto';

import {
  InvalidInputError,
  ResourceNotFoundError,
  RepositoryError,
} from '@/domain/auth/domain/exceptions';
import { GetUserByIdRequestDto } from '../../dtos/get-user-by-id-request.dto';
import { IUserIdentityRepository } from '../../repositories/i-user-identity-repository';
import { IUserProfileRepository } from '../../repositories/i-user-profile-repository';
import { IUserAuthorizationRepository } from '../../repositories/i-user-authorization-repository';

export type GetUserByIdResponse = Either<
  InvalidInputError | ResourceNotFoundError | RepositoryError,
  GetUserResponseDto
>;

@Injectable()
export class GetUserByIdUseCase {
  constructor(
    @Inject(IUserIdentityRepository)
    private readonly identityRepo: IUserIdentityRepository,
    @Inject(IUserProfileRepository)
    private readonly profileRepo: IUserProfileRepository,
    @Inject(IUserAuthorizationRepository)
    private readonly authRepo: IUserAuthorizationRepository,
  ) {}

  async execute(request: GetUserByIdRequestDto): Promise<GetUserByIdResponse> {
    // Validate DTO
    const dto = Object.assign(new GetUserByIdRequestDto(), request);
    const errors = validateSync(dto);

    if (errors.length > 0) {
      const details = errors.flatMap((error) =>
        Object.entries(error.constraints || {}).map(([code, message]) => ({
          code,
          message,
          path: [error.property],
        })),
      );
      return left(new InvalidInputError('Validation failed', details));
    }

    const { id } = request;

    // Fetch identity
    const identityResult = await this.identityRepo.findById(id);
    if (identityResult.isLeft() || !identityResult.value) {
      return left(ResourceNotFoundError.withId('User', id));
    }
    const identity = identityResult.value;

    // Fetch profile
    const profileResult = await this.profileRepo.findByIdentityId(id);
    if (profileResult.isLeft() || !profileResult.value) {
      return left(ResourceNotFoundError.withId('UserProfile', id));
    }
    const profile = profileResult.value;

    // Fetch authorization
    const authResult = await this.authRepo.findByIdentityId(id);
    if (authResult.isLeft() || !authResult.value) {
      return left(ResourceNotFoundError.withId('UserAuthorization', id));
    }
    const authorization = authResult.value;

    // Compose the response
    return right({
      user: {
        id: identity.id.toString(),
        email: identity.email.value,
        name: profile.fullName,
        nationalId: profile.nationalId.value,
        phone: profile.phone || undefined,
        birthDate: profile.birthDate || undefined,
        profileImageUrl: profile.profileImageUrl || undefined,
        role: authorization.role,
        lastLogin: identity.lastLogin || undefined,
        createdAt: identity.createdAt,
        updatedAt:
          identity.updatedAt ||
          profile.updatedAt ||
          authorization.updatedAt ||
          identity.createdAt,
      },
    });
  }
}
