import { Test, TestingModule } from "@nestjs/testing";
import { ConflictException }    from "@nestjs/common";
import { left, right }          from "@/core/either";
import { vi }                   from "vitest";
import {StudentsController }    from "./students.controller";
import { CreateAccountUseCase } from "@/domain/auth/application/use-cases/create-account.use-case";
import { CreateAccountDto }     from "@/domain/auth/application/dtos/create-account.dto";
import type { UserProps }       from "@/domain/auth/enterprise/entities/user.entity";

describe("AccountController", () => {
  let controller: StudentsController;
  let createAccount: CreateAccountUseCase;

  const dto: CreateAccountDto = {
    name:     "Jane Doe",
    cpf:      "12345678901",
    email:    "jane@example.com",
    password: "Str0ngP@ss!",
    role:     "student",
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentsController],
      providers: [
        {
          provide: CreateAccountUseCase,
          useValue: { execute: vi.fn() },
        },
      ],
    }).compile();

    controller = module.get(StudentsController);
    createAccount = module.get(CreateAccountUseCase);
  });

  it("should return created user when use-case succeeds", async () => {
    const fakeUser: Omit<UserProps, "password"> & { id: string } = {
      id:               "uuid-1",
      name:             dto.name,
      cpf:              dto.cpf,
      email:            dto.email,
      role:             dto.role,
      phone:            undefined,
      paymentToken:     null,
      birthDate:        undefined,
      lastLogin:        undefined,
      profileImageUrl:  undefined,
      createdAt:        new Date(),
      updatedAt:        new Date(),
    };

    vi.spyOn(createAccount, "execute").mockResolvedValueOnce(
      right({ user: fakeUser }) as any
    );

    const result = await controller.create(dto);
    expect(result).toEqual({ user: fakeUser });
    expect(createAccount.execute).toHaveBeenCalledWith(dto);
  });

  it("should throw ConflictException when use-case returns Left with message", async () => {
    vi.spyOn(createAccount, "execute").mockResolvedValueOnce(
      left(new Error("Email already in use")) as any
    );

    const promise = controller.create(dto);
    await expect(promise).rejects.toThrow(ConflictException);
    await expect(promise).rejects.toThrow("Email already in use");
    expect(createAccount.execute).toHaveBeenCalledWith(dto);
  });

  it("should throw ConflictException with default message when Left has no message", async () => {
    vi.spyOn(createAccount, "execute").mockResolvedValueOnce(
      left(new Error("")) as any
    );

    const promise = controller.create(dto);
    await expect(promise).rejects.toThrow(ConflictException);
    await expect(promise).rejects.toThrow("Failed to create account");
    expect(createAccount.execute).toHaveBeenCalledWith(dto);
  });

  it("should propagate if use-case throws unexpectedly", async () => {
    const unexpected = new Error("something bad");
    vi.spyOn(createAccount, "execute").mockImplementationOnce(() => {
      throw unexpected;
    });

    await expect(controller.create(dto)).rejects.toThrow("something bad");
  });
});