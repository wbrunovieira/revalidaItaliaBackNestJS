// src/test/repositories/in-memory-account-repository.ts
import { Either, left, right } from '@/core/either';
import { PaginationParams } from '@/core/repositories/pagination-params';
import { IAccountRepository } from '@/domain/auth/application/repositories/i-account-repository';
import { ResourceNotFoundError } from '@/domain/auth/application/use-cases/errors/resource-not-found-error';
import { User } from '@/domain/auth/enterprise/entities/user.entity';

export class InMemoryAccountRepository implements IAccountRepository {
  public items: User[] = [];

  async findByVerificationToken(token: string): Promise<User | null> {
    throw new Error('Method not implemented.');
  }

  async updatePassword(
    userId: string,
    password: string,
  ): Promise<Either<Error, void>> {
    const index = this.items.findIndex((item) => item.id.toString() === userId);
    if (index === -1) {
      return left(new ResourceNotFoundError('User not found'));
    }
    // In a real implementation, you would update the password
    // For now, we'll just return success
    return right(undefined);
  }

  async findById(id: string): Promise<Either<Error, User>> {
    const user = this.items.find((item) => item.id.toString() === id);
    if (!user) {
      return left(new ResourceNotFoundError('User not found'));
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
      return left(new ResourceNotFoundError('User not found'));
    }
    return right(user);
  }

  async findByCpf(cpf: string): Promise<Either<Error, User>> {
    const user = this.items.find((item) => item.cpf === cpf);
    if (!user) {
      return left(new ResourceNotFoundError('User not found'));
    }
    return right(user);
  }

  async findAll(params: PaginationParams): Promise<Either<Error, User[]>> {
    try {
      const { page, pageSize } = params;

      // Validate parameters
      if (page < 1 || pageSize < 1) {
        return left(new Error('Invalid pagination parameters'));
      }

      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;

      // Sort by createdAt descending (newest first)
      const sortedItems = [...this.items].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );

      const paginatedItems = sortedItems.slice(startIndex, endIndex);

      return right(paginatedItems);
    } catch (error) {
      return left(new Error('Failed to retrieve users'));
    }
  }

  async delete(user: User): Promise<Either<Error, void>> {
    this.items = this.items.filter(
      (item) => item.id.toString() !== user.id.toString(),
    );
    return right(undefined);
  }

  async save(user: User): Promise<Either<Error, void>> {
    const index = this.items.findIndex(
      (item) => item.id.toString() === user.id.toString(),
    );
    if (index !== -1) {
      this.items[index] = user;
      return right(undefined);
    }
    return left(new ResourceNotFoundError('User not found'));
  }
}
