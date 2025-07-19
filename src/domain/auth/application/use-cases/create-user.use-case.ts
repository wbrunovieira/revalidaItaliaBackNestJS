// src/domain/auth/application/use-cases/create-user.use-case.ts
import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IUserRepository } from '@/domain/auth/application/repositories/i-user-repository';
import { hash } from 'bcryptjs';
import { User, CreateUserProps } from '@/domain/auth/enterprise/entities/user.entity';
import { CreateUserRequest } from '../dtos/create-user-request.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { DuplicateEmailError } from './errors/duplicate-email-error';
import { DuplicateNationalIdError } from './errors/duplicate-national-id-error';
import { RepositoryError } from './errors/repository-error';
import { createUserSchema } from './validations/create-user.schema';

type CreateUserUseCaseResponse = Either<
  | InvalidInputError
  | DuplicateEmailError
  | DuplicateNationalIdError
  | RepositoryError
  | Error,
  { user: Omit<CreateUserProps, 'password'> & { id: string } }
>;

@Injectable()
export class CreateUserUseCase {
  private readonly saltRounds: number;

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly configService: ConfigService,
  ) {
    this.saltRounds = this.configService.get<number>('crypto.saltRounds', 10);
  }

  async execute(
    request: CreateUserRequest,
  ): Promise<CreateUserUseCaseResponse> {
    const parse = createUserSchema.safeParse(request);
    if (!parse.success) {
      const details = parse.error.issues.map((issue) => {
        const detail: any = {
          code: issue.code,
          message: issue.message,
          path: issue.path,
        };

        if (issue.code === 'invalid_type') {
          detail.expected = 'string';
          detail.received = (issue as any).received;
        } else if ('expected' in issue) {
          detail.expected = (issue as any).expected;
        }
        if ('received' in issue && issue.code !== 'invalid_type') {
          detail.received = (issue as any).received;
        }
        if ('validation' in issue)
          detail.validation = (issue as any).validation;
        if ('minimum' in issue) detail.minimum = (issue as any).minimum;
        if ('inclusive' in issue) detail.inclusive = (issue as any).inclusive;
        if ('exact' in issue) detail.exact = (issue as any).exact;
        return detail;
      });
      return left(new InvalidInputError('Validation failed', details));
    }
    const { name, email, password, nationalId, role } = parse.data;
    const source = request.source || 'admin'; // Default to admin since controller has @Roles('admin')

    try {
      const emailExists = await this.userRepository.findByEmail(email);
      if (emailExists.isRight() && emailExists.value !== null) {
        return left(new DuplicateEmailError());
      }
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }

    try {
      const nationalIdExists = await this.userRepository.findByNationalId(nationalId);
      if (nationalIdExists.isRight() && nationalIdExists.value !== null) {
        return left(new DuplicateNationalIdError());
      }
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }

    let hashed: string;
    try {
      hashed = await hash(password, this.saltRounds);
    } catch {
      return left(new RepositoryError('Error hashing password'));
    }

    let user: User;
    try {
      // User.create pode lançar erro dos VOs
      user = User.create({ name, email, password: hashed, nationalId, role }, undefined, source);
    } catch (err: any) {
      // Erros de validação dos VOs
      return left(new InvalidInputError(err.message, []));
    }
    
    try {
      const r = await this.userRepository.create(user);
      if (r.isLeft()) {
        return left(new RepositoryError(r.value.message));
      }
      
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }

    return right({ user: user.toResponseObject() });
  }
}
