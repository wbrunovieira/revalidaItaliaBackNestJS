// src/domain/auth/application/dtos/update-user-profile-request.dto.ts
import {
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  IsUrl,
  MinLength,
  MaxLength,
  IsIn,
  IsTimeZone,
} from 'class-validator';

export class UpdateUserProfileRequestDto {
  @IsUUID()
  profileId: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  fullName?: string;

  @IsOptional()
  @IsString()
  phone?: string | null;

  @IsOptional()
  @IsDateString()
  birthDate?: string | null;

  @IsOptional()
  @IsUrl()
  profileImageUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  profession?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  specialization?: string | null;

  @IsOptional()
  @IsString()
  @IsIn(['pt-BR', 'it', 'es', 'en'])
  preferredLanguage?: string;

  @IsOptional()
  @IsTimeZone()
  timezone?: string;
}
