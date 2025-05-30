import { Controller, Post, Get, Query, Body, HttpCode, BadRequestException, InternalServerErrorException } from "@nestjs/common"
import { CreateAddressUseCase } from "@/domain/auth/application/use-cases/create-address.use-case"
import { FindAddressByUserUseCase } from "@/domain/auth/application/use-cases/find-address-by-user.use-case"
import { CreateAddressRequest } from "@/domain/auth/application/dtos/create-address-request.dto"
import { InvalidInputError } from "@/domain/auth/application/use-cases/errors/invalid-input-error"

@Controller("addresses")
export class AddressController {
  constructor(
    private readonly createAddress: CreateAddressUseCase,
    private readonly findAddressByUser: FindAddressByUserUseCase,
  ) {}

  @Post()
  @HttpCode(201)
  async create(@Body() dto: CreateAddressRequest) {
    try {
      const result = await this.createAddress.execute(dto)
      if (result.isLeft()) {
        const err = result.value
        if (err instanceof InvalidInputError) {
          throw new BadRequestException({
            message: err.message,
            errors: { details: err.details },
          })
        }
        throw new InternalServerErrorException(err.message)
      }
      return { addressId: result.value.addressId }
    } catch (err: any) {
      if (
        err instanceof BadRequestException ||
        err instanceof InternalServerErrorException
      ) {
        throw err
      }
      throw new InternalServerErrorException(err.message)
    }
  }

  @Get()
  async findByUser(@Query('userId') userId: string) {
    try {
      const result = await this.findAddressByUser.execute({ userId })
      if (result.isLeft()) {
        const err = result.value
        if (err instanceof InvalidInputError) {
          throw new BadRequestException({ message: err.message, errors: { details: err.details } })
        }
        throw new InternalServerErrorException(err.message)
      }
      // map each Address entity to its response object
      return result.value.map(addr => addr.toResponseObject())
    } catch (err: any) {
      if (
        err instanceof BadRequestException ||
        err instanceof InternalServerErrorException
      ) {
        throw err
      }
      throw new InternalServerErrorException(err.message)
    }
  }
}
