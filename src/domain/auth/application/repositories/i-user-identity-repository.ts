import { Either } from '@/core/either';
import { UserIdentity } from '../../enterprise/entities/user-identity';
import { Email } from '../../enterprise/value-objects/email.vo';

/**
 * Repository interface for UserIdentity aggregate
 *
 * Handles all persistence operations related to user authentication
 * and identity management.
 */
export abstract class IUserIdentityRepository {
  /**
   * Find a user identity by email
   */
  abstract findByEmail(
    email: Email,
  ): Promise<Either<Error, UserIdentity | null>>;

  /**
   * Find a user identity by ID
   */
  abstract findById(id: string): Promise<Either<Error, UserIdentity | null>>;

  /**
   * Find by email verification token
   */
  abstract findByEmailVerificationToken(
    token: string,
  ): Promise<Either<Error, UserIdentity | null>>;

  /**
   * Find by password reset token
   */
  abstract findByPasswordResetToken(
    token: string,
  ): Promise<Either<Error, UserIdentity | null>>;

  /**
   * Check if email already exists
   */
  abstract emailExists(email: Email): Promise<Either<Error, boolean>>;

  /**
   * Save or update user identity
   */
  abstract save(userIdentity: UserIdentity): Promise<Either<Error, void>>;

  /**
   * Delete user identity (cascade will handle related data)
   */
  abstract delete(id: string): Promise<Either<Error, void>>;
}
