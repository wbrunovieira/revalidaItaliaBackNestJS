// src/domain/auth/application/dtos/list-users-response.dto.ts
export interface UserListItemDto {
  identityId: string;
  email: string;
  emailVerified: boolean;
  fullName: string;
  nationalId: string;
  phone?: string | null;
  profileImageUrl?: string | null;
  bio?: string | null;
  profession?: string | null;
  specialization?: string | null;
  role: string;
  isActive: boolean;
  lastLogin?: Date | null;
  createdAt: Date;
}

export interface ListUsersResponseDto {
  items: UserListItemDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
