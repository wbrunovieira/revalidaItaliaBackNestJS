// src/addresses/dto/create-address.dto.ts
import { IsNotEmpty, IsOptional, IsUUID, IsString } from 'class-validator';

export class CreateAddressDto {
  @IsUUID()
  @IsNotEmpty({ message: 'userId must be provided' })
  userId!: string;

  @IsString()
  @IsNotEmpty({ message: 'street must be provided' })
  street!: string;

  @IsString()
  @IsNotEmpty({ message: 'number must be provided' })
  number!: string;

  @IsString()
  @IsNotEmpty({ message: 'district must be provided' })
  district!: string;

  @IsString()
  @IsNotEmpty({ message: 'city must be provided' })
  city!: string;

  @IsString()
  @IsOptional()
  complement?: string ;

  @IsString()
  @IsOptional()
  state?: string | null;

  @IsString()
  @IsNotEmpty({ message: 'country must be provided' })
  country!: string;

  @IsString()
  @IsNotEmpty({ message: 'postalCode must be provided' })
  postalCode!: string;
}