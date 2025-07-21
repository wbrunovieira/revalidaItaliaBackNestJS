import { Injectable, Inject } from '@nestjs/common';
import { IUserIdentityRepository } from '../../repositories/i-user-identity-repository';
import { IUserProfileRepository } from '../../repositories/i-user-profile-repository';
import { IUserAuthorizationRepository } from '../../repositories/i-user-authorization-repository';
import { UserIdentity } from '@/domain/auth/enterprise/entities/user-identity';
import { UserProfile } from '@/domain/auth/enterprise/entities/user-profile';
import { UserAuthorization, UserRole } from '@/domain/auth/enterprise/entities/user-authorization';
import { Email } from '@/domain/auth/enterprise/value-objects/email.vo';
import { Password } from '@/domain/auth/enterprise/value-objects/password.vo';
import { NationalId } from '@/domain/auth/enterprise/value-objects/national-id.vo';
import { Either, left, right } from '@/core/either';
import { InvalidInputError, DuplicateEmailError, DuplicateNationalIdError } from '@/domain/auth/domain/exceptions';
import { IEventDispatcher, EVENT_DISPATCHER } from '@/core/domain/events/i-event-dispatcher';
import { UserCreatedEvent } from '@/domain/auth/enterprise/events/user-created.event';
import { UniqueEntityID } from '@/core/unique-entity-id';

export interface CreateUserRequest {
  email: string;
  password: string;
  fullName: string;
  nationalId: string;
  role?: UserRole;
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
    @Inject(EVENT_DISPATCHER)
    private eventDispatcher: IEventDispatcher,
  ) {}

  async execute(req: CreateUserRequest): Promise<CreateUserResult> {
    // Validate and create value objects
    let emailVO: Email;
    let passwordVO: Password;
    let nationalIdVO: NationalId;

    try {
      emailVO = Email.create(req.email);
      passwordVO = await Password.createFromPlain(req.password).toHash();
      nationalIdVO = NationalId.create(req.nationalId);
    } catch (error) {
      return left(new InvalidInputError(error instanceof Error ? error.message : 'Invalid input'));
    }

    // Check if email already exists
    const emailExistsResult = await this.identityRepo.emailExists(emailVO);
    if (emailExistsResult.isRight() && emailExistsResult.value) {
      return left(new DuplicateEmailError(req.email));
    }

    // Check if national ID already exists
    const nationalIdExistsResult = await this.profileRepo.nationalIdExists(nationalIdVO);
    if (nationalIdExistsResult.isRight() && nationalIdExistsResult.value) {
      return left(new DuplicateNationalIdError(req.nationalId));
    }

    // Generate a shared ID for linking aggregates
    const userId = new UniqueEntityID();

    // Create UserIdentity aggregate
    const identity = UserIdentity.create({
      email: emailVO,
      password: passwordVO,
      emailVerified: false,
    });

    // Create UserProfile aggregate
    const profile = UserProfile.create({
      identityId: userId,
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

    // Create UserAuthorization aggregate
    const authorization = UserAuthorization.create({
      identityId: userId,
      role: req.role || 'student',
    });

    // Save all aggregates in a transaction (implementation depends on your infrastructure)
    // For now, we'll save them sequentially
    const identitySaveResult = await this.identityRepo.save(identity);
    if (identitySaveResult.isLeft()) {
      return left(new InvalidInputError('Failed to create user identity'));
    }

    const profileSaveResult = await this.profileRepo.save(profile);
    if (profileSaveResult.isLeft()) {
      // Rollback identity creation
      await this.identityRepo.delete(identity.id.toString());
      return left(new InvalidInputError('Failed to create user profile'));
    }

    const authSaveResult = await this.authorizationRepo.save(authorization);
    if (authSaveResult.isLeft()) {
      // Rollback identity and profile creation
      await this.identityRepo.delete(identity.id.toString());
      await this.profileRepo.delete(profile.id.toString());
      return left(new InvalidInputError('Failed to create user authorization'));
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
          new Date()
        )
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