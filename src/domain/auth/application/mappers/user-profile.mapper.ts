import { UserProfile as PrismaUserProfile } from '@prisma/client';
import { UserProfile } from '../../enterprise/entities/user-profile';
import { NationalId } from '../../enterprise/value-objects/national-id.vo';
import { UniqueEntityID } from '@/core/unique-entity-id';

export class UserProfileMapper {
  static toDomain(raw: PrismaUserProfile): UserProfile {
    return UserProfile.create(
      {
        identityId: new UniqueEntityID(raw.identityId),
        fullName: raw.fullName,
        nationalId: NationalId.createFromTrustedSource(raw.nationalId),
        phone: raw.phone,
        birthDate: raw.birthDate,
        profileImageUrl: raw.profileImageUrl,
        bio: raw.bio,
        profession: raw.profession,
        specialization: raw.specialization,
        preferredLanguage: raw.preferredLanguage,
        timezone: raw.timezone,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityID(raw.id),
    );
  }

  static toPersistence(userProfile: UserProfile) {
    return {
      id: userProfile.id.toString(),
      identityId: userProfile.identityId.toString(),
      fullName: userProfile.fullName,
      nationalId: userProfile.nationalId.value,
      phone: userProfile.phone,
      birthDate: userProfile.birthDate,
      profileImageUrl: userProfile.profileImageUrl,
      bio: userProfile.bio,
      profession: userProfile.profession,
      specialization: userProfile.specialization,
      preferredLanguage: userProfile.preferredLanguage,
      timezone: userProfile.timezone,
      createdAt: userProfile.createdAt,
      updatedAt: userProfile.updatedAt,
    };
  }

  static toResponse(userProfile: UserProfile) {
    return {
      id: userProfile.id.toString(),
      fullName: userProfile.fullName,
      nationalId: userProfile.nationalId.value,
      phone: userProfile.phone,
      birthDate: userProfile.birthDate,
      profileImageUrl: userProfile.profileImageUrl,
      bio: userProfile.bio,
      profession: userProfile.profession,
      specialization: userProfile.specialization,
      age: userProfile.age,
      preferredLanguage: userProfile.preferredLanguage,
      timezone: userProfile.timezone,
      createdAt: userProfile.createdAt,
      updatedAt: userProfile.updatedAt,
    };
  }
}