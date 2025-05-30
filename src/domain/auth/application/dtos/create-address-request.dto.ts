import { IsString, IsOptional, Length } from "class-validator";

export class CreateAddressRequest {
  @IsString()
  userId!: string;

  @IsString()
  street!: string;

  @IsString()
  number!: string;

  @IsOptional()
  @IsString()
  complement?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsString()
  city!: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsString()
  country!: string;

  @IsString()
  @Length(1, 20)
  postalCode!: string;
}