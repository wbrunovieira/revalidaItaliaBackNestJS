import {
  Controller,
  Post,
  Patch,
  Param,
  Body,
  HttpCode,
  HttpException,
  HttpStatus,
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
        throw new HttpException(
          { message: err.message, errors: { details: err.details } },
          HttpStatus.BAD_REQUEST
        );
      }
      // Any other conflict (e.g. email/cpf) → 409
      throw new HttpException(err.message || "Failed to create account", HttpStatus.CONFLICT);
    }

    return { user: result.value.user };
  }

  @Patch(":id")
  @HttpCode(200)
  async update(
    @Param("id") id: string,
    @Body() dto: Omit<UpdateAccountRequest, "id">,
  ) {
    // ─── “Missing Fields” must be 400 + { message: "...", errors: { details: [] } } ───────────────────────────
    if (!dto || Object.keys(dto).length === 0) {
      throw new HttpException(
        { message: "At least one field to update must be provided", errors: { details: [] } },
        HttpStatus.BAD_REQUEST
      );
    }
    // ─────────────────────────────────────────────────────────────────────────────────────────────────────────

    const request: UpdateAccountRequest = { id, ...dto };
    const result = await this.updateAccount.execute(request);

    if (result.isLeft()) {
      const err = result.value;

      if (err instanceof InvalidInputError) {
        throw new HttpException(
          { message: err.message, errors: { details: err.details } },
          HttpStatus.BAD_REQUEST
        );
      }

      if (err instanceof ResourceNotFoundError) {

        throw new HttpException("User not found", HttpStatus.BAD_REQUEST);
      }


      throw new HttpException(err.message || "Failed to update account", HttpStatus.CONFLICT);
    }

    return { user: result.value.user };
  }
}