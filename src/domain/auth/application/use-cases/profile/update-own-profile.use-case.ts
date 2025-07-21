// src/domain/auth/application/use-cases/profile/update-own-profile.use-case.ts

import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';

import { Email } from '@/domain/auth/enterprise/value-objects/email.vo';
import { NationalId } from '@/domain/auth/enterprise/value-objects/national-id.vo';

import {
  InvalidInputError,
  ResourceNotFoundError,
  DuplicateEmailError,
  DuplicateNationalIdError,
  RepositoryError,
} from '@/domain/auth/domain/exceptions';
import { IUserIdentityRepository } from '../../repositories/i-user-identity-repository';
import { IUserProfileRepository } from '../../repositories/i-user-profile-repository';

export interface UpdateOwnProfileRequest {
  identityId: string;
  name?: string;
  email?: string;
  nationalId?: string;
  phone?: string;
  birthDate?: Date;
  profileImageUrl?: string;
}

export interface UpdateOwnProfileResponse {
  identity: {
    id: string;
    email: string;
  };
  profile: {
    fullName: string;
    nationalId: string;
    phone?: string | null;
    birthDate?: Date | null;
    profileImageUrl?: string | null;
  };
}

type UpdateOwnProfileUseCaseResponse = Either<
  | InvalidInputError
  | ResourceNotFoundError
  | DuplicateEmailError
  | DuplicateNationalIdError
  | RepositoryError,
  UpdateOwnProfileResponse
>;

@Injectable()
export class UpdateOwnProfileUseCase {
  constructor(
    @Inject(IUserIdentityRepository)
    private readonly identityRepository: IUserIdentityRepository,
    @Inject(IUserProfileRepository)
    private readonly profileRepository: IUserProfileRepository,
  ) {}

  async execute(
    request: UpdateOwnProfileRequest,
  ): Promise<UpdateOwnProfileUseCaseResponse> {
    const {
      identityId,
      name,
      email,
      nationalId,
      phone,
      birthDate,
      profileImageUrl,
    } = request;

    if (
      !name &&
      !email &&
      !nationalId &&
      !phone &&
      birthDate === undefined &&
      profileImageUrl === undefined
    ) {
      return left(
        InvalidInputError.missingRequiredFields([
          'name',
          'email',
          'nationalId',
          'phone',
          'birthDate',
          'profileImageUrl',
        ]),
      );
    }

    // Find identity
    const identityResult = await this.identityRepository.findById(identityId);
    if (identityResult.isLeft()) {
      return left(ResourceNotFoundError.withId('UserIdentity', identityId));
    }
    const identity = identityResult.value;
    if (!identity) {
      return left(ResourceNotFoundError.withId('UserIdentity', identityId));
    }

    // Find profile
    const profileResult = await this.profileRepository.findByIdentityId(
      identityId,
    );
    if (profileResult.isLeft()) {
      return left(ResourceNotFoundError.withId('UserProfile', identityId));
    }
    const profile = profileResult.value;
    if (!profile) {
      return left(ResourceNotFoundError.withId('UserProfile', identityId));
    }

    // Check for duplicate email
    if (email && email !== identity.email.value) {
      try {
        const emailVO = Email.create(email);
        const byEmail = await this.identityRepository.findByEmail(emailVO);
        if (
          byEmail.isRight() &&
          byEmail.value &&
          byEmail.value.id.toString() !== identityId
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

    // Check for duplicate nationalId
    if (nationalId && nationalId !== profile.nationalId.value) {
      try {
        const nationalIdVO = NationalId.create(nationalId);
        const byNationalId =
          await this.profileRepository.findByNationalId(nationalIdVO);
        if (
          byNationalId.isRight() &&
          byNationalId.value &&
          byNationalId.value.identityId.toString() !== identityId
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

    // Update identity if email changed
    if (email) {
      identity.changeEmail(Email.create(email));
      const saveIdentityResult = await this.identityRepository.save(identity);
      if (saveIdentityResult.isLeft()) {
        return left(
          RepositoryError.operationFailed(
            'save identity',
            saveIdentityResult.value,
          ),
        );
      }
    }

    // Update profile
    if (name) profile.updateFullName(name);
    if (nationalId) profile.updateNationalId(NationalId.create(nationalId));
    if (phone !== undefined) profile.updatePhone(phone);
    if (birthDate !== undefined) profile.updateBirthDate(birthDate);
    if (profileImageUrl !== undefined)
      profile.updateProfileImageUrl(profileImageUrl);

    const saveProfileResult = await this.profileRepository.save(profile);
    if (saveProfileResult.isLeft()) {
      return left(
        RepositoryError.operationFailed(
          'save profile',
          saveProfileResult.value,
        ),
      );
    }

    return right({
      identity: {
        id: identity.id.toString(),
        email: identity.email.value,
      },
      profile: {
        fullName: profile.fullName,
        nationalId: profile.nationalId.value,
        phone: profile.phone,
        birthDate: profile.birthDate,
        profileImageUrl: profile.profileImageUrl,
      },
    });
  }
}
