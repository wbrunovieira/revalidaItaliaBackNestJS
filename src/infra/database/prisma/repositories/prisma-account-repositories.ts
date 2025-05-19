import { PrismaService } from "@/prisma/prisma.service";
import { PaginationParams } from "@/core/repositories/pagination-params";

import { Injectable } from "@nestjs/common";

import { Either, left, right } from "@/core/either";
import { IAccountRepository } from "@/domain/auth/application/repositories/i-account-repository";


import { User } from "@/domain/auth/enterprise/entities/user.entity";
import { UniqueEntityID } from "@/core/unique-entity-id";
import { ResourceNotFoundError } from "@/domain/auth/application/use-cases/errors/resource-not-found-error";

@Injectable()
export class PrismaAccountRepository implements IAccountRepository {
    constructor(private prisma: PrismaService) {}

    private toDomain(user: any): User {
        return User.create(
            {
                ...user,
                createdAt: user.createdAt
                    ? new Date(user.createdAt)
                    : new Date(),
                updatedAt: user.updatedAt
                    ? new Date(user.updatedAt)
                    : new Date(),
            },
            user.id
        );
    }

    async findByVerificationToken(token: string): Promise<User | null> {
        console.log("findByVerificationToken token", token);
        const user = await this.prisma.user.findFirst({
            where: { verificationToken: token },
        });
        console.log("findByVerificationToken user", user);

        return user ? this.toDomain(user) : null;
    }

    async findById(id: string): Promise<Either<Error, User>> {
        try {
            const accountData = await this.prisma.user.findUnique({
                where: { id },
            });

            if (!accountData) {
                return left(new ResourceNotFoundError("User not found"));
            }

            const account = User.create(
                {
                  name: accountData.name,

                  email: accountData.email,
                  password: accountData.password,
                  phone: accountData.phone ?? undefined,
                  birthDate: accountData.birthDate ?? undefined,

                  profileImageUrl: accountData.profileImageUrl ?? undefined,
                  role: accountData.role as "student" | "admin" | "tutor",
                  cpf: accountData.cpf ?? undefined,
                },
                new UniqueEntityID(accountData.id)
            );

            return right(account);
        } catch (error) {
            return left(new Error("Database error"));
        }
    }

    async save(user: User): Promise<Either<Error, void>> {
        try {
            await this.prisma.user.update({
                where: { id: user.id.toString() },
                data: {
                    name: user.name,
                    email: user.email,
                
                    profileImageUrl: user.profileImageUrl,
           
                    role: user.role,
               
       
                    updatedAt: new Date(),
                },
            });
            return right(undefined);
        } catch (error) {
            return left(new Error("Failed to update user"));
        }
    }

    async updatePassword(
        userId: string,
        password: string
    ): Promise<Either<Error, void>> {
        try {
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    password,
                    updatedAt: new Date(),
                },
            });
            return right(undefined);
        } catch (error) {
            return left(new Error("Failed to update password"));
        }
    }

    async create(user: User): Promise<Either<Error, void>> {
        try {
            await this.prisma.user.create({
                data: {
                    id: user.id.toString(),
                    name: user.name,
                    email: user.email,
            
                    profileImageUrl: user.profileImageUrl,
                    role: user.role,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                },
            });
            return right(undefined);
        } catch (error) {
            return left(new Error("Failed to create user"));
        }
    }

    async delete(user: User): Promise<Either<Error, void>> {
        try {
            await this.prisma.user.delete({
                where: { id: user.id.toString() },
            });
            return right(undefined);
        } catch (error) {
            return left(new Error("Failed to delete user"));
        }
    }

    async findByEmail(email: string): Promise<Either<Error, User>> {
        try {
            const accountData = await this.prisma.user.findUnique({
                where: { email },
            });

            if (!accountData) {
                return left(new ResourceNotFoundError("User not found"));
            }

            const user = User.create(
                {
                  name: accountData.name,
                  email: accountData.email,
                  password: accountData.password,
                  role: accountData.role as "student" | "admin" | "tutor",
                  cpf: accountData.cpf ?? undefined,
                },
                new UniqueEntityID(accountData.id)
            );

            return right(user);
        } catch (error) {
            return left(new Error("Database error"));
        }
    }

    async findAll(params: PaginationParams): Promise<Either<Error, User[]>> {
        try {
            const accountsData = await this.prisma.user.findMany({
                skip: (params.page - 1) * params.pageSize,
                take: params.pageSize,
            });

            const accounts = accountsData.map((account) =>
                User.create(
                    {
                      name: account.name,
                      email: account.email,
                      password: account.password,
                      role: account.role as "student" | "admin" | "tutor",
                      cpf: account.cpf ?? undefined,
                    },
                    new UniqueEntityID(account.id)
                )
            );

            return right(accounts);
        } catch (error) {
            return left(new Error("Failed to find users"));
        }
    }
}