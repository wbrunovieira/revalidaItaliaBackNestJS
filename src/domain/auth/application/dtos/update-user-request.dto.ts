// src/domain/auth/application/dtos/update-user-request.dto.ts
import {
  IsOptional,
  IsString,
  IsUUID,
  IsEmail,
  IsUrl,
  MinLength,
  MaxLength,
  IsIn,
} from 'class-validator';

export class UpdateUserRequestDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  nationalId?: string;

  @IsOptional()
  @IsString()
  @IsIn(['admin', 'tutor', 'student'])
  role?: 'admin' | 'tutor' | 'student';
}
