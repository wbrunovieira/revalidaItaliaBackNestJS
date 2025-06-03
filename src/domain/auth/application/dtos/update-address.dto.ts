// src/domain/auth/application/dtos/update-address.dto.ts

import {
  IsString,
  IsOptional,
  Matches,
} from 'class-validator';

export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  number?: string;

  @IsOptional()
  @IsString()
  complement?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{5}-?[0-9]{3}$/, {
    message: 'postalCode must follow the pattern 00000-000',
  })
  postalCode?: string;
}