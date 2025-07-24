// src/infra/http/dtos/update-user.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

/**
 * Update User DTO
 *
 * All fields are optional for partial updates.
 * Validates request structure at the HTTP layer.
 */
export class UpdateUserDto {
  @ApiProperty({
    example: 'Mario Rossi',
    description: 'User full name',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: 'mario.rossi@medicina.it',
    description: 'User email address',
    required: false,
  })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({
    example: 'RSSMRA85M01H501Z',
    description: 'User national identification document',
    required: false,
  })
  @IsString()
  @IsOptional()
  nationalId?: string;

  @ApiProperty({
    example: 'student',
    description: 'User role in the system',
    enum: ['admin', 'tutor', 'student'],
    required: false,
  })
  @IsEnum(['admin', 'tutor', 'student'])
  @IsOptional()
  role?: 'admin' | 'tutor' | 'student';
}
