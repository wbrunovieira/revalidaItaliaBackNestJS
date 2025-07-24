// src/domain/auth/application/dtos/update-user-profile-response.dto.ts
export interface UpdateUserProfileResponseDto {
  profileId: string;
  fullName: string;
  phone?: string | null;
  birthDate?: Date | null;
  profileImageUrl?: string | null;
  bio?: string | null;
  profession?: string | null;
  specialization?: string | null;
  preferredLanguage: string;
  timezone: string;
  updatedAt: Date;
}