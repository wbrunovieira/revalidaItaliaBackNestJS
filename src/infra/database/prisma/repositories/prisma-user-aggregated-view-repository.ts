// src/infra/database/prisma/repositories/prisma-user-aggregated-view-repository.ts
import { Injectable } from '@nestjs/common';

import {
  IUserAggregatedViewRepository,
  UserAggregatedView,
} from '@/domain/auth/application/repositories/i-user-aggregated-view-repository';
import { UserProfileCriteria } from '@/domain/auth/application/criteria/user-profile-criteria';
import { Either, left, right } from '@/core/either';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class PrismaUserAggregatedViewRepository
  implements IUserAggregatedViewRepository
{
  constructor(private prisma: PrismaService) {}

  async findByIdentityId(
    identityId: string,
  ): Promise<Either<Error, UserAggregatedView | null>> {
    try {
      const result = await this.prisma.userIdentity.findUnique({
        where: { id: identityId },
        include: {
          profile: true,
          authorization: true,
        },
      });

      if (!result || !result.profile || !result.authorization) {
        return right(null);
      }

      return right(this.mapToView(result));
    } catch (error) {
      return left(
        new Error(`Failed to find user view by identity id: ${error}`),
      );
    }
  }

  async findByEmail(
    email: string,
  ): Promise<Either<Error, UserAggregatedView | null>> {
    try {
      const result = await this.prisma.userIdentity.findUnique({
        where: { email },
        include: {
          profile: true,
          authorization: true,
        },
      });

      if (!result || !result.profile || !result.authorization) {
        return right(null);
      }

      return right(this.mapToView(result));
    } catch (error) {
      return left(new Error(`Failed to find user view by email: ${error}`));
    }
  }

  async findByNationalId(
    nationalId: string,
  ): Promise<Either<Error, UserAggregatedView | null>> {
    try {
      const profile = await this.prisma.userProfile.findUnique({
        where: { nationalId },
        include: {
          identity: {
            include: {
              authorization: true,
            },
          },
        },
      });

      if (!profile || !profile.identity || !profile.identity.authorization) {
        return right(null);
      }

      return right(this.mapProfileToView(profile));
    } catch (error) {
      return left(
        new Error(`Failed to find user view by national id: ${error}`),
      );
    }
  }

  async findByCriteria(
    criteria: UserProfileCriteria,
  ): Promise<Either<Error, UserAggregatedView[]>> {
    try {
      const query = criteria.build();

      const profiles = await this.prisma.userProfile.findMany({
        ...query,
        include: {
          identity: {
            include: {
              authorization: true,
            },
          },
        },
      });

      const views = profiles
        .filter((p: any) => p.identity && p.identity.authorization)
        .map((p: any) => this.mapProfileToView(p));

      return right(views);
    } catch (error) {
      return left(new Error(`Failed to find user views by criteria: ${error}`));
    }
  }

  async countByCriteria(
    criteria: UserProfileCriteria,
  ): Promise<Either<Error, number>> {
    try {
      const query = criteria.build();
      const count = await this.prisma.userProfile.count({
        where: query.where,
      });

      return right(count);
    } catch (error) {
      return left(
        new Error(`Failed to count user views by criteria: ${error}`),
      );
    }
  }

  async findForListing(params: {
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
  > {
    try {
      const skip = (params.page - 1) * params.limit;

      const where: any = {};

      // Search filter
      if (params.search) {
        where.OR = [
          { fullName: { contains: params.search, mode: 'insensitive' } },
          {
            identity: {
              email: { contains: params.search, mode: 'insensitive' },
            },
          },
          { nationalId: { contains: params.search, mode: 'insensitive' } },
        ];
      }

      // Profession filter
      if (params.profession) {
        where.profession = params.profession;
      }

      // Role filter (through identity.authorization)
      if (params.role) {
        where.identity = {
          authorization: {
            role: params.role,
          },
        };
      }

      // Get total count
      const total = await this.prisma.userProfile.count({ where });

      // Get paginated results
      const profiles = await this.prisma.userProfile.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: {
          [params.orderBy || 'createdAt']: params.order || 'desc',
        },
        include: {
          identity: {
            include: {
              authorization: true,
            },
          },
        },
      });

      const items = profiles
        .filter((p: any) => p.identity && p.identity.authorization)
        .map((p: any) => this.mapProfileToView(p));

      return right({
        items,
        total,
        page: params.page,
        limit: params.limit,
      });
    } catch (error) {
      return left(new Error(`Failed to find user views for listing: ${error}`));
    }
  }

  private mapToView(data: any): UserAggregatedView {
    const now = new Date();
    const isActive =
      data.authorization.effectiveFrom <= now &&
      (!data.authorization.effectiveUntil ||
        data.authorization.effectiveUntil > now);

    return {
      identityId: data.id,
      email: data.email,
      emailVerified: data.emailVerified,
      lastLogin: data.lastLogin,
      lockedUntil: data.lockedUntil,
      profileId: data.profile.id,
      fullName: data.profile.fullName,
      nationalId: data.profile.nationalId,
      phone: data.profile.phone,
      birthDate: data.profile.birthDate,
      profileImageUrl: data.profile.profileImageUrl,
      bio: data.profile.bio,
      profession: data.profile.profession,
      specialization: data.profile.specialization,
      preferredLanguage: data.profile.preferredLanguage,
      timezone: data.profile.timezone,
      authorizationId: data.authorization.id,
      role: data.authorization.role,
      isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  private mapProfileToView(profile: any): UserAggregatedView {
    const now = new Date();
    const isActive =
      profile.identity.authorization.effectiveFrom <= now &&
      (!profile.identity.authorization.effectiveUntil ||
        profile.identity.authorization.effectiveUntil > now);

    return {
      identityId: profile.identity.id,
      email: profile.identity.email,
      emailVerified: profile.identity.emailVerified,
      lastLogin: profile.identity.lastLogin,
      lockedUntil: profile.identity.lockedUntil,
      profileId: profile.id,
      fullName: profile.fullName,
      nationalId: profile.nationalId,
      phone: profile.phone,
      birthDate: profile.birthDate,
      profileImageUrl: profile.profileImageUrl,
      bio: profile.bio,
      profession: profile.profession,
      specialization: profile.specialization,
      preferredLanguage: profile.preferredLanguage,
      timezone: profile.timezone,
      authorizationId: profile.identity.authorization.id,
      role: profile.identity.authorization.role,
      isActive,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}
