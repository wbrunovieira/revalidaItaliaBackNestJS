// src/domain/auth/application/dtos/get-user-by-id-response.dto.ts
export interface UserDetailsDto {
  id: string;
  name: string;
  email: string;
  cpf?: string;
  phone?: string;
  birthDate?: Date;
  profileImageUrl?: string;
  role: 'student' | 'admin' | 'tutor';
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetUserByIdResponseDto {
  user: UserDetailsDto;
}
