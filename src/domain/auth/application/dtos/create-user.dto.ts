import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsEnum, MinLength, IsNotEmpty, MaxLength, Matches } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: 'Mario Rossi',
    description: 'Full name of the user',
    minLength: 3,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @ApiProperty({
    example: 'mario.rossi@medicina.it',
    description: 'Email address for login and notifications',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description: 'Strong password for account access',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: '12345678901',
    description: 'National ID document (CPF, passport, or other identification)',
    minLength: 5,
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'Document must have at least 5 characters' })
  @MaxLength(20, { message: 'Document must have at most 20 characters' })
  @Matches(/^[A-Za-z0-9-]+$/, { 
    message: 'Document can only contain letters, numbers and hyphens' 
  })
  nationalId: string;

  @ApiProperty({
    example: 'student',
    description: 'User role in the system',
    enum: ['student', 'tutor', 'admin'],
    default: 'student',
  })
  @IsEnum(['student', 'tutor', 'admin'])
  role: 'student' | 'tutor' | 'admin';
}