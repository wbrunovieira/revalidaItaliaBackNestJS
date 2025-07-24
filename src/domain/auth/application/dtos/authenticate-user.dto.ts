import { ApiProperty } from '@nestjs/swagger';

export class AuthenticateUserDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
    required: true,
  })
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'User password (minimum 6 characters)',
    minLength: 6,
    required: true,
  })
  password: string;
}
