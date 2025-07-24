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
import { UpdateOwnProfileUseCase } from '@/domain/auth/application/use-cases/profile/update-own-profile.use-case';
import { CurrentUser } from '@/infra/auth/current-user-decorator';
import { UserPayload } from '@/infra/auth/strategies/jwt.strategy';
import { JwtAuthGuard } from '@/infra/auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { InvalidInputError } from '@/domain/auth/application/use-cases/errors/invalid-input-error';
import { DuplicateEmailError } from '@/domain/auth/application/use-cases/errors/duplicate-email-error';
import { DuplicateNationalIdError } from '@/domain/auth/application/use-cases/errors/duplicate-national-id-error';
import { ResourceNotFoundError } from '@/domain/auth/application/use-cases/errors/resource-not-found-error';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(
    private readonly updateOwnProfileUseCase: UpdateOwnProfileUseCase,
  ) {}

  @Patch()
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @Body() dto: UpdateProfileDto,
    @CurrentUser() user: UserPayload,
  ): Promise<any> {
    const result = await this.updateOwnProfileUseCase.execute({
      identityId: user.sub,
      name: dto.name,
      email: dto.email,
      nationalId: dto.nationalId,
      phone: dto.phone,
      birthDate: dto.birthDate ? dto.birthDate.toISOString() : undefined,
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

      if (error instanceof DuplicateNationalIdError) {
        throw new ConflictException('National ID already in use');
      }

      if (error instanceof ResourceNotFoundError) {
        throw new BadRequestException(error.message);
      }

      throw new InternalServerErrorException('Failed to update profile');
    }

    return result.value;
  }
}