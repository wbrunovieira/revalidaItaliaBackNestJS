// src/domain/auth/application/dtos/authenticate-user-request.dto.ts
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class AuthenticateUserRequestDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  password: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;
}