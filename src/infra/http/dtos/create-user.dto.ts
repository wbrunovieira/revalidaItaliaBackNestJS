// src/infra/http/dtos/create-user.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

/**
 * Create User DTO
 *
 * Validates request structure at the HTTP layer.
 * Business rules validation is delegated to Value Objects in the domain.
 */
export class CreateUserDto {
  @ApiProperty({
    example: 'Mario Rossi',
    description: 'User full name',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

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

  @ApiProperty({
    example: 'RSSMRA85M01H501Z',
    description: 'User national identification document',
  })
  @IsString()
  @IsNotEmpty()
  nationalId: string;

  @ApiProperty({
    example: 'student',
    description: 'User role in the system',
    enum: ['admin', 'tutor', 'student'],
  })
  @IsEnum(['admin', 'tutor', 'student'])
  role: 'admin' | 'tutor' | 'student';

  @ApiProperty({
    example: 'api',
    description: 'Source of user creation',
    required: false,
  })
  @IsString()
  @IsOptional()
  source?: string;
}
