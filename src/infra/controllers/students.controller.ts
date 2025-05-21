import {
  Controller,
  Post,
  Body,
  HttpCode,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from "@nestjs/common";
import { CreateAccountUseCase } from "@/domain/auth/application/use-cases/create-account.use-case";
import { CreateAccountRequest } from "@/domain/auth/application/dtos/create-account-request.dto";
import { InvalidInputError } from "@/domain/auth/application/use-cases/errors/invalid-input-error";

@Controller("students")
export class StudentsController {
  constructor(private readonly createAccount: CreateAccountUseCase) {}

  @Post()
  @HttpCode(201)
  async create(@Body() dto: CreateAccountRequest) {
    const result = await this.createAccount.execute(dto);

    if (result.isLeft()) {
      const err = result.value;

      // input validation errors -> 400
      if (err instanceof InvalidInputError) {
        throw new BadRequestException({
          message: err.message,
          errors: { details: err.details },
        });
      }

      // any other error from use-case -> 409
      // const message = err.message || 'Failed to create account';
      // throw new ConflictException(message);
      throw new ConflictException(err.message || "Failed to create account");
    }

    return { user: result.value.user };
  }
}