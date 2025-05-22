// src/infra/controllers/students.controller.ts
import {
  Controller,
  Post,
  Patch,
  Param,
  Body,
  HttpCode,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { CreateAccountUseCase } from "@/domain/auth/application/use-cases/create-account.use-case";
import { UpdateAccountUseCase } from "@/domain/auth/application/use-cases/update-account.use-case";
import { CreateAccountRequest } from "@/domain/auth/application/dtos/create-account-request.dto";
import { UpdateAccountRequest } from "@/domain/auth/application/dtos/update-account-request.dto";
import { InvalidInputError } from "@/domain/auth/application/use-cases/errors/invalid-input-error";
import { ResourceNotFoundError } from "@/domain/auth/application/use-cases/errors/resource-not-found-error";

@Controller("students")
export class StudentsController {
  constructor(
    private readonly createAccount: CreateAccountUseCase,
    private readonly updateAccount: UpdateAccountUseCase,
  ) {}

  @Post()
  @HttpCode(201)
  async create(@Body() dto: CreateAccountRequest) {
    const result = await this.createAccount.execute(dto);

    if (result.isLeft()) {
      const err = result.value;
      if (err instanceof InvalidInputError) {
        throw new BadRequestException({
          message: err.message,
          errors: { details: err.details },
        });
      }
      throw new ConflictException(err.message || "Failed to create account");
    }

    return { user: result.value.user };
  }

  @Patch(":id")
  @HttpCode(200)
  async update(
    @Param("id") id: string,
    @Body() dto: Omit<UpdateAccountRequest, "id">,
  ) {
    const request: UpdateAccountRequest = { id, ...dto };
    const result = await this.updateAccount.execute(request);

    if (result.isLeft()) {
      const err = result.value;

      if (err instanceof InvalidInputError) {
        throw new BadRequestException({
          message: err.message,
          errors: { details: err.details },
        });
      }

      if (err instanceof ResourceNotFoundError) {
        throw new BadRequestException(err.message);
      }

      // duplicate email/cpf or other conflicts
      throw new ConflictException(err.message || "Failed to update account");
    }

    return { user: result.value.user };
  }
}