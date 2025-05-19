import { Injectable } from '@nestjs/common';
import { IAccountRepository } from 'src/domain/auth/application/repositories/i-account-repository';
import { Either } from 'src/core/either';
import { User } from 'src/domain/auth/enterprise/entities/user.entity';
import { PaginationParams } from 'src/core/repositories/pagination-params';

@Injectable()
export class AccountRepository implements IAccountRepository {
  findById(id: string): Promise<Either<Error, User>> {
    throw new Error('Method not implemented.');
  }

  create(account: User): Promise<Either<Error, void>> {
    throw new Error('Method not implemented.');
  }

  findByEmail(email: string): Promise<Either<Error, User>> {
    throw new Error('Method not implemented.');
  }

  findAll(params: PaginationParams): Promise<Either<Error, User[]>> {
    throw new Error('Method not implemented.');
  }

  delete(account: User): Promise<Either<Error, void>> {
    throw new Error('Method not implemented.');
  }

  save(account: User): Promise<Either<Error, void>> {
    throw new Error('Method not implemented.');
  }

  findByVerificationToken(token: string): Promise<User | null> {
    throw new Error('Method not implemented.');
  }

  updatePassword(userId: string, password: string): Promise<Either<Error, void>> {
    throw new Error('Method not implemented.');
  }
}
