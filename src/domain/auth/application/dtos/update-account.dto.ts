// src/infra/auth/dtos/update-account.dto.ts
import {
  IsString,
  IsEmail,
  IsEnum,
  MinLength,
  Matches,
  IsUUID,
  IsOptional,
} from 'class-validator';

export class UpdateAccountDto {
  @IsUUID()
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @IsOptional()
  @IsString()
  profileImageUrl?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{11}$/, { message: 'Invalid CPF' })
  cpf?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  @Matches(/[A-Z]/, {
    message: 'Password must contain at least one uppercase letter',
  })
  @Matches(/\d/, { message: 'Password must contain at least one number' })
  @Matches(/[^A-Za-z0-9]/, {
    message: 'Password must contain at least one special character',
  })
  password?: string;

  @IsOptional()
  @IsEnum(['admin', 'tutor', 'student'])
  role?: 'admin' | 'tutor' | 'student';
}
