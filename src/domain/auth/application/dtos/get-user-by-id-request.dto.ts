// src/domain/auth/application/dtos/get-user-by-id-request.dto.ts
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class GetUserByIdRequestDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  id: string;
}
