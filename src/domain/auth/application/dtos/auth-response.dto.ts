import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'User unique identifier',
  })
  id: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  email: string;

  @ApiProperty({
    example: 'student',
    description: 'User role in the system',
    enum: ['student', 'admin', 'instructor'],
  })
  role: string;
}

export class AuthSuccessResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token for authentication',
  })
  accessToken: string;

  @ApiProperty({
    description: 'User information',
    type: UserResponseDto,
  })
  user: UserResponseDto;
}

export class AuthErrorResponseDto {
  @ApiProperty({
    example: 401,
    description: 'HTTP status code',
  })
  statusCode: number;

  @ApiProperty({
    example: 'Invalid credentials',
    description: 'Error message',
    examples: [
      'Invalid credentials',
      'Invalid email address',
      'Password must be at least 6 characters long',
    ],
  })
  message: string;

  @ApiProperty({
    example: 'Unauthorized',
    description: 'Error type',
  })
  error: string;
}

export class ValidationErrorResponseDto {
  @ApiProperty({
    example: 400,
    description: 'HTTP status code',
  })
  statusCode: number;

  @ApiProperty({
    example: 'Invalid email address',
    description: 'Validation error message',
    examples: [
      'Invalid email address',
      'Password must be at least 6 characters long',
    ],
  })
  message: string;

  @ApiProperty({
    example: 'Bad Request',
    description: 'Error type',
  })
  error: string;
}