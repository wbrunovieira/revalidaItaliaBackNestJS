// src/domain/auth/application/use-cases/update-user.use-case.ts

import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { IUserRepository } from '@/domain/auth/application/repositories/i-user-repository';
import { User, UserProps } from '@/domain/auth/enterprise/entities/user.entity';
import { UpdateUserRequest } from '../dtos/update-user-request.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { ResourceNotFoundError } from './errors/resource-not-found-error';
import { DuplicateEmailError } from './errors/duplicate-email-error';
import { DuplicateNationalIdError } from './errors/duplicate-national-id-error';
import { RepositoryError } from './errors/repository-error';

type UpdateUserUseCaseResponse = Either<
  | InvalidInputError
  | ResourceNotFoundError
  | DuplicateEmailError
  | DuplicateNationalIdError
  | RepositoryError
  | Error,
  { user: Omit<UserProps, 'password'> & { id: string } }
>;

@Injectable()
export class UpdateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(
    request: UpdateUserRequest,
  ): Promise<UpdateUserUseCaseResponse> {
    const { id, name, email, nationalId, role } = request;

    if (!name && !email && !nationalId && !role) {
      return left(
        new InvalidInputError('At least one field must be provided', []),
      );
    }

    let existing: User | undefined;
    try {
      const found = await this.userRepository.findById(id);
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
        const byEmail = await this.userRepository.findByEmail(email);
        if (byEmail.isRight() && byEmail.value) {
          return left(new DuplicateEmailError());
        }
      } catch (err: any) {
        return left(new RepositoryError(err.message));
      }
    }

    if (nationalId && nationalId !== existing.nationalId) {
      try {
        const byNationalId = await this.userRepository.findByNationalId(nationalId);
        if (byNationalId.isRight() && byNationalId.value) {
          return left(new DuplicateNationalIdError());
        }
      } catch (err: any) {
        return left(new RepositoryError(err.message));
      }
    }

    existing.updateProfile({ name, email, nationalId, role });

    try {
      const saved = await this.userRepository.save(existing);
      if (saved.isLeft()) {
        return left(new RepositoryError(saved.value.message));
      }
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }

    return right({ user: existing.toResponseObject() });
  }
}
