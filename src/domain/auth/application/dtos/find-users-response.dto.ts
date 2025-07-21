// src/domain/auth/application/dtos/find-users-response.dto.ts
import { UserResponseDto } from './user-response.dto';

export class PaginationResponseDto {
  page: number;
  pageSize: number;
  total?: number;
}

export class FindUsersResponseDto {
  users: UserResponseDto[];
  pagination: PaginationResponseDto;
}
