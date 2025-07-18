import { ApiProperty } from '@nestjs/swagger';

export class StudentResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique student identifier (UUID v4)',
  })
  id: string;

  @ApiProperty({
    example: 'Mario Rossi',
    description: 'Student full name',
  })
  name: string;

  @ApiProperty({
    example: 'mario.rossi@medicina.it',
    description: 'Student email address',
  })
  email: string;

  @ApiProperty({
    example: '12345678901',
    description: 'Student document number',
  })
  cpf: string;

  @ApiProperty({
    example: 'student',
    description: 'User role',
    enum: ['student'],
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

export class CreateStudentResponseDto {
  @ApiProperty({
    description: 'Created student information',
    type: StudentResponseDto,
  })
  user: StudentResponseDto;
}