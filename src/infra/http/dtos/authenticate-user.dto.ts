// src/infra/http/dtos/authenticate-user.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

/**
 * Authenticate User DTO
 * 
 * Validates login request structure at the HTTP layer.
 * Business rules validation is delegated to the domain.
 */
export class AuthenticateUserDto {
  @ApiProperty({
    example: 'mario.rossi@medicina.it',
    description: 'User email address',
  })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description: 'User password',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}