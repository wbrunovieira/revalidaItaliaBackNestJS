// src/domain/auth/enterprise/value-objects/user-role.vo.ts

// =====================================
// = Types
// =====================================

export type UserRoleType = 'admin' | 'tutor' | 'student';

// =====================================
// = Constants
// =====================================

const VALID_ROLES: UserRoleType[] = ['admin', 'tutor', 'student'];

// =====================================
// = Value Object
// =====================================

/**
 * UserRole Value Object
 *
 * Centralizes all permission rules for different roles.
 * Used by Guards to enforce access control.
 *
 * @example
 * const role = UserRole.create('admin');
 * console.log(role.canCreateUsers());     // true
 * console.log(role.canManageContent());   // true
 * console.log(role.canViewStatistics());  // true
 */
export class UserRole {
  constructor(public readonly value: UserRoleType) {
    this.validate();
  }

  // ===== Private Methods =====

  private validate(): void {
    if (!VALID_ROLES.includes(this.value)) {
      throw new Error(`Invalid role: ${this.value}`);
    }
  }

  // ===== Public Getters =====

  /**
   * Check if role is admin
   */
  get isAdmin(): boolean {
    return this.value === 'admin';
  }

  /**
   * Check if role is tutor
   */
  get isTutor(): boolean {
    return this.value === 'tutor';
  }

  /**
   * Check if role is student
   */
  get isStudent(): boolean {
    return this.value === 'student';
  }

  // ===== User Management Permissions =====

  /**
   * Can create new users
   */
  canCreateUsers(): boolean {
    return this.isAdmin;
  }

  /**
   * Can list all users
   */
  canListUsers(): boolean {
    return this.isAdmin;
  }

  /**
   * Can view a specific user
   * @param targetUserId ID of user to view
   * @param currentUserId ID of current user
   */
  canViewUser(targetUserId: string, currentUserId: string): boolean {
    // Admin can view anyone
    if (this.isAdmin) return true;

    // Users can view themselves
    return targetUserId === currentUserId;
  }

  /**
   * Can update a specific user
   * @param targetUserId ID of user to update
   * @param currentUserId ID of current user
   */
  canUpdateUser(targetUserId: string, currentUserId: string): boolean {
    // Admin can update anyone
    if (this.isAdmin) return true;

    // Users can update themselves
    return targetUserId === currentUserId;
  }

  /**
   * Can delete users
   */
  canDeleteUsers(): boolean {
    return this.isAdmin;
  }

  // ===== Content Management Permissions =====

  /**
   * Can create new courses
   */
  canCreateCourses(): boolean {
    return this.isAdmin || this.isTutor;
  }

  /**
   * Can update existing courses
   */
  canUpdateCourses(): boolean {
    return this.isAdmin || this.isTutor;
  }

  /**
   * Can delete courses
   */
  canDeleteCourses(): boolean {
    return this.isAdmin || this.isTutor;
  }

  /**
   * Can view course details
   */
  canViewCourses(): boolean {
    return true; // All roles can view courses
  }

  /**
   * Can list all courses
   */
  canListCourses(): boolean {
    return true; // All roles can list courses
  }

  /**
   * General content management permission
   * Applies to: tracks, modules, lessons, videos, documents
   */
  canManageContent(): boolean {
    return this.isAdmin || this.isTutor;
  }

  // ===== Assessment Management Permissions =====

  /**
   * Can create new assessments
   */
  canCreateAssessments(): boolean {
    return this.isAdmin || this.isTutor;
  }

  /**
   * Can update existing assessments
   */
  canUpdateAssessments(): boolean {
    return this.isAdmin || this.isTutor;
  }

  /**
   * Can delete assessments
   */
  canDeleteAssessments(): boolean {
    return this.isAdmin || this.isTutor;
  }

  /**
   * Can view assessment details
   */
  canViewAssessments(): boolean {
    return true; // All can view
  }

  // ===== Question Management Permissions =====

  /**
   * Can manage questions (create, update, delete)
   */
  canManageQuestions(): boolean {
    return this.isAdmin || this.isTutor;
  }

  /**
   * Can manage question options
   */
  canManageQuestionOptions(): boolean {
    return this.isAdmin || this.isTutor;
  }

  // ===== Answer/Review Management Permissions =====

  /**
   * Can review and grade answers
   */
  canReviewAnswers(): boolean {
    return this.isAdmin || this.isTutor;
  }

  /**
   * Can view own submitted answers
   */
  canViewOwnAnswers(): boolean {
    return true; // All can view their own answers
  }

  // ===== Flashcard Management Permissions =====

  /**
   * Can manage flashcards (create, update, delete)
   */
  canManageFlashcards(): boolean {
    return this.isAdmin || this.isTutor;
  }

  /**
   * Can view flashcards
   */
  canViewFlashcards(): boolean {
    return true; // All can view flashcards
  }

  // ===== Argument Management Permissions =====

  /**
   * Can manage arguments (create, update, delete)
   */
  canManageArguments(): boolean {
    return this.isAdmin || this.isTutor;
  }

  /**
   * Can view arguments
   */
  canViewArguments(): boolean {
    return true; // All can view arguments
  }

  // ===== Admin Panel Permissions =====

  /**
   * Can access the admin panel
   */
  canAccessAdminPanel(): boolean {
    return this.isAdmin;
  }

  /**
   * Can view system statistics
   */
  canViewStatistics(): boolean {
    return this.isAdmin;
  }

  /**
   * Can manage system settings
   */
  canManageSystem(): boolean {
    return this.isAdmin;
  }

  // ===== Public Methods =====

  /**
   * Check equality with another UserRole
   */
  equals(other: UserRole): boolean {
    return this.value === other.value;
  }

  /**
   * String representation
   */
  toString(): string {
    return this.value;
  }

  // ===== Static Factory Methods =====

  /**
   * Create a UserRole instance
   * @param role The role type to create
   * @returns UserRole instance or throws error if invalid
   */
  static create(role: UserRoleType): UserRole {
    return new UserRole(role);
  }
}
