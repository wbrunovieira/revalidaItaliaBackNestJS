// src/domain/auth/application/repositories/i-user-repository.ts
import { Either } from '@/core/either';
import { User } from '../../enterprise/entities/user.entity';
import { PaginationParams } from '@/core/repositories/pagination-params';

export interface SearchFilters {
  name?: string;
  email?: string;
  nationalId?: string;
}

/**
 * Account Repository Interface
 * 
 * Defines the contract for account data access. Methods that search for
 * entities return null when not found, allowing use cases to decide
 * how to handle missing data.
 */
export abstract class IUserRepository {
  abstract findById(id: string): Promise<Either<Error, User | null>>;
  abstract create(user: User): Promise<Either<Error, void>>;
  abstract findByEmail(email: string): Promise<Either<Error, User | null>>;
  abstract findByNationalId(nationalId: string): Promise<Either<Error, User | null>>;
  abstract findAll(params: PaginationParams): Promise<Either<Error, User[]>>;
  abstract delete(user: User): Promise<Either<Error, void>>;
  abstract save(user: User): Promise<Either<Error, void>>;
  abstract findUsers(
    filters: SearchFilters,
    params: PaginationParams,
  ): Promise<Either<Error, User[]>>;

  abstract updatePassword(
    userId: string,
    password: string,
  ): Promise<Either<Error, void>>;
}
