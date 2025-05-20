// src/domain/auth/application/use-cases/create-account.use-case.ts
import { Either, left, right } from "@/core/either";
import { Injectable, Inject } from "@nestjs/common";
import { IAccountRepository } from "@/domain/auth/application/repositories/i-account-repository";
import { hash } from "bcryptjs";
import { z } from "zod";
import { User, UserProps } from "@/domain/auth/enterprise/entities/user.entity";
import { InvalidInputError } from "./errors/invalid-input-error";
import { DuplicateEmailError } from "./errors/duplicate-email-error";
import { RepositoryError } from "./errors/repository-error";
import { CreateAccountRequest } from "../dtos/create-account-request.dto";


const createAccountSchema = z.object({
  name:     z.string().min(3, "User name must be at least 3 characters long"),
  email:    z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  cpf:      z.string().regex(/^\d{11}$/, "CPF must be 11 digits"),
  role:     z.enum(["admin", "tutor", "student"]),
});


type CreateAccountUseCaseResponse = Either<
  InvalidInputError | DuplicateEmailError | RepositoryError | Error,
  { user: Omit<UserProps, "password"> & { id: string } }
>;

@Injectable()
export class CreateAccountUseCase {
  constructor(
    private readonly accountRepository: IAccountRepository,
    @Inject("SALT_ROUNDS") private readonly saltRounds: number,
  ) {}

  async execute(
    request: CreateAccountRequest,
  ): Promise<CreateAccountUseCaseResponse> {
    // 1) Validate input
    const parseResult = createAccountSchema.safeParse(request);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      return left(new InvalidInputError(issue.message));
    }
    const { name, cpf, email, password, role } = parseResult.data;

    // 2) Ensure email not in use
    try {
      const existing = await this.accountRepository.findByEmail(email);
      if (existing.isRight()) {
        return left(new DuplicateEmailError());
      }
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }

    // 3) Hash password
    let hashedPassword: string;
    try {
      hashedPassword = await hash(password, this.saltRounds);
    } catch {
      return left(new RepositoryError("Error hashing password"));
    }

    // 4) Create domain entity
    const user = User.create({ name, cpf, email, password: hashedPassword, role });

    // 5) Persist user
    try {
      const result = await this.accountRepository.create(user);
      if (result.isLeft()) {
        return left(new RepositoryError(result.value.message));
      }
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }

    // 6) Success
    return right({ user: user.toResponseObject() });
  }
}
