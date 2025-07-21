import { Injectable } from '@nestjs/common';

import { IUserProfileRepository } from '@/domain/auth/application/repositories/i-user-profile-repository';
import { UserProfile } from '@/domain/auth/enterprise/entities/user-profile';
import { NationalId } from '@/domain/auth/enterprise/value-objects/national-id.vo';
import { UserProfileCriteria } from '@/domain/auth/application/criteria/user-profile-criteria';
import { Either, left, right } from '@/core/either';
import { UserProfileMapper } from '@/domain/auth/application/mappers/user-profile.mapper';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class PrismaUserProfileRepository implements IUserProfileRepository {
  constructor(private prisma: PrismaService) {}

  async findByIdentityId(
    identityId: string,
  ): Promise<Either<Error, UserProfile | null>> {
    try {
      const userProfile = await this.prisma.userProfile.findUnique({
        where: { identityId },
      });

      if (!userProfile) {
        return right(null);
      }

      return right(UserProfileMapper.toDomain(userProfile));
    } catch (error) {
      return left(
        new Error(`Failed to find user profile by identity id: ${error}`),
      );
    }
  }

  async findById(id: string): Promise<Either<Error, UserProfile | null>> {
    try {
      const userProfile = await this.prisma.userProfile.findUnique({
        where: { id },
      });

      if (!userProfile) {
        return right(null);
      }

      return right(UserProfileMapper.toDomain(userProfile));
    } catch (error) {
      return left(new Error(`Failed to find user profile by id: ${error}`));
    }
  }

  async findByNationalId(
    nationalId: NationalId,
  ): Promise<Either<Error, UserProfile | null>> {
    try {
      const userProfile = await this.prisma.userProfile.findUnique({
        where: { nationalId: nationalId.value },
      });

      if (!userProfile) {
        return right(null);
      }

      return right(UserProfileMapper.toDomain(userProfile));
    } catch (error) {
      return left(
        new Error(`Failed to find user profile by national id: ${error}`),
      );
    }
  }

  async nationalIdExists(
    nationalId: NationalId,
  ): Promise<Either<Error, boolean>> {
    try {
      const count = await this.prisma.userProfile.count({
        where: { nationalId: nationalId.value },
      });

      return right(count > 0);
    } catch (error) {
      return left(new Error(`Failed to check if national id exists: ${error}`));
    }
  }

  async findByCriteria(
    criteria: UserProfileCriteria,
  ): Promise<Either<Error, UserProfile[]>> {
    try {
      const query = criteria.build();
      const userProfiles = await this.prisma.userProfile.findMany(query);

      return right(userProfiles.map(UserProfileMapper.toDomain));
    } catch (error) {
      return left(
        new Error(`Failed to find user profiles by criteria: ${error}`),
      );
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
        new Error(`Failed to count user profiles by criteria: ${error}`),
      );
    }
  }

  async save(userProfile: UserProfile): Promise<Either<Error, void>> {
    try {
      const data = UserProfileMapper.toPersistence(userProfile);

      // Prepare update data, filtering out null values
      const updateData: any = {
        fullName: data.fullName,
        nationalId: data.nationalId,
        preferredLanguage: data.preferredLanguage,
        timezone: data.timezone,
        updatedAt: data.updatedAt,
      };
      
      // Add optional fields only if they're not null
      if (data.phone !== null) {
        updateData.phone = data.phone;
      }
      if (data.birthDate !== null) {
        updateData.birthDate = data.birthDate;
      }
      if (data.profileImageUrl !== null) {
        updateData.profileImageUrl = data.profileImageUrl;
      }
      if (data.bio !== null) {
        updateData.bio = data.bio;
      }
      if (data.profession !== null) {
        updateData.profession = data.profession;
      }
      if (data.specialization !== null) {
        updateData.specialization = data.specialization;
      }

      // Prepare create data
      const createData: any = {
        id: data.id,
        identityId: data.identityId,
        fullName: data.fullName,
        nationalId: data.nationalId,
        preferredLanguage: data.preferredLanguage,
        timezone: data.timezone,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
      
      // Add optional fields only if they're not null/undefined
      if (data.phone !== null && data.phone !== undefined) {
        createData.phone = data.phone;
      }
      if (data.birthDate !== null && data.birthDate !== undefined) {
        createData.birthDate = data.birthDate;
      }
      if (data.profileImageUrl !== null && data.profileImageUrl !== undefined) {
        createData.profileImageUrl = data.profileImageUrl;
      }
      if (data.bio !== null && data.bio !== undefined) {
        createData.bio = data.bio;
      }
      if (data.profession !== null && data.profession !== undefined) {
        createData.profession = data.profession;
      }
      if (data.specialization !== null && data.specialization !== undefined) {
        createData.specialization = data.specialization;
      }

      await this.prisma.userProfile.upsert({
        where: { id: data.id },
        update: updateData,
        create: createData,
      });

      return right(undefined);
    } catch (error) {
      return left(new Error(`Failed to save user profile: ${error}`));
    }
  }

  async delete(id: string): Promise<Either<Error, void>> {
    try {
      await this.prisma.userProfile.delete({
        where: { id },
      });

      return right(undefined);
    } catch (error) {
      return left(new Error(`Failed to delete user profile: ${error}`));
    }
  }
}
