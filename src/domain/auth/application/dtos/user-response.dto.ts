import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique user identifier (UUID v4)',
  })
  id: string;

  @ApiProperty({
    example: 'Mario Rossi',
    description: 'User full name',
  })
  name: string;

  @ApiProperty({
    example: 'mario.rossi@medicina.it',
    description: 'User email address',
  })
  email: string;

  @ApiProperty({
    example: '12345678901',
    description: 'User national ID document',
  })
  nationalId: string;

  @ApiProperty({
    example: 'student',
    description: 'User role',
    enum: ['student', 'tutor', 'admin'],
  })
  role: string;

  @ApiProperty({
    example: '+393331234567',
    description: 'User phone number',
    required: false,
  })
  phone?: string;

  @ApiProperty({
    example: '1990-01-15',
    description: 'User birth date',
    required: false,
  })
  birthDate?: Date;

  @ApiProperty({
    example: 'https://example.com/profile.jpg',
    description: 'Profile image URL',
    required: false,
  })
  profileImageUrl?: string;

  @ApiProperty({
    example: '2024-01-15T10:00:00.000Z',
    description: 'Last login timestamp',
    required: false,
  })
  lastLogin?: Date;

  @ApiProperty({
    example: '2024-01-15T10:00:00.000Z',
    description: 'Account creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-15T10:00:00.000Z',
    description: 'Last update timestamp',
  })
  updatedAt: Date;
}

export class CreateUserResponseDto {
  @ApiProperty({
    description: 'Created user information',
    type: UserResponseDto,
  })
  user: UserResponseDto;
}

export class GetUserResponseDto {
  @ApiProperty({
    description: 'User information',
    type: UserResponseDto,
  })
  user: UserResponseDto;
}

export class UpdateUserResponseDto {
  @ApiProperty({
    description: 'Updated user information',
    type: UserResponseDto,
  })
  user: UserResponseDto;
}

export class AuthenticateUserResponseDto {
  @ApiProperty({
    description: 'Authenticated user information',
    type: UserResponseDto,
  })
  user: UserResponseDto;
}

export class ListUsersResponseDto {
  @ApiProperty({
    description: 'List of users',
    type: [UserResponseDto],
  })
  users: UserResponseDto[];
  
  @ApiProperty({
    example: 100,
    description: 'Total number of users',
  })
  total: number;
  
  @ApiProperty({
    example: 1,
    description: 'Current page number',
  })
  page: number;
  
  @ApiProperty({
    example: 20,
    description: 'Number of items per page',
  })
  pageSize: number;
}