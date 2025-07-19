import { ApiProperty } from '@nestjs/swagger';

export class TokenInfoDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYzMjU0MjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    description: 'JWT Bearer token for API authentication. Include in Authorization header as: Bearer {token}',
  })
  accessToken: string;

  @ApiProperty({
    example: 'Bearer',
    description: 'Token type, always "Bearer"',
  })
  tokenType: string;

  @ApiProperty({
    example: 86400,
    description: 'Token expiration time in seconds (24 hours)',
  })
  expiresIn: number;

  @ApiProperty({
    example: '2024-01-20T15:30:00.000Z',
    description: 'ISO 8601 timestamp of when the token expires',
  })
  expiresAt: string;
}

export class AuthenticatedUserDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique user identifier (UUID v4)',
  })
  id: string;

  @ApiProperty({
    example: 'mario.rossi@medicina.it',
    description: 'User email address',
  })
  email: string;

  @ApiProperty({
    example: 'student',
    description: 'User role determining access permissions',
    enum: ['student', 'admin', 'instructor'],
  })
  role: string;

  @ApiProperty({
    example: 'Mario',
    description: 'User first name',
  })
  firstName: string;

  @ApiProperty({
    example: 'Rossi',
    description: 'User last name',
  })
  lastName: string;

  @ApiProperty({
    example: true,
    description: 'Whether user email is verified',
  })
  emailVerified: boolean;

  @ApiProperty({
    example: '2024-01-15T10:00:00.000Z',
    description: 'Account creation timestamp',
  })
  createdAt: string;
}

export class LoginSuccessResponseDto {
  @ApiProperty({
    description: 'Authentication token information',
    type: TokenInfoDto,
  })
  auth: TokenInfoDto;

  @ApiProperty({
    description: 'Authenticated user information',
    type: AuthenticatedUserDto,
  })
  user: AuthenticatedUserDto;

  @ApiProperty({
    example: {
      firstLogin: false,
      requiresPasswordChange: false,
      requiresProfileCompletion: false,
    },
    description: 'Additional metadata about the login',
  })
  meta: {
    firstLogin: boolean;
    requiresPasswordChange: boolean;
    requiresProfileCompletion: boolean;
  };
}

export class AuthErrorDto {
  @ApiProperty({
    example: 'https://api.portalrevalida.com/errors/authentication-failed',
    description: 'URI reference that identifies the problem type',
  })
  type: string;

  @ApiProperty({
    example: 'Authentication Failed',
    description: 'Short, human-readable summary of the problem',
  })
  title: string;

  @ApiProperty({
    example: 401,
    description: 'HTTP status code',
  })
  status: number;

  @ApiProperty({
    example: 'Invalid credentials',
    description: 'Human-readable explanation specific to this occurrence',
  })
  detail: string;

  @ApiProperty({
    example: '/auth/login',
    description: 'URI reference of the request',
  })
  instance: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique identifier for this error occurrence for support',
  })
  traceId: string;

  @ApiProperty({
    example: '2024-01-20T15:30:00.000Z',
    description: 'Timestamp when the error occurred',
  })
  timestamp: string;
}