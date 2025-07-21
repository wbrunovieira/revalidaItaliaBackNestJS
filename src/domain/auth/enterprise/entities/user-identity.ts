import { Optional } from '@/core/types/optional';
import { Email } from '../value-objects/email.vo';
import { Password } from '../value-objects/password.vo';
import { Entity } from '@/core/entity';
import { UniqueEntityID } from '@/core/unique-entity-id';

export interface UserIdentityProps {
  email: Email;
  password: Password;
  emailVerified: boolean;
  emailVerificationToken?: string | null;
  lastLogin?: Date | null;
  failedLoginAttempts: number;
  lockedUntil?: Date | null;
  passwordResetToken?: string | null;
  passwordResetExpiry?: Date | null;
  createdAt: Date;
  updatedAt?: Date | null;
}

export class UserIdentity extends Entity<UserIdentityProps> {
  get email() {
    return this.props.email;
  }

  get password() {
    return this.props.password;
  }

  get emailVerified() {
    return this.props.emailVerified;
  }

  get emailVerificationToken() {
    return this.props.emailVerificationToken;
  }

  get lastLogin() {
    return this.props.lastLogin;
  }

  get failedLoginAttempts() {
    return this.props.failedLoginAttempts;
  }

  get lockedUntil() {
    return this.props.lockedUntil;
  }

  get passwordResetToken() {
    return this.props.passwordResetToken;
  }

  get passwordResetExpiry() {
    return this.props.passwordResetExpiry;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  get isLocked(): boolean {
    if (!this.lockedUntil) return false;
    return this.lockedUntil > new Date();
  }

  updateLastLogin() {
    this.props.lastLogin = new Date();
    this.props.failedLoginAttempts = 0;
    this.touch();
  }

  incrementFailedLoginAttempts() {
    this.props.failedLoginAttempts++;
    if (this.props.failedLoginAttempts >= 5) {
      this.lockAccount();
    }
    this.touch();
  }

  lockAccount(minutes = 30) {
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutes);
    this.props.lockedUntil = now;
    this.touch();
  }

  unlockAccount() {
    this.props.lockedUntil = null;
    this.props.failedLoginAttempts = 0;
    this.touch();
  }

  verifyEmail() {
    this.props.emailVerified = true;
    this.props.emailVerificationToken = null;
    this.touch();
  }

  setEmailVerificationToken(token: string) {
    this.props.emailVerificationToken = token;
    this.touch();
  }

  setPasswordResetToken(token: string, expiryMinutes = 60) {
    this.props.passwordResetToken = token;
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + expiryMinutes);
    this.props.passwordResetExpiry = expiry;
    this.touch();
  }

  clearPasswordResetToken() {
    this.props.passwordResetToken = null;
    this.props.passwordResetExpiry = null;
    this.touch();
  }

  isPasswordResetTokenValid(): boolean {
    if (!this.passwordResetToken || !this.passwordResetExpiry) return false;
    return this.passwordResetExpiry > new Date();
  }

  changePassword(newPassword: Password) {
    this.props.password = newPassword;
    this.clearPasswordResetToken();
    this.touch();
  }

  changeEmail(newEmail: Email) {
    this.props.email = newEmail;
    this.props.emailVerified = false;
    this.touch();
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      UserIdentityProps,
      'createdAt' | 'failedLoginAttempts' | 'emailVerified'
    >,
    id?: UniqueEntityID,
  ) {
    const userIdentity = new UserIdentity(
      {
        ...props,
        emailVerified: props.emailVerified ?? false,
        failedLoginAttempts: props.failedLoginAttempts ?? 0,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );

    return userIdentity;
  }
}
