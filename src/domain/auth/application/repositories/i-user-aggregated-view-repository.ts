import { Either } from '@/core/either';
import { UserProfileCriteria } from '../criteria/user-profile-criteria';

/**
 * User data from multiple aggregates combined for read operations
 * This is a read model for CQRS pattern
 */
export interface UserAggregatedView {
  // From UserIdentity
  identityId: string;
  email: string;
  emailVerified: boolean;
  lastLogin?: Date | null;
  lockedUntil?: Date | null;

  // From UserProfile
  profileId: string;
  fullName: string;
  nationalId: string;
  phone?: string | null;
  birthDate?: Date | null;
  profileImageUrl?: string | null;
  bio?: string | null;
  profession?: string | null;
  specialization?: string | null;
  preferredLanguage: string;
  timezone: string;

  // From UserAuthorization
  authorizationId: string;
  role: string;
  isActive: boolean;

  // Metadata
  createdAt: Date;
  updatedAt?: Date | null;
}

/**
 * Repository interface for aggregated user views
 *
 * This is used for read operations that need data from multiple aggregates.
 * Implements the Query side of CQRS pattern.
 */
export abstract class IUserAggregatedViewRepository {
  /**
   * Find user view by identity ID
   */
  abstract findByIdentityId(
    identityId: string,
  ): Promise<Either<Error, UserAggregatedView | null>>;

  /**
   * Find user view by email
   */
  abstract findByEmail(
    email: string,
  ): Promise<Either<Error, UserAggregatedView | null>>;

  /**
   * Find user view by national ID
   */
  abstract findByNationalId(
    nationalId: string,
  ): Promise<Either<Error, UserAggregatedView | null>>;

  /**
   * Find multiple users by criteria
   */
  abstract findByCriteria(
    criteria: UserProfileCriteria,
  ): Promise<Either<Error, UserAggregatedView[]>>;

  /**
   * Count users by criteria
   */
  abstract countByCriteria(
    criteria: UserProfileCriteria,
  ): Promise<Either<Error, number>>;

  /**
   * Find users for listing (pagination included)
   */
  abstract findForListing(params: {
    page: number;
    limit: number;
    search?: string;
    role?: string;
    profession?: string;
    orderBy?: string;
    order?: 'asc' | 'desc';
  }): Promise<
    Either<
      Error,
      {
        items: UserAggregatedView[];
        total: number;
        page: number;
        limit: number;
      }
    >
  >;
}
