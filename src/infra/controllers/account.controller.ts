// src/infra/controllers/account.controller.ts

import {
  Controller,
  Post,
  Body,
  HttpCode,
  ConflictException,
} from '@nestjs/common'

import { CreateAccountUseCase } from '@/domain/auth/application/use-cases/create-account.use-case'
import { CreateAccountRequest } from '@/domain/auth/application/dtos/create-account-request.dto'
import { CreateAccountDto } from '@/domain/auth/application/dtos/create-account.dto'

@Controller('accounts')
export class AccountController {
  constructor(
    private readonly createAccountUseCase: CreateAccountUseCase,
  ) {}

  @Post()
  @HttpCode(201)
  async create(@Body() dto: CreateAccountDto) {
    // Map the validated DTO into the shape expected by our use-case
    const request: CreateAccountRequest = { ...dto }

    const result = await this.createAccountUseCase.execute(request)
    if (result.isLeft()) {
      // Throw a 409 on any business-rule failure (e.g. duplicate email)
      throw new ConflictException(result.value.message || 'Failed to create account')
    }

    return { user: result.value.user }
  }
}