// src/domain/auth/application/dtos/find-address-by-profile-request.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';

export class FindAddressByProfileRequestDto {
  @IsString()
  @IsNotEmpty()
  profileId: string;
}