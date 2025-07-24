import { Entity } from '@/core/entity';
import { UniqueEntityID } from '@/core/unique-entity-id';
import { Optional } from '@/core/types/optional';
import { InvalidRoleException } from '@/domain/auth/domain/exceptions/invalid-role.exception';

export type UserRole = 'admin' | 'tutor' | 'student';

export interface Permission {
  resource: string;
  action: string;
}

export interface Restriction {
  resource: string;
  reason: string;
}

export interface UserAuthorizationProps {
  identityId: UniqueEntityID;
  role: UserRole;
  customPermissions: Permission[];
  restrictions: Restriction[];
  effectiveFrom: Date;
  effectiveUntil?: Date | null;
  createdAt: Date;
  updatedAt?: Date | null;
}

export class UserAuthorization extends Entity<UserAuthorizationProps> {
  get identityId() {
    return this.props.identityId;
  }

  get role() {
    return this.props.role;
  }

  set role(role: UserRole) {
    this.props.role = role;
    this.touch();
  }

  get customPermissions() {
    return this.props.customPermissions;
  }

  get restrictions() {
    return this.props.restrictions;
  }

  get effectiveFrom() {
    return this.props.effectiveFrom;
  }

  get effectiveUntil() {
    return this.props.effectiveUntil;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  get isActive(): boolean {
    const now = new Date();
    
    if (now < this.effectiveFrom) return false;
    if (this.effectiveUntil && now > this.effectiveUntil) return false;
    
    return true;
  }

  get isAdmin(): boolean {
    return this.role === 'admin';
  }

  get isTutor(): boolean {
    return this.role === 'tutor';
  }

  get isStudent(): boolean {
    return this.role === 'student';
  }

  hasPermission(resource: string, action: string): boolean {
    // Check if restricted
    const isRestricted = this.restrictions.some(
      r => r.resource === resource || r.resource === '*'
    );
    if (isRestricted) return false;

    // Admin has all permissions
    if (this.isAdmin) return true;

    // Check custom permissions
    return this.customPermissions.some(
      p => (p.resource === resource || p.resource === '*') && 
           (p.action === action || p.action === '*')
    );
  }

  addPermission(permission: Permission) {
    const exists = this.customPermissions.some(
      p => p.resource === permission.resource && p.action === permission.action
    );
    
    if (!exists) {
      this.props.customPermissions.push(permission);
      this.touch();
    }
  }

  removePermission(resource: string, action: string) {
    this.props.customPermissions = this.customPermissions.filter(
      p => !(p.resource === resource && p.action === action)
    );
    this.touch();
  }

  addRestriction(restriction: Restriction) {
    const exists = this.restrictions.some(
      r => r.resource === restriction.resource
    );
    
    if (!exists) {
      this.props.restrictions.push(restriction);
      this.touch();
    }
  }

  removeRestriction(resource: string) {
    this.props.restrictions = this.restrictions.filter(
      r => r.resource !== resource
    );
    this.touch();
  }

  setExpiry(date: Date | null) {
    this.props.effectiveUntil = date;
    this.touch();
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<UserAuthorizationProps, 'createdAt' | 'effectiveFrom' | 'customPermissions' | 'restrictions'>,
    id?: UniqueEntityID,
  ) {
    // Validate role
    const validRoles: UserRole[] = ['admin', 'tutor', 'student'];
    if (!validRoles.includes(props.role)) {
      throw new InvalidRoleException(props.role, validRoles);
    }

    const userAuthorization = new UserAuthorization(
      {
        ...props,
        customPermissions: props.customPermissions ?? [],
        restrictions: props.restrictions ?? [],
        effectiveFrom: props.effectiveFrom ?? new Date(),
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );

    return userAuthorization;
  }
}