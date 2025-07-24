// src/infra/database/prisma/repositories/prisma-user-authorization-repository.ts
import { Injectable } from '@nestjs/common';

import { IUserAuthorizationRepository } from '@/domain/auth/application/repositories/i-user-authorization-repository';
import {
  UserAuthorization,
  UserRole,
} from '@/domain/auth/enterprise/entities/user-authorization';
import { Either, left, right } from '@/core/either';
import { UserAuthorizationMapper } from '@/domain/auth/application/mappers/user-authorization.mapper';
import { UserRole as PrismaUserRole } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class PrismaUserAuthorizationRepository
  implements IUserAuthorizationRepository
{
  constructor(private prisma: PrismaService) {}

  async findByIdentityId(
    identityId: string,
  ): Promise<Either<Error, UserAuthorization | null>> {
    try {
      const authorization = await this.prisma.userAuthorization.findUnique({
        where: { identityId },
      });

      if (!authorization) {
        return right(null);
      }

      return right(UserAuthorizationMapper.toDomain(authorization));
    } catch (error) {
      return left(
        new Error(`Failed to find authorization by identity id: ${error}`),
      );
    }
  }

  async findById(id: string): Promise<Either<Error, UserAuthorization | null>> {
    try {
      const authorization = await this.prisma.userAuthorization.findUnique({
        where: { id },
      });

      if (!authorization) {
        return right(null);
      }

      return right(UserAuthorizationMapper.toDomain(authorization));
    } catch (error) {
      return left(new Error(`Failed to find authorization by id: ${error}`));
    }
  }

  async findByRole(
    role: UserRole,
  ): Promise<Either<Error, UserAuthorization[]>> {
    try {
      const prismaRole = this.mapRoleToPrismaRole(role);
      const authorizations = await this.prisma.userAuthorization.findMany({
        where: { role: prismaRole },
      });

      return right(authorizations.map(UserAuthorizationMapper.toDomain));
    } catch (error) {
      return left(new Error(`Failed to find authorizations by role: ${error}`));
    }
  }

  async findActive(): Promise<Either<Error, UserAuthorization[]>> {
    try {
      const now = new Date();
      const authorizations = await this.prisma.userAuthorization.findMany({
        where: {
          effectiveFrom: { lte: now },
          OR: [{ effectiveUntil: null }, { effectiveUntil: { gt: now } }],
        },
      });

      return right(authorizations.map(UserAuthorizationMapper.toDomain));
    } catch (error) {
      return left(new Error(`Failed to find active authorizations: ${error}`));
    }
  }

  async findExpired(): Promise<Either<Error, UserAuthorization[]>> {
    try {
      const now = new Date();
      const authorizations = await this.prisma.userAuthorization.findMany({
        where: {
          effectiveUntil: { lt: now },
        },
      });

      return right(authorizations.map(UserAuthorizationMapper.toDomain));
    } catch (error) {
      return left(new Error(`Failed to find expired authorizations: ${error}`));
    }
  }

  async save(authorization: UserAuthorization): Promise<Either<Error, void>> {
    try {
      const data = UserAuthorizationMapper.toPersistence(authorization);

      // Prepare update data, filtering out null values
      const updateData: any = {
        role: data.role,
        customPermissions: data.customPermissions,
        restrictions: data.restrictions,
        effectiveFrom: data.effectiveFrom,
        updatedAt: data.updatedAt,
      };

      // Only include effectiveUntil if it's not null
      if (data.effectiveUntil !== null) {
        updateData.effectiveUntil = data.effectiveUntil;
      }

      // Prepare create data, filtering out null/undefined values
      const createData: any = {
        id: data.id,
        identityId: data.identityId,
        role: data.role,
        customPermissions: data.customPermissions,
        restrictions: data.restrictions,
        effectiveFrom: data.effectiveFrom,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };

      // Only include effectiveUntil if it's not null
      if (data.effectiveUntil !== null && data.effectiveUntil !== undefined) {
        createData.effectiveUntil = data.effectiveUntil;
      }

      await this.prisma.userAuthorization.upsert({
        where: { id: data.id },
        update: updateData,
        create: createData,
      });

      return right(undefined);
    } catch (error) {
      return left(new Error(`Failed to save authorization: ${error}`));
    }
  }

  async delete(id: string): Promise<Either<Error, void>> {
    try {
      await this.prisma.userAuthorization.delete({
        where: { id },
      });

      return right(undefined);
    } catch (error) {
      return left(new Error(`Failed to delete authorization: ${error}`));
    }
  }

  private mapRoleToPrismaRole(role: UserRole): PrismaUserRole {
    const roleMap: Record<UserRole, PrismaUserRole> = {
      admin: 'admin',
      tutor: 'tutor',
      student: 'student',
    };
    return roleMap[role];
  }
}
