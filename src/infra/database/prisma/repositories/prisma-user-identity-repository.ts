import { Injectable } from '@nestjs/common';

import { IUserIdentityRepository } from '@/domain/auth/application/repositories/i-user-identity-repository';
import { UserIdentity } from '@/domain/auth/enterprise/entities/user-identity';
import { Email } from '@/domain/auth/enterprise/value-objects/email.vo';
import { Either, left, right } from '@/core/either';
import { UserIdentityMapper } from '@/domain/auth/application/mappers/user-identity.mapper';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class PrismaUserIdentityRepository implements IUserIdentityRepository {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: Email): Promise<Either<Error, UserIdentity | null>> {
    try {
      const userIdentity = await this.prisma.userIdentity.findUnique({
        where: { email: email.value },
      });

      if (!userIdentity) {
        return right(null);
      }

      return right(UserIdentityMapper.toDomain(userIdentity));
    } catch (error) {
      return left(new Error(`Failed to find user identity by email: ${error}`));
    }
  }

  async findById(id: string): Promise<Either<Error, UserIdentity | null>> {
    try {
      const userIdentity = await this.prisma.userIdentity.findUnique({
        where: { id },
      });

      if (!userIdentity) {
        return right(null);
      }

      return right(UserIdentityMapper.toDomain(userIdentity));
    } catch (error) {
      return left(new Error(`Failed to find user identity by id: ${error}`));
    }
  }

  async findByEmailVerificationToken(
    token: string,
  ): Promise<Either<Error, UserIdentity | null>> {
    try {
      const userIdentity = await this.prisma.userIdentity.findFirst({
        where: { emailVerificationToken: token },
      });

      if (!userIdentity) {
        return right(null);
      }

      return right(UserIdentityMapper.toDomain(userIdentity));
    } catch (error) {
      return left(
        new Error(
          `Failed to find user identity by email verification token: ${error}`,
        ),
      );
    }
  }

  async findByPasswordResetToken(
    token: string,
  ): Promise<Either<Error, UserIdentity | null>> {
    try {
      const userIdentity = await this.prisma.userIdentity.findFirst({
        where: {
          passwordResetToken: token,
          passwordResetExpiry: {
            gt: new Date(), // Token must not be expired
          },
        },
      });

      if (!userIdentity) {
        return right(null);
      }

      return right(UserIdentityMapper.toDomain(userIdentity));
    } catch (error) {
      return left(
        new Error(
          `Failed to find user identity by password reset token: ${error}`,
        ),
      );
    }
  }

  async emailExists(email: Email): Promise<Either<Error, boolean>> {
    try {
      const count = await this.prisma.userIdentity.count({
        where: { email: email.value },
      });

      return right(count > 0);
    } catch (error) {
      return left(new Error(`Failed to check if email exists: ${error}`));
    }
  }

  async save(userIdentity: UserIdentity): Promise<Either<Error, void>> {
    try {
      const data = UserIdentityMapper.toPersistence(userIdentity);

      // Prepare update data, filtering out null values
      const updateData: any = {
        email: data.email,
        password: data.password,
        emailVerified: data.emailVerified,
        failedLoginAttempts: data.failedLoginAttempts,
        updatedAt: data.updatedAt,
      };
      
      // Add optional fields only if they're not null
      if (data.emailVerificationToken !== null) {
        updateData.emailVerificationToken = data.emailVerificationToken;
      }
      if (data.lastLogin !== null) {
        updateData.lastLogin = data.lastLogin;
      }
      if (data.lockedUntil !== null) {
        updateData.lockedUntil = data.lockedUntil;
      }
      if (data.passwordResetToken !== null) {
        updateData.passwordResetToken = data.passwordResetToken;
      }
      if (data.passwordResetExpiry !== null) {
        updateData.passwordResetExpiry = data.passwordResetExpiry;
      }

      // Prepare create data
      const createData: any = {
        id: data.id,
        email: data.email,
        password: data.password,
        emailVerified: data.emailVerified,
        failedLoginAttempts: data.failedLoginAttempts,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
      
      // Add optional fields only if they're not null/undefined
      if (data.emailVerificationToken !== null && data.emailVerificationToken !== undefined) {
        createData.emailVerificationToken = data.emailVerificationToken;
      }
      if (data.lastLogin !== null && data.lastLogin !== undefined) {
        createData.lastLogin = data.lastLogin;
      }
      if (data.lockedUntil !== null && data.lockedUntil !== undefined) {
        createData.lockedUntil = data.lockedUntil;
      }
      if (data.passwordResetToken !== null && data.passwordResetToken !== undefined) {
        createData.passwordResetToken = data.passwordResetToken;
      }
      if (data.passwordResetExpiry !== null && data.passwordResetExpiry !== undefined) {
        createData.passwordResetExpiry = data.passwordResetExpiry;
      }

      await this.prisma.userIdentity.upsert({
        where: { id: data.id },
        update: updateData,
        create: createData,
      });

      return right(undefined);
    } catch (error) {
      return left(new Error(`Failed to save user identity: ${error}`));
    }
  }

  async delete(id: string): Promise<Either<Error, void>> {
    try {
      await this.prisma.userIdentity.delete({
        where: { id },
      });

      return right(undefined);
    } catch (error) {
      return left(new Error(`Failed to delete user identity: ${error}`));
    }
  }
}
