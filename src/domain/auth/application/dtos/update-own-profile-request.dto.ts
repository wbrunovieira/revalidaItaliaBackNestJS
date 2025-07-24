// src/domain/auth/application/dtos/update-own-profile-request.dto.ts
import {
  IsOptional,
  IsString,
  IsUUID,
  IsEmail,
  IsDateString,
  IsUrl,
  MinLength,
  MaxLength,
} from 'class-validator';

export class UpdateOwnProfileRequestDto {
  @IsUUID()
  identityId: string;

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
  phone?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsUrl()
  profileImageUrl?: string;
}
