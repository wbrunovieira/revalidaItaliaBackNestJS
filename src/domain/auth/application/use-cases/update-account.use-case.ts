// src/domain/auth/application/use-cases/update-account.use-case.ts

import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { IAccountRepository } from '@/domain/auth/application/repositories/i-account-repository';
import { User, UserProps } from '@/domain/auth/enterprise/entities/user.entity';
import { UpdateAccountRequest } from '../dtos/update-account-request.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { ResourceNotFoundError } from './errors/resource-not-found-error';
import { DuplicateEmailError } from './errors/duplicate-email-error';
import { DuplicateCPFError } from './errors/duplicate-cpf-error';
import { RepositoryError } from './errors/repository-error';

type UpdateAccountUseCaseResponse = Either<
  | InvalidInputError
  | ResourceNotFoundError
  | DuplicateEmailError
  | DuplicateCPFError
  | RepositoryError
  | Error,
  { user: Omit<UserProps, 'password'> & { id: string } }
>;

@Injectable()
export class UpdateAccountUseCase {
  constructor(private readonly accountRepository: IAccountRepository) {}

  async execute(
    request: UpdateAccountRequest,
  ): Promise<UpdateAccountUseCaseResponse> {
    const { id, name, email, cpf, role } = request;

    if (!name && !email && !cpf && !role) {
      return left(
        new InvalidInputError('At least one field must be provided', []),
      );
    }

    let existing: User | undefined;
    try {
      const found = await this.accountRepository.findById(id);
      if (found.isLeft()) {
        return left(found.value);
      }
      existing = found.value;
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }

    if (!existing) {
      return left(new ResourceNotFoundError('User not found'));
    }

    if (email && email !== existing.email) {
      try {
        const byEmail = await this.accountRepository.findByEmail(email);
        if (byEmail.isRight()) {
          return left(new DuplicateEmailError());
        }
      } catch (err: any) {
        return left(new RepositoryError(err.message));
      }
    }

    if (cpf && cpf !== existing.cpf) {
      try {
        const byCpf = await this.accountRepository.findByCpf(cpf);
        if (byCpf.isRight()) {
          return left(new DuplicateCPFError());
        }
      } catch (err: any) {
        return left(new RepositoryError(err.message));
      }
    }

    existing.updateProfile({ name, email, cpf, role });

    try {
      const saved = await this.accountRepository.save(existing);
      if (saved.isLeft()) {
        return left(new RepositoryError(saved.value.message));
      }
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }

    return right({ user: existing.toResponseObject() });
  }
}
