// src/domain/auth/application/dtos/update-user-response.dto.ts
export interface UpdateUserResponseDto {
  identity: {
    id: string;
    email: string;
  };
  profile: {
    fullName: string;
    nationalId: string;
  };
  authorization: {
    role: string;
  };
}
