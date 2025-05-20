// src/infra/auth/dtos/create-account.dto.ts
import { IsEmail, IsEnum, IsString, MinLength, Matches } from 'class-validator'

export class CreateAccountDto {
  @IsString() @MinLength(3) name: string
  @IsString() @Matches(/^\d{11}$/) cpf: string
  @IsEmail() email: string
  @IsString() @MinLength(6) @Matches(/[A-Z]/) @Matches(/\d/) @Matches(/[^a-zA-Z0-9]/)
  password: string
  @IsEnum(['admin','tutor','student']) role: 'admin' | 'tutor' | 'student'
}