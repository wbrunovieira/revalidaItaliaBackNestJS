// src/domain/auth/application/dtos/update-own-profile-response.dto.ts
export interface UpdateOwnProfileResponseDto {
  identity: {
    id: string;
    email: string;
  };
  profile: {
    fullName: string;
    nationalId: string;
    phone?: string | null;
    birthDate?: Date | null;
    profileImageUrl?: string | null;
  };
}