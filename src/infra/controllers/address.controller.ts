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
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { CreateAddressUseCase } from "@/domain/auth/application/use-cases/create-address.use-case";
import { FindAddressByUserUseCase } from "@/domain/auth/application/use-cases/find-address-by-user.use-case";
import { UpdateAddressRequest, UpdateAddressUseCase } from "@/domain/auth/application/use-cases/update-address.use-case";
import { CreateAddressRequest } from "@/domain/auth/application/dtos/create-address-request.dto";

import { InvalidInputError } from "@/domain/auth/application/use-cases/errors/invalid-input-error";
import { NotFoundError } from "rxjs/internal/util/NotFoundError";

@Controller("addresses")
export class AddressController {
  constructor(
    private readonly createAddress: CreateAddressUseCase,
    private readonly findAddressByUser: FindAddressByUserUseCase,
    private readonly updateAddress: UpdateAddressUseCase,
  ) {}

  @Post()
  @HttpCode(201)
  async create(@Body() dto: CreateAddressRequest) {
    try {
      const result = await this.createAddress.execute(dto);
      if (result.isLeft()) {
        const err = result.value;
        if (err instanceof InvalidInputError) {
          throw new BadRequestException({
            message: err.message,
            errors: { details: err.details },
          });
        }
        throw new InternalServerErrorException(err.message);
      }
      return { addressId: result.value.addressId };
    } catch (err: any) {
      if (
        err instanceof BadRequestException ||
        err instanceof InternalServerErrorException
      ) {
        throw err;
      }
      throw new InternalServerErrorException(err.message);
    }
  }

  @Get()
  async findByUser(@Query('userId') userId: string) {
    try {
      const result = await this.findAddressByUser.execute({ userId });
      if (result.isLeft()) {
        const err = result.value;
        if (err instanceof InvalidInputError) {
          throw new BadRequestException({
            message: err.message,
            errors: { details: err.details },
          });
        }
        throw new InternalServerErrorException(err.message);
      }
      return result.value.map(addr => addr.toResponseObject());
    } catch (err: any) {
      if (
        err instanceof BadRequestException ||
        err instanceof InternalServerErrorException
      ) {
        throw err;
      }
      throw new InternalServerErrorException(err.message);
    }
  }

  @Patch(':id')
  @HttpCode(200)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAddressRequest,
  ) {

    const { id: _dtoId, ...payload } = dto;

    try {
      const result = await this.updateAddress.execute({ id, ...payload });
      if (result.isLeft()) {
        const err = result.value;
        if (err instanceof InvalidInputError) {
          throw new BadRequestException({
            message: err.message,
            errors: { details: err.details },
          });
        }
        if (err instanceof NotFoundError) {

                   throw new BadRequestException({ message: err.message });
        }
        throw new InternalServerErrorException(err.message);
      }
      return result.value.toResponseObject();
    } catch (err: any) {
      if (
        err instanceof BadRequestException ||
        err instanceof InternalServerErrorException
      ) {
        throw err;
      }
      throw new InternalServerErrorException(err.message);
    }
  }
}