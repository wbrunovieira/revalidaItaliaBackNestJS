import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsEnum, MinLength, IsNotEmpty } from 'class-validator';

export class CreateStudentDto {
  @ApiProperty({
    example: 'Mario Rossi',
    description: 'Full name of the student',
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
    description: 'Document number (CPF for Brazilians or equivalent document for foreigners)',
  })
  @IsString()
  @IsNotEmpty()
  cpf: string;

  @ApiProperty({
    example: 'student',
    description: 'User role in the system',
    enum: ['student'],
    default: 'student',
  })
  @IsEnum(['student'])
  role: 'student';
}