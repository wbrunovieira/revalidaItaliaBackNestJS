// src/domain/auth/application/read-models/user-aggregated-view.ts

/**
 * Read model that aggregates data from UserIdentity, UserProfile, and UserAuthorization
 * for efficient querying across the separated aggregates.
 * 
 * This is a denormalized view optimized for read operations.
 */
export interface UserAggregatedView {
  // Identity fields
  id: string;
  email: string;
  emailVerified: boolean;
  lastLogin?: Date | null;
  
  // Profile fields
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
  
  // Authorization fields
  role: 'admin' | 'tutor' | 'student';
  customPermissions: Array<{ resource: string; action: string }>;
  restrictions: Array<{ resource: string; reason: string }>;
  isActive: boolean;
  
  // Aggregated metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface UserAggregatedViewCriteria {
  // Search filters
  searchTerm?: string; // searches in email, name, nationalId
  email?: string;
  emailContains?: string;
  name?: string;
  nameContains?: string;
  nationalId?: string;
  nationalIdContains?: string;
  
  // Role filters
  roles?: Array<'admin' | 'tutor' | 'student'>;
  
  // Activity filters
  lastLoginAfter?: Date;
  lastLoginBefore?: Date;
  isActive?: boolean;
  
  // Date filters
  createdAfter?: Date;
  createdBefore?: Date;
  
  // Pagination
  page?: number;
  pageSize?: number;
  
  // Sorting
  orderBy?: 'name' | 'email' | 'createdAt' | 'lastLogin' | 'role';
  orderDirection?: 'asc' | 'desc';
}

export interface UserAggregatedViewRepository {
  /**
   * Find users matching the given criteria
   */
  findByCriteria(criteria: UserAggregatedViewCriteria): Promise<{
    users: UserAggregatedView[];
    total: number;
    page: number;
    pageSize: number;
  }>;
  
  /**
   * Find a single user by identity ID
   */
  findById(identityId: string): Promise<UserAggregatedView | null>;
  
  /**
   * Rebuild the view from the source aggregates
   * This should be called when data changes in any of the source aggregates
   */
  rebuild(identityId: string): Promise<void>;
  
  /**
   * Remove a user from the view
   */
  remove(identityId: string): Promise<void>;
}