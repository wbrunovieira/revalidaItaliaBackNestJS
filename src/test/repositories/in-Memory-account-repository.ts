import { Either, left, right } from "@/core/either";

import { PaginationParams } from "@/core/repositories/pagination-params";
import { IAccountRepository } from "@/domain/auth/application/repositories/i-account-repository";
import { ResourceNotFoundError } from "@/domain/auth/application/use-cases/errors/resource-not-found-error";
import { User } from "@/domain/auth/enterprise/entities/user.entity";



export class InMemoryAccountRepository implements IAccountRepository {
    findByVerificationToken(token: string): Promise<User | null> {
      throw new Error("Method not implemented.");
    }
    updatePassword(userId: string, password: string): Promise<Either<Error, void>> {
      throw new Error("Method not implemented.");
    }
    public items: User[] = [];

    async findById(id: string): Promise<Either<Error, User>> {
        const user = this.items.find((item) => item.id.toString() === id);
        if (!user) {
            return left(new ResourceNotFoundError("User not found"));
        }
        return right(user);
    }

    async create(user: User): Promise<Either<Error, void>> {
        this.items.push(user);
        return right(undefined);
    }

    async findByEmail(email: string): Promise<Either<Error, User>> {
        const user = this.items.find((item) => item.email === email);
        if (!user) {
            return left(new ResourceNotFoundError("User not found"));
        }
        return right(user);
    }

    async findAll(params: PaginationParams): Promise<Either<Error, User[]>> {
        return right(this.items);
    }

    async delete(user: User): Promise<Either<Error, void>> {
        this.items = this.items.filter(
            (item) => item.id.toString() !== user.id.toString()
        );
        return right(undefined);
    }

    async save(user: User): Promise<Either<Error, void>> {
        const index = this.items.findIndex(
            (item) => item.id.toString() === user.id.toString()
        );
        if (index !== -1) {
            this.items[index] = user;
            return right(undefined);
        }
        return left(new ResourceNotFoundError("User not found"));
    }
}