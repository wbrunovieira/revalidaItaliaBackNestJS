// src/domain/auth/application/dtos/find-users-response.dto.ts
export class UserResponseDto {
  id: string;
  name: string;
  email: string;
  cpf: string;
  phone?: string;
  profileImageUrl?: string;
  role: 'admin' | 'tutor' | 'student';
  createdAt: Date;
  updatedAt: Date;
}

export class PaginationResponseDto {
  page: number;
  pageSize: number;
  total?: number;
}

export class FindUsersResponseDto {
  users: UserResponseDto[];
  pagination: PaginationResponseDto;
}
