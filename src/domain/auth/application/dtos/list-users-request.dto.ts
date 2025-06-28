// src/domain/auth/application/dtos/list-users-request.dto.ts
export interface ListUsersRequestDto {
  page?: number;
  pageSize?: number;
}

// Optional: Add filtering options for future enhancement
export interface ListUsersFilters {
  role?: 'admin' | 'tutor' | 'student';
  search?: string; // Search by name or email
  active?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface ExtendedListUsersRequestDto extends ListUsersRequestDto {
  filters?: ListUsersFilters;
  orderBy?: 'name' | 'email' | 'createdAt' | 'updatedAt';
  orderDirection?: 'asc' | 'desc';
}
