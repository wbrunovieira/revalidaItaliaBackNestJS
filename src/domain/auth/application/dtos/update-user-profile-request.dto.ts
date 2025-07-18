// src/domain/auth/application/dtos/update-user-profile-request.dto.ts

export interface UpdateUserProfileRequest {
  userId: string; // ID do usuário autenticado
  name?: string;
  email?: string;
  cpf?: string;
  phone?: string;
  birthDate?: Date;
  profileImageUrl?: string;
}