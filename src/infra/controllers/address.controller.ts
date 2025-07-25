// src/infra/controllers/address.controller.ts

import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Query,
  Body,
  HttpCode,
  HttpException,
  HttpStatus,
  ParseUUIDPipe,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/infra/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/infra/auth/current-user-decorator';
import { UserPayload } from '@/infra/auth/strategies/jwt.strategy';
import { CreateAddressUseCase } from '@/domain/auth/application/use-cases/create-address.use-case';

import { UpdateAddressUseCase } from '@/domain/auth/application/use-cases/update-address.use-case';
import { CreateAddressRequestDto } from '@/domain/auth/application/dtos/create-address-request.dto';
import { UpdateAddressRequestDto } from '@/domain/auth/application/dtos/update-address-request.dto';
import { InvalidInputError } from '@/domain/auth/application/use-cases/errors/invalid-input-error';
import { ResourceNotFoundError } from '@/domain/auth/domain/exceptions';
import { Prisma } from '@prisma/client';
import { UpdateAddressDto } from '@/domain/auth/application/dtos/update-address.dto';
import {
  DeleteAddressRequest,
  DeleteAddressUseCase,
} from '@/domain/auth/application/use-cases/delete-address.use-case';
import { FindAddressByProfileUseCase as FindAddressByUserUseCase } from '@/domain/auth/application/use-cases/find-address-by-profile.use-case';
import { PrismaService } from '@/prisma/prisma.service';

@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressController {
  constructor(
    private readonly createAddressUseCase: CreateAddressUseCase,
    private readonly findAddressByUserUseCase: FindAddressByUserUseCase,
    private readonly updateAddressUseCase: UpdateAddressUseCase,
    private readonly deleteAddressUseCase: DeleteAddressUseCase,
    private readonly prisma: PrismaService,
  ) {}

  private async getProfileIdFromIdentityId(identityId: string): Promise<string | null> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { identityId },
      select: { id: true },
    });
    return profile?.id || null;
  }

  @Post()
  @HttpCode(201)
  async create(
    @Body() dto: CreateAddressRequestDto,
    @CurrentUser() user: UserPayload,
  ) {
    const requiredFields = [
      'profileId',
      'street',
      'number',
      'city',
      'country',
      'postalCode',
    ];
    const missing = requiredFields.filter(
      (f) => dto[f as keyof CreateAddressRequestDto] === undefined,
    );
    if (missing.length > 0) {
      throw new HttpException(
        { message: `Missing required fields: ${missing.join(', ')}` },
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate that the profileId belongs to the current user
    const userProfileId = await this.getProfileIdFromIdentityId(user.sub);
    if (!userProfileId || userProfileId !== dto.profileId) {
      throw new HttpException(
        { message: 'Forbidden: Cannot create address for another user' },
        HttpStatus.FORBIDDEN,
      );
    }

    try {
      const result = await this.createAddressUseCase.execute(dto);

      if (result.isLeft()) {
        const err = result.value;

        if (err instanceof InvalidInputError) {
          throw new HttpException(
            { message: err.message, errors: err.details },
            HttpStatus.BAD_REQUEST,
          );
        }

        if (err instanceof ResourceNotFoundError) {
          throw new HttpException(
            { message: err.message },
            HttpStatus.NOT_FOUND,
          );
        }

        throw new HttpException(
          { message: err.message },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return { addressId: result.value.addressId };
    } catch (err: any) {
      if (err instanceof HttpException) {
        throw err;
      }

      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2003'
      ) {
        throw new HttpException(
          { message: 'Database error: profile not found' },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      throw new HttpException(
        { message: err.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @HttpCode(200)
  async findByUser(
    @Query('profileId') profileId: string,
    @CurrentUser() user: UserPayload,
  ) {
    // Admin can view any user's addresses
    if (user.role !== 'admin') {
      // Regular users can only view their own addresses
      const userProfileId = await this.getProfileIdFromIdentityId(user.sub);
      if (!userProfileId || userProfileId !== profileId) {
        throw new HttpException(
          { message: 'Forbidden: Cannot view addresses of another user' },
          HttpStatus.FORBIDDEN,
        );
      }
    }

    try {
      const result = await this.findAddressByUserUseCase.execute({ profileId });

      if (result.isLeft()) {
        const err = result.value;
        if (err instanceof InvalidInputError) {
          throw new HttpException(
            { message: err.message, errors: { details: err.details } },
            HttpStatus.BAD_REQUEST,
          );
        }

        throw new HttpException(
          { message: err.message },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return result.value.addresses.map((addr) => {
        return {
          ...addr,
          createdAt: addr.createdAt.toISOString(),
          updatedAt: addr.updatedAt.toISOString(),
        };
      });
    } catch (err: any) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new HttpException(
        { message: err.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id')
  @HttpCode(200)
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateAddressDto,
    @CurrentUser() user: UserPayload,
  ) {
    // First, get the address to check ownership
    const address = await this.prisma.address.findUnique({
      where: { id },
      select: { profileId: true },
    });

    if (!address) {
      throw new HttpException(
        { message: 'Address not found' },
        HttpStatus.NOT_FOUND,
      );
    }

    // Validate that the address belongs to the current user
    const userProfileId = await this.getProfileIdFromIdentityId(user.sub);
    if (!userProfileId || userProfileId !== address.profileId) {
      throw new HttpException(
        { message: 'Forbidden: Cannot update address of another user' },
        HttpStatus.FORBIDDEN,
      );
    }

    const payload: UpdateAddressRequestDto = { id, ...dto };

    try {
      const result = await this.updateAddressUseCase.execute(payload);

      if (result.isLeft()) {
        const err = result.value;

        if (err instanceof InvalidInputError) {
          throw new HttpException(
            { message: err.message, errors: err.details },
            HttpStatus.BAD_REQUEST,
          );
        }

        if (err instanceof ResourceNotFoundError) {
          throw new HttpException(
            { message: err.message },
            HttpStatus.NOT_FOUND,
          );
        }

        throw new HttpException(
          { message: err.message },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const updated = result.value;
      return {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };
    } catch (err: any) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new HttpException(
        { message: err.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: UserPayload,
  ) {
    // First, get the address to check ownership
    const address = await this.prisma.address.findUnique({
      where: { id },
      select: { profileId: true },
    });

    if (!address) {
      throw new HttpException(
        { message: 'Address not found' },
        HttpStatus.NOT_FOUND,
      );
    }

    // Validate that the address belongs to the current user
    const userProfileId = await this.getProfileIdFromIdentityId(user.sub);
    if (!userProfileId || userProfileId !== address.profileId) {
      throw new HttpException(
        { message: 'Forbidden: Cannot delete address of another user' },
        HttpStatus.FORBIDDEN,
      );
    }

    try {
      const result = await this.deleteAddressUseCase.execute({
        id,
      } as DeleteAddressRequest);

      if (result.isLeft()) {
        const err = result.value;
        if (err instanceof ResourceNotFoundError) {
          throw new HttpException(
            { message: err.message },
            HttpStatus.NOT_FOUND,
          );
        }
        // qualquer outro Left vira 500
        throw new HttpException(
          { message: err.message },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // No Content
      return;
    } catch (err: any) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new HttpException(
        { message: err.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
