// src/domain/auth/application/use-cases/authentication/authenticate-user.use-case.ts
import { Injectable, Inject } from '@nestjs/common';
import { IUserIdentityRepository } from '../../repositories/i-user-identity-repository';
import { IUserProfileRepository } from '../../repositories/i-user-profile-repository';
import { IUserAuthorizationRepository } from '../../repositories/i-user-authorization-repository';
import { AuthenticationError } from '@/domain/auth/domain/exceptions';
import { Email } from '@/domain/auth/enterprise/value-objects/email.vo';
import { Either, left, right } from '@/core/either';
import {
  IEventDispatcher,
  EVENT_DISPATCHER,
} from '@/core/domain/events/i-event-dispatcher';
import { UserLoggedInEvent } from '@/domain/auth/enterprise/events/user-logged-in.event';
import { EmailVerificationFactory } from '@/domain/auth/domain/services/email-verification.factory';
import { AuthenticateUserRequestDto } from '../../dtos/authenticate-user-request.dto';
import { AuthenticateUserResponseDto } from '../../dtos/authenticate-user-response.dto';

export type AuthenticateUserResult = Either<
  AuthenticationError,
  AuthenticateUserResponseDto
>;

@Injectable()
export class AuthenticateUserUseCase {
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

  async execute(
    request: AuthenticateUserRequestDto,
  ): Promise<AuthenticateUserResult> {
    const { email, password } = request;

    // Create Email VO - it validates the format
    let emailVO: Email;
    try {
      emailVO = Email.create(email);
    } catch (error) {
      return left(AuthenticationError.invalidCredentials());
    }

    // Find user identity by email
    const identityResult = await this.identityRepo.findByEmail(emailVO);
    if (identityResult.isLeft()) {
      return left(AuthenticationError.invalidCredentials());
    }

    const identity = identityResult.value;
    if (!identity) {
      return left(AuthenticationError.invalidCredentials());
    }

    // Check if account is locked
    if (identity.isLocked) {
      return left(AuthenticationError.accountLocked());
    }

    // Verify password
    const passwordMatch = await identity.password.compare(password);
    if (!passwordMatch) {
      // Increment failed attempts
      identity.incrementFailedLoginAttempts();
      await this.identityRepo.save(identity);

      return left(AuthenticationError.invalidCredentials());
    }

    // Use domain service to check email verification policy
    const emailVerificationService = EmailVerificationFactory.create();
    if (
      emailVerificationService.isVerificationRequiredForLogin() &&
      !identity.emailVerified
    ) {
      return left(AuthenticationError.emailNotVerified());
    }

    // Get user profile
    const profileResult = await this.profileRepo.findByIdentityId(
      identity.id.toString(),
    );
    if (profileResult.isLeft() || !profileResult.value) {
      return left(AuthenticationError.profileNotFound());
    }
    const profile = profileResult.value;

    // Get user authorization
    const authResult = await this.authorizationRepo.findByIdentityId(
      identity.id.toString(),
    );
    if (authResult.isLeft() || !authResult.value) {
      return left(AuthenticationError.authorizationNotFound());
    }
    const authorization = authResult.value;

    // Check if authorization is active
    if (!authorization.isActive) {
      return left(AuthenticationError.authorizationExpired());
    }

    // Update last login
    identity.updateLastLogin();
    const updateResult = await this.identityRepo.save(identity);
    if (updateResult.isLeft()) {
      // Log error but don't fail authentication
      console.error('Failed to update last login:', updateResult.value);
    }

    // Dispatch login event
    if (request.ipAddress && request.userAgent) {
      try {
        await this.eventDispatcher.dispatch(
          new UserLoggedInEvent(
            identity.id.toString(),
            identity.email.value,
            request.ipAddress,
            request.userAgent,
            new Date(),
          ),
        );
      } catch (error) {
        // Log error but don't fail authentication
        console.error('Failed to dispatch login event:', error);
      }
    }

    return right({
      user: {
        identityId: identity.id.toString(),
        email: identity.email.value,
        fullName: profile.fullName,
        role: authorization.role,
        profileImageUrl: profile.profileImageUrl,
      },
    });
  }
}
