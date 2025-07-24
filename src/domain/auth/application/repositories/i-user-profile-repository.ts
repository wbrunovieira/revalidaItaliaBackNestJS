import { Either } from '@/core/either';
import { UserProfile } from '../../enterprise/entities/user-profile';
import { NationalId } from '../../enterprise/value-objects/national-id.vo';
import { UserProfileCriteria } from '../criteria/user-profile-criteria';

/**
 * Repository interface for UserProfile aggregate
 *
 * Handles all persistence operations related to user profile data
 * and personal information management.
 */
export abstract class IUserProfileRepository {
  /**
   * Find a user profile by identity ID
   */
  abstract findByIdentityId(
    identityId: string,
  ): Promise<Either<Error, UserProfile | null>>;

  /**
   * Find a user profile by ID
   */
  abstract findById(id: string): Promise<Either<Error, UserProfile | null>>;

  /**
   * Find a user profile by national ID
   */
  abstract findByNationalId(
    nationalId: NationalId,
  ): Promise<Either<Error, UserProfile | null>>;

  /**
   * Check if national ID already exists
   */
  abstract nationalIdExists(
    nationalId: NationalId,
  ): Promise<Either<Error, boolean>>;

  /**
   * Find profiles by criteria (for complex queries)
   */
  abstract findByCriteria(
    criteria: UserProfileCriteria,
  ): Promise<Either<Error, UserProfile[]>>;

  /**
   * Count profiles by criteria
   */
  abstract countByCriteria(
    criteria: UserProfileCriteria,
  ): Promise<Either<Error, number>>;

  /**
   * Save or update user profile
   */
  abstract save(userProfile: UserProfile): Promise<Either<Error, void>>;

  /**
   * Delete user profile
   */
  abstract delete(id: string): Promise<Either<Error, void>>;
}
