import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({
    example: 'https://api.portalrevalida.com/errors/validation-failed',
    description: 'URI reference that identifies the problem type',
  })
  type: string;

  @ApiProperty({
    example: 'Validation Failed',
    description: 'Short, human-readable summary of the problem',
  })
  title: string;

  @ApiProperty({
    example: 400,
    description: 'HTTP status code',
  })
  status: number;

  @ApiProperty({
    example: 'One or more fields failed validation',
    description: 'Human-readable explanation specific to this occurrence',
  })
  detail: string;

  @ApiProperty({
    example: '/students',
    description: 'URI reference of the request',
  })
  instance: string;

  @ApiProperty({
    example: '1706454600000-abc123xyz',
    description: 'Unique identifier for this error occurrence for support',
  })
  traceId: string;

  @ApiProperty({
    example: '2024-01-20T15:30:00.000Z',
    description: 'Timestamp when the error occurred',
  })
  timestamp: string;
}

export class ValidationErrorResponseDto extends ErrorResponseDto {
  @ApiProperty({
    example: {
      errors: {
        name: ['Name must be at least 3 characters'],
        email: ['Invalid email format'],
      }
    },
    description: 'Detailed validation errors by field',
  })
  errors: Record<string, string[]>;
}

export class ConflictErrorResponseDto extends ErrorResponseDto {
  @ApiProperty({
    example: 'https://api.portalrevalida.com/errors/resource-conflict',
    description: 'Conflict error type',
  })
  declare type: string;

  @ApiProperty({
    example: 'Resource Conflict',
    description: 'Conflict error title',
  })
  declare title: string;

  @ApiProperty({
    example: 409,
    description: 'Conflict status code',
  })
  declare status: number;

  @ApiProperty({
    example: 'Unable to create resource due to conflict',
    description: 'Generic conflict message for security',
  })
  declare detail: string;
}