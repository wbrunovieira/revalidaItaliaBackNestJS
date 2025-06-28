// src/domain/auth/enterprise/entities/user.entity.ts
import { Entity } from '@/core/entity';
import { Optional } from '@/core/types/optional';
import { UniqueEntityID } from '@/core/unique-entity-id';

export interface UserProps {
  name: string;
  email: string;
  password: string;
  cpf: string;
  phone?: string;
  paymentToken?: string | null;
  birthDate?: Date;
  lastLogin?: Date;
  profileImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  role: 'admin' | 'tutor' | 'student';
}

export class User extends Entity<UserProps> {
  toResponseObject(): Omit<UserProps, 'password'> & { id: string } {
    const { password, ...rest } = this.props;
    return { id: this.id.toString(), ...(rest as any) };
  }

  get email(): string {
    return this.props.email;
  }

  get profileImageUrl(): string | undefined {
    return this.props.profileImageUrl;
  }

  get cpf(): string {
    return this.props.cpf;
  }

  get name(): string {
    return this.props.name;
  }

  get role(): UserProps['role'] {
    return this.props.role;
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

  get password(): string {
    return this.props.password;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  public updateProfile(updates: {
    name?: string;
    email?: string;
    cpf?: string;
    role?: UserProps['role'];
    phone?: string;
    profileImageUrl?: string;
  }) {
    if (updates.name !== undefined) {
      this.props.name = updates.name;
      this.touch();
    }
    if (updates.email !== undefined) {
      this.props.email = updates.email;
      this.touch();
    }
    if (updates.cpf !== undefined) {
      this.props.cpf = updates.cpf;
      this.touch();
    }
    if (updates.role !== undefined) {
      this.props.role = updates.role;
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
  }

  public updateLoginInfo(lastLogin: Date) {
    this.props.lastLogin = lastLogin;
    this.touch();
  }

  public updatePaymentToken(paymentToken: string | null) {
    this.props.paymentToken = paymentToken;
    this.touch();
  }

  public static create(
    props: Optional<UserProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ) {
    const now = new Date();
    return new User(
      {
        ...props,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }
}
