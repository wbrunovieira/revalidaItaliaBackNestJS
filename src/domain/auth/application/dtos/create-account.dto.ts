// src/infra/auth/dtos/create-account.dto.ts
import {
  IsEmail,
  IsEnum,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsNotEmpty,
} from 'class-validator';

export class CreateAccountDto {
  @IsString() @MinLength(3) name: string;
  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'Document must have at least 5 characters' })
  @MaxLength(20, { message: 'Document must have at most 20 characters' })
  @Matches(/^[A-Za-z0-9-]+$/, {
    message: 'Document can only contain letters, numbers and hyphens',
  })
  cpf: string;
  @IsEmail() email: string;
  @IsString()
  @MinLength(6)
  @Matches(/[A-Z]/)
  @Matches(/\d/)
  @Matches(/[^a-zA-Z0-9]/)
  password: string;
  @IsEnum(['admin', 'tutor', 'student']) role: 'admin' | 'tutor' | 'student';
}
