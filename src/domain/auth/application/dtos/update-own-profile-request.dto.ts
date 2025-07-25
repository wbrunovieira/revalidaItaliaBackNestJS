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
  Matches,
  ValidateIf,
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
  @ValidateIf((o) => o.profileImageUrl !== null && o.profileImageUrl !== undefined)
  @IsString()
  @Matches(/^(https?:\/\/[^\s]+|\/[^\s]*)$/, {
    message: 'profileImageUrl must be a URL address',
  })
  profileImageUrl?: string;
}
