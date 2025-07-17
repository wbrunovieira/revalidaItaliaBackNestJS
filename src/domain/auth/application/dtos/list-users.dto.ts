// src/infra/auth/dtos/list-users.dto.ts
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ListUsersDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Max(100)
  pageSize?: number;
}

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

export class ListUsersResponseDto {
  users: UserResponseDto[];
  pagination: {
    page: number;
    pageSize: number;
    total?: number;
  };
}
