// src/domain/auth/application/use-cases/profile/create-user.use-case.ts
import { Injectable, Inject } from '@nestjs/common';
import { IUserIdentityRepository } from '../../repositories/i-user-identity-repository';
import { IUserProfileRepository } from '../../repositories/i-user-profile-repository';
import { IUserAuthorizationRepository } from '../../repositories/i-user-authorization-repository';
import { IAuthUnitOfWork } from '../../repositories/i-unit-of-work';
import { UserIdentity } from '@/domain/auth/enterprise/entities/user-identity';
import { UserProfile } from '@/domain/auth/enterprise/entities/user-profile';
import {
  UserAuthorization,
  UserRole,
} from '@/domain/auth/enterprise/entities/user-authorization';
import { Email } from '@/domain/auth/enterprise/value-objects/email.vo';
import { Password } from '@/domain/auth/enterprise/value-objects/password.vo';
import { NationalId } from '@/domain/auth/enterprise/value-objects/national-id.vo';
import { Either, left, right } from '@/core/either';
import {
  InvalidInputError,
  DuplicateEmailError,
  DuplicateNationalIdError,
  InvalidRoleException,
  InvalidFullNameException,
} from '@/domain/auth/domain/exceptions';
import {
  IEventDispatcher,
  EVENT_DISPATCHER,
} from '@/core/domain/events/i-event-dispatcher';
import { UserCreatedEvent } from '@/domain/auth/enterprise/events/user-created.event';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { EmailVerificationFactory } from '@/domain/auth/domain/services/email-verification.factory';

export interface CreateUserRequest {
  email: string;
  password: string;
  fullName: string;
  nationalId: string;
  role?: UserRole;
  source?: string; // 'admin', 'hotmart', 'api', etc.
  phone?: string;
  birthDate?: Date;
  profileImageUrl?: string;
  bio?: string;
  profession?: string;
  specialization?: string;
  preferredLanguage?: string;
  timezone?: string;
}

export interface CreateUserResponse {
  identityId: string;
  profileId: string;
  authorizationId: string;
  email: string;
  fullName: string;
  role: string;
}

export type CreateUserResult = Either<
  InvalidInputError | DuplicateEmailError | DuplicateNationalIdError,
  CreateUserResponse
>;

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(IUserIdentityRepository)
    private identityRepo: IUserIdentityRepository,
    @Inject(IUserProfileRepository)
    private profileRepo: IUserProfileRepository,
    @Inject(IUserAuthorizationRepository)
    private authorizationRepo: IUserAuthorizationRepository,
    @Inject(IAuthUnitOfWork)
    private unitOfWork: IAuthUnitOfWork,
    @Inject(EVENT_DISPATCHER)
    private eventDispatcher: IEventDispatcher,
  ) {}

  async execute(req: CreateUserRequest): Promise<CreateUserResult> {
    // Validate required fields
    if (!req || typeof req !== 'object') {
      return left(new InvalidInputError('Invalid request'));
    }

    // Check for completely missing required fields (undefined)
    if (
      req.email === undefined ||
      req.password === undefined ||
      req.fullName === undefined ||
      req.nationalId === undefined
    ) {
      return left(new InvalidInputError('Missing required fields'));
    }

    // Validate and create value objects
    let emailVO: Email;
    let passwordVO: Password;
    let nationalIdVO: NationalId;

    try {
      emailVO = Email.create(req.email);
      passwordVO = await Password.createFromPlain(req.password).toHash();
      nationalIdVO = NationalId.create(req.nationalId);
    } catch (error) {
      return left(
        new InvalidInputError(
          error instanceof Error ? error.message : 'Invalid input',
        ),
      );
    }

    // Check if email already exists
    const emailExistsResult = await this.identityRepo.emailExists(emailVO);
    if (emailExistsResult.isRight() && emailExistsResult.value) {
      return left(new DuplicateEmailError(req.email));
    }

    // Check if national ID already exists
    const nationalIdExistsResult =
      await this.profileRepo.nationalIdExists(nationalIdVO);
    if (nationalIdExistsResult.isRight() && nationalIdExistsResult.value) {
      return left(new DuplicateNationalIdError(req.nationalId));
    }

    // Use domain service to determine email verification policy
    const emailVerificationService = EmailVerificationFactory.create();
    const emailVerified = emailVerificationService.shouldAutoVerifyEmail(
      req.source,
    );

    // Create UserIdentity aggregate first
    const identity = UserIdentity.create({
      email: emailVO,
      password: passwordVO,
      emailVerified,
    });

    // Use the identity ID for related aggregates
    const identityId = identity.id;

    // Create UserProfile aggregate
    let profile: UserProfile;
    try {
      profile = UserProfile.create({
        identityId: identityId,
        fullName: req.fullName,
        nationalId: nationalIdVO,
        phone: req.phone,
        birthDate: req.birthDate,
        profileImageUrl: req.profileImageUrl,
        bio: req.bio,
        profession: req.profession,
        specialization: req.specialization,
        preferredLanguage: req.preferredLanguage,
        timezone: req.timezone,
      });
    } catch (error) {
      if (error instanceof InvalidFullNameException) {
        return left(new InvalidInputError(error.message));
      }
      throw error;
    }

    // Create UserAuthorization aggregate
    let authorization: UserAuthorization;
    try {
      authorization = UserAuthorization.create({
        identityId: identityId,
        role: req.role || 'student',
      });
    } catch (error) {
      if (error instanceof InvalidRoleException) {
        return left(new InvalidInputError(error.message));
      }
      throw error;
    }

    // Save all aggregates in a transaction
    try {
      await this.unitOfWork.execute(async () => {
        // Use repositories from unit of work to ensure transaction context
        const identitySaveResult =
          await this.unitOfWork.identityRepository.save(identity);
        if (identitySaveResult.isLeft()) {
          throw new Error('Failed to create user identity');
        }

        const profileSaveResult =
          await this.unitOfWork.profileRepository.save(profile);
        if (profileSaveResult.isLeft()) {
          throw new Error('Failed to create user profile');
        }

        const authSaveResult =
          await this.unitOfWork.authorizationRepository.save(authorization);
        if (authSaveResult.isLeft()) {
          throw new Error('Failed to create user authorization');
        }
      });
    } catch (error) {
      return left(
        new InvalidInputError(
          error instanceof Error ? error.message : 'Failed to create user',
        ),
      );
    }

    // Dispatch user created event
    try {
      await this.eventDispatcher.dispatch(
        new UserCreatedEvent(
          identity.id.toString(),
          identity.email.value,
          profile.fullName,
          authorization.role,
          'registration',
          new Date(),
        ),
      );
    } catch (error) {
      // Log error but don't fail the operation
      console.error('Failed to dispatch user created event:', error);
    }

    return right({
      identityId: identity.id.toString(),
      profileId: profile.id.toString(),
      authorizationId: authorization.id.toString(),
      email: identity.email.value,
      fullName: profile.fullName,
      role: authorization.role,
    });
  }
}
