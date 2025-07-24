// src/domain/auth/application/use-cases/profile/update-user.use-case.ts

import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';

import { Email } from '@/domain/auth/enterprise/value-objects/email.vo';
import { NationalId } from '@/domain/auth/enterprise/value-objects/national-id.vo';
import { UpdateUserRequestDto } from '../../dtos/update-user-request.dto';
import { UpdateUserResponseDto } from '../../dtos/update-user-response.dto';

import {
  InvalidInputError,
  ResourceNotFoundError,
  DuplicateEmailError,
  DuplicateNationalIdError,
  RepositoryError,
} from '@/domain/auth/domain/exceptions';
import { IUserIdentityRepository } from '../../repositories/i-user-identity-repository';

import { IUserProfileRepository } from '../../repositories/i-user-profile-repository';
import { IUserAuthorizationRepository } from '../../repositories/i-user-authorization-repository';
import { UserAuthorization } from '@/domain/auth/enterprise/entities/user-authorization';

export type UpdateUserUseCaseResponse = Either<
  | InvalidInputError
  | ResourceNotFoundError
  | DuplicateEmailError
  | DuplicateNationalIdError
  | RepositoryError,
  UpdateUserResponseDto
>;

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(IUserIdentityRepository)
    private readonly identityRepository: IUserIdentityRepository,
    @Inject(IUserProfileRepository)
    private readonly profileRepository: IUserProfileRepository,
    @Inject(IUserAuthorizationRepository)
    private readonly authorizationRepository: IUserAuthorizationRepository,
  ) {}

  async execute(
    request: UpdateUserRequestDto,
  ): Promise<UpdateUserUseCaseResponse> {
    const { id, name, email, nationalId, role } = request;

    // Business rule: at least one field must be provided for update
    if (!name && !email && !nationalId && !role) {
      return left(
        new InvalidInputError('At least one field must be provided for update', [
          {
            code: 'missingFields',
            message: 'At least one field must be provided for update',
            path: ['request'],
          },
        ]),
      );
    }

    try {
      // Find identity
      const identityResult = await this.identityRepository.findById(id);
    if (identityResult.isLeft()) {
      return left(ResourceNotFoundError.withId('UserIdentity', id));
    }
    const identity = identityResult.value;
    if (!identity) {
      return left(ResourceNotFoundError.withId('UserIdentity', id));
    }

    // Find profile
    const profileResult = await this.profileRepository.findByIdentityId(id);
    if (profileResult.isLeft()) {
      return left(ResourceNotFoundError.withId('UserProfile', id));
    }
    const profile = profileResult.value;
    if (!profile) {
      return left(ResourceNotFoundError.withId('UserProfile', id));
    }

    // Find authorization if role update is requested
    let authorization: UserAuthorization | null = null;
    if (role) {
      const authResult =
        await this.authorizationRepository.findByIdentityId(id);
      if (authResult.isLeft()) {
        return left(ResourceNotFoundError.withId('UserAuthorization', id));
      }
      authorization = authResult.value;
      if (!authorization) {
        return left(ResourceNotFoundError.withId('UserAuthorization', id));
      }
    }

    if (email && email !== identity.email.value) {
      try {
        const emailVO = Email.create(email);
        const byEmail = await this.identityRepository.findByEmail(emailVO);
        if (
          byEmail.isRight() &&
          byEmail.value &&
          byEmail.value.id.toString() !== id
        ) {
          return left(new DuplicateEmailError(email));
        }
      } catch (err: any) {
        if (err.message.includes('Invalid')) {
          return left(
            InvalidInputError.invalidFormat('email', 'user@example.com'),
          );
        }
        return left(RepositoryError.operationFailed('findByEmail', err));
      }
    }

    if (nationalId && nationalId !== profile.nationalId.value) {
      try {
        const nationalIdVO = NationalId.create(nationalId);
        const byNationalId =
          await this.profileRepository.findByNationalId(nationalIdVO);
        if (
          byNationalId.isRight() &&
          byNationalId.value &&
          byNationalId.value.identityId.toString() !== id
        ) {
          return left(new DuplicateNationalIdError(nationalId));
        }
      } catch (err: any) {
        if (err.message.includes('Invalid') || err.message.includes('must')) {
          return left(
            InvalidInputError.invalidFormat('nationalId', 'valid national ID'),
          );
        }
        return left(RepositoryError.operationFailed('findByNationalId', err));
      }
    }

    // Apply business operations to entities
    if (email) {
      identity.changeEmail(Email.create(email));
    }

    if (name) {
      profile.fullName = name;
    }

    if (nationalId) {
      profile.updateNationalId(NationalId.create(nationalId));
    }

    if (role && authorization) {
      authorization.role = role;
    }

    // Persist changes - each aggregate needs its own save
    // In a real implementation, these should be wrapped in a transaction
    try {
      if (email) {
        const result = await this.identityRepository.save(identity);
        if (result.isLeft()) {
          return left(
            RepositoryError.operationFailed('save identity', result.value),
          );
        }
      }

      if (name || nationalId) {
        const result = await this.profileRepository.save(profile);
        if (result.isLeft()) {
          return left(
            RepositoryError.operationFailed('save profile', result.value),
          );
        }
      }

      if (role && authorization) {
        const result = await this.authorizationRepository.save(authorization);
        if (result.isLeft()) {
          return left(
            RepositoryError.operationFailed('save authorization', result.value),
          );
        }
      }
    } catch (error: any) {
      return left(RepositoryError.operationFailed('save', error));
    }

      return right({
        identity: {
          id: identity.id.toString(),
          email: identity.email.value,
        },
        profile: {
          fullName: profile.fullName,
          nationalId: profile.nationalId.value,
        },
        authorization: {
          role: authorization
            ? authorization.role
            : await (async () => {
                const authResult =
                  await this.authorizationRepository.findByIdentityId(id);
                return authResult.isRight() && authResult.value
                  ? authResult.value.role
                  : 'student';
              })(),
        },
      });
    } catch (error: any) {
      return left(
        RepositoryError.operationFailed(
          'updateUser',
          error instanceof Error ? error : new Error('Unknown error'),
        ),
      );
    }
  }
}
