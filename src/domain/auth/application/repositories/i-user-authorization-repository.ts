import { Either } from '@/core/either';
import {
  UserAuthorization,
  UserRole,
} from '../../enterprise/entities/user-authorization';

/**
 * Repository interface for UserAuthorization aggregate
 *
 * Handles all persistence operations related to user permissions,
 * roles and access control.
 */
export abstract class IUserAuthorizationRepository {
  /**
   * Find authorization by identity ID
   */
  abstract findByIdentityId(
    identityId: string,
  ): Promise<Either<Error, UserAuthorization | null>>;

  /**
   * Find authorization by ID
   */
  abstract findById(
    id: string,
  ): Promise<Either<Error, UserAuthorization | null>>;

  /**
   * Find all authorizations by role
   */
  abstract findByRole(
    role: UserRole,
  ): Promise<Either<Error, UserAuthorization[]>>;

  /**
   * Find active authorizations (within effective dates)
   */
  abstract findActive(): Promise<Either<Error, UserAuthorization[]>>;

  /**
   * Find expired authorizations
   */
  abstract findExpired(): Promise<Either<Error, UserAuthorization[]>>;

  /**
   * Save or update authorization
   */
  abstract save(authorization: UserAuthorization): Promise<Either<Error, void>>;

  /**
   * Delete authorization
   */
  abstract delete(id: string): Promise<Either<Error, void>>;
}
