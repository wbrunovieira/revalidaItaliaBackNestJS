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
} from '@nestjs/common';
import { CreateAddressUseCase } from '@/domain/auth/application/use-cases/create-address.use-case';

import { UpdateAddressUseCase } from '@/domain/auth/application/use-cases/update-address.use-case';
import { CreateAddressRequestDto } from '@/domain/auth/application/dtos/create-address-request.dto';
import { UpdateAddressRequestDto } from '@/domain/auth/application/dtos/update-address-request.dto';
import { InvalidInputError } from '@/domain/auth/application/use-cases/errors/invalid-input-error';
import { ResourceNotFoundError } from '@/domain/auth/application/use-cases/errors/resource-not-found-error';
import { Prisma } from '@prisma/client';
import { UpdateAddressDto } from '@/domain/auth/application/dtos/update-address.dto';
import {
  DeleteAddressRequest,
  DeleteAddressUseCase,
} from '@/domain/auth/application/use-cases/delete-address.use-case';
import { FindAddressByProfileUseCase as FindAddressByUserUseCase } from '@/domain/auth/application/use-cases/find-address-by-profile.use-case';

@Controller('addresses')
export class AddressController {
  constructor(
    private readonly createAddressUseCase: CreateAddressUseCase,
    private readonly findAddressByUserUseCase: FindAddressByUserUseCase,
    private readonly updateAddressUseCase: UpdateAddressUseCase,
    private readonly deleteAddressUseCase: DeleteAddressUseCase,
  ) {}

  @Post()
  @HttpCode(201)
  async create(@Body() dto: CreateAddressRequestDto) {
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
        `Missing required fields: ${missing.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const result = await this.createAddressUseCase.execute(dto);

      if (result.isLeft()) {
        const err = result.value;

        if (err instanceof InvalidInputError) {
          throw new HttpException(
            { message: err.message, errors: { details: err.details } },
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
          { message: 'User not found' },
          HttpStatus.NOT_FOUND,
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
  async findByUser(@Query('profileId') profileId: string) {
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
  async update(@Param('id') id: string, @Body() dto: UpdateAddressDto) {
    const payload: UpdateAddressRequestDto = { id, ...dto };

    try {
      const result = await this.updateAddressUseCase.execute(payload);

      if (result.isLeft()) {
        const err = result.value;

        if (err instanceof InvalidInputError) {
          throw new HttpException(
            { message: err.message, errors: { details: err.details } },
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
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
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
