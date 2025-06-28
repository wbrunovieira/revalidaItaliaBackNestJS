// src/infra/auth/dtos/delete-user.dto.ts
import { IsUUID } from 'class-validator';

export class DeleteUserDto {
  @IsUUID('4', { message: 'ID must be a valid UUID' })
  id: string;
}

export class DeleteUserResponseDto {
  message: string;
}
