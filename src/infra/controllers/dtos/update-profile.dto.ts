// src/infra/controllers/dtos/update-profile.dto.ts
import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  Matches,
  IsDateString,
  IsUrl,
  ValidateIf,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Full name must be at least 3 characters long' })
  fullName?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'nationalId must be at least 3 characters long' })
  nationalId?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Invalid date format' })
  birthDate?: string;

  @IsOptional()
  @ValidateIf((o) => o.profileImageUrl !== null && o.profileImageUrl !== undefined)
  @IsString()
  @Matches(/^(https?:\/\/[^\s]+|\/[^\s]*)$/, {
    message: 'Profile image URL must be a valid URL or start with /',
  })
  profileImageUrl?: string;
}
