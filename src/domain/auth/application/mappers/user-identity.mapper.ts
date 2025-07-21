import { UserIdentity as PrismaUserIdentity } from '@prisma/client';
import { UserIdentity } from '../../enterprise/entities/user-identity';
import { Email } from '../../enterprise/value-objects/email.vo';
import { Password } from '../../enterprise/value-objects/password.vo';
import { UniqueEntityID } from '@/core/unique-entity-id';

export class UserIdentityMapper {
  static toDomain(raw: PrismaUserIdentity): UserIdentity {
    return UserIdentity.create(
      {
        email: Email.createFromTrustedSource(raw.email),
        password: Password.createFromHash(raw.password),
        emailVerified: raw.emailVerified,
        emailVerificationToken: raw.emailVerificationToken,
        lastLogin: raw.lastLogin,
        failedLoginAttempts: raw.failedLoginAttempts,
        lockedUntil: raw.lockedUntil,
        passwordResetToken: raw.passwordResetToken,
        passwordResetExpiry: raw.passwordResetExpiry,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityID(raw.id),
    );
  }

  static toPersistence(userIdentity: UserIdentity) {
    return {
      id: userIdentity.id.toString(),
      email: userIdentity.email.value,
      password: userIdentity.password.value,
      emailVerified: userIdentity.emailVerified,
      emailVerificationToken: userIdentity.emailVerificationToken,
      lastLogin: userIdentity.lastLogin,
      failedLoginAttempts: userIdentity.failedLoginAttempts,
      lockedUntil: userIdentity.lockedUntil,
      passwordResetToken: userIdentity.passwordResetToken,
      passwordResetExpiry: userIdentity.passwordResetExpiry,
      createdAt: userIdentity.createdAt,
      updatedAt: userIdentity.updatedAt,
    };
  }
}