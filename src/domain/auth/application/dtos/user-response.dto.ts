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
    example: '2024-01-15T10:00:00.000Z',
    description: 'Account creation timestamp',
  })
  createdAt: string;

  @ApiProperty({
    example: '2024-01-15T10:00:00.000Z',
    description: 'Last update timestamp',
  })
  updatedAt: string;
}

export class CreateUserResponseDto {
  @ApiProperty({
    description: 'Created user information',
    type: UserResponseDto,
  })
  user: UserResponseDto;
}