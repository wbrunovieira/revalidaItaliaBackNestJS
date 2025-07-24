// src/domain/auth/application/dtos/authenticate-user-response.dto.ts
export interface AuthenticateUserResponseDto {
  user: {
    identityId: string;
    email: string;
    fullName: string;
    role: string;
    profileImageUrl?: string | null;
  };
}