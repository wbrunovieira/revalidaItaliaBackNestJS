// src/infra/controllers/profile.controller.ts
import {
  Controller,
  Patch,
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { UpdateUserProfileUseCase } from '@/domain/auth/application/use-cases/update-user-profile.use-case';
import { CurrentUser } from '@/infra/auth/current-user-decorator';
import { UserPayload } from '@/infra/auth/strategies/jwt.strategy';
import { JwtAuthGuard } from '@/infra/auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { InvalidInputError } from '@/domain/auth/application/use-cases/errors/invalid-input-error';
import { DuplicateEmailError } from '@/domain/auth/application/use-cases/errors/duplicate-email-error';
import { DuplicateCPFError } from '@/domain/auth/application/use-cases/errors/duplicate-cpf-error';
import { ResourceNotFoundError } from '@/domain/auth/application/use-cases/errors/resource-not-found-error';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(
    private readonly updateUserProfileUseCase: UpdateUserProfileUseCase,
  ) {}

  @Patch()
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @Body() dto: UpdateProfileDto,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.updateUserProfileUseCase.execute({
      userId: user.sub,
      name: dto.name,
      email: dto.email,
      cpf: dto.cpf,
      phone: dto.phone,
      birthDate: dto.birthDate,
      profileImageUrl: dto.profileImageUrl,
    });

    if (result.isLeft()) {
      const error = result.value;

      if (error instanceof InvalidInputError) {
        throw new BadRequestException({
          message: error.message,
          errors: error.details,
        });
      }

      if (error instanceof DuplicateEmailError) {
        throw new ConflictException('Email already in use');
      }

      if (error instanceof DuplicateCPFError) {
        throw new ConflictException('CPF already in use');
      }

      if (error instanceof ResourceNotFoundError) {
        throw new BadRequestException(error.message);
      }

      throw new InternalServerErrorException('Failed to update profile');
    }

    return result.value.user;
  }
}