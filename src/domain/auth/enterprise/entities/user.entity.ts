// src/domain/auth/enterprise/entities/user.entity.ts
import { AggregateRoot } from '@/core/domain/aggregate-root';
import { Optional } from '@/core/types/optional';
import { UniqueEntityID } from '@/core/unique-entity-id';

import { UserCreatedEvent, UserCreationSource } from '../events/user-created.event';
import { UserRole, UserRoleType } from '../value-objects/user-role.vo';
import { Email } from '../value-objects/email.vo';
import { NationalId } from '../value-objects/national-id.vo';

// =====================================
// = Interfaces
// =====================================

/**
 * Internal props - uses Value Objects
 */
interface UserProps {
  name: string;
  email: Email;
  password: string;
  nationalId: NationalId;
  phone?: string;
  paymentToken?: string | null;
  birthDate?: Date;
  lastLogin?: Date;
  profileImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  role: UserRole;
}

/**
 * Props for creation - receives primitives
 */
export interface CreateUserProps {
  name: string;
  email: string;
  password: string;
  nationalId: string;
  phone?: string;
  paymentToken?: string | null;
  birthDate?: Date;
  lastLogin?: Date;
  profileImageUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
  role: UserRoleType;
}

// =====================================
// = Entity
// =====================================

/**
 * User Aggregate Root
 * 
 * Central entity in the Auth bounded context.
 * Manages user identity, authentication, and authorization.
 */
export class User extends AggregateRoot<UserProps> {
  // ===== Response Methods =====
  
  toResponseObject(): Omit<CreateUserProps, 'password'> & { id: string } {
    const { password, role, email, nationalId, ...rest } = this.props;
    return { 
      id: this.id.toString(), 
      ...rest,
      email: email.value,
      nationalId: nationalId.value,
      role: role.value 
    };
  }

  // ===== Getters =====
  
  get name(): string {
    return this.props.name;
  }

  get email(): Email {
    return this.props.email;
  }

  get nationalId(): NationalId {
    return this.props.nationalId;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get password(): string {
    return this.props.password;
  }

  get phone(): string | undefined {
    return this.props.phone;
  }

  get paymentToken(): string | null | undefined {
    return this.props.paymentToken;
  }

  get birthDate(): Date | undefined {
    return this.props.birthDate;
  }

  get lastLogin(): Date | undefined {
    return this.props.lastLogin;
  }

  get profileImageUrl(): string | undefined {
    return this.props.profileImageUrl;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // ===== Private Methods =====
  
  private touch() {
    this.props.updatedAt = new Date();
  }

  // ===== Public Methods =====
  
  /**
   * Update user profile information
   */
  public updateProfile(updates: {
    name?: string;
    email?: string;
    nationalId?: string;
    role?: UserRoleType;
    phone?: string;
    profileImageUrl?: string;
    birthDate?: Date;
  }) {
    if (updates.name !== undefined) {
      this.props.name = updates.name;
      this.touch();
    }
    if (updates.email !== undefined) {
      this.props.email = Email.create(updates.email);
      this.touch();
    }
    if (updates.nationalId !== undefined) {
      this.props.nationalId = NationalId.create(updates.nationalId);
      this.touch();
    }
    if (updates.role !== undefined) {
      this.props.role = UserRole.create(updates.role);
      this.touch();
    }
    if (updates.phone !== undefined) {
      this.props.phone = updates.phone;
      this.touch();
    }
    if (updates.profileImageUrl !== undefined) {
      this.props.profileImageUrl = updates.profileImageUrl;
      this.touch();
    }
    if (updates.birthDate !== undefined) {
      this.props.birthDate = updates.birthDate;
      this.touch();
    }
  }

  /**
   * Update user last login timestamp
   */
  public updateLoginInfo(lastLogin: Date) {
    this.props.lastLogin = lastLogin;
    this.touch();
  }

  /**
   * Update user payment token
   */
  public updatePaymentToken(paymentToken: string | null) {
    this.props.paymentToken = paymentToken;
    this.touch();
  }

  // ===== Static Factory Methods =====
  
  /**
   * Create a new User entity
   */
  public static create(
    props: Optional<CreateUserProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
    source: UserCreationSource = 'api',
  ) {
    const now = new Date();
    
    // Convert primitives to Value Objects
    const userProps: UserProps = {
      ...props,
      email: Email.create(props.email),
      nationalId: NationalId.create(props.nationalId),
      role: UserRole.create(props.role),
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now,
    };
    
    const user = new User(userProps, id);

    // Add domain event for new users
    const isNewUser = !id;
    if (isNewUser) {
      user.addDomainEvent(new UserCreatedEvent(user, source));
    }

    return user;
  }
}