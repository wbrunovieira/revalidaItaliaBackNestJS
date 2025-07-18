// src/domain/auth/application/use-cases/create-account.use-case.ts
import { Either, left, right } from '@/core/either';
import { Injectable, Inject } from '@nestjs/common';
import { IAccountRepository } from '@/domain/auth/application/repositories/i-account-repository';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { User, UserProps } from '@/domain/auth/enterprise/entities/user.entity';
import { CreateAccountRequest } from '../dtos/create-account-request.dto';
import { InvalidInputError } from './errors/invalid-input-error';
import { DuplicateEmailError } from './errors/duplicate-email-error';
import { DuplicateCPFError } from './errors/duplicate-cpf-error';
import { RepositoryError } from './errors/repository-error';

const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(
    /[^A-Za-z0-9]/,
    'Password must contain at least one special character',
  );

const createAccountSchema = z.object({
  name: z.string().min(3, 'User name must be at least 3 characters long'),
  email: z.string().email('Invalid email'),
  password: passwordSchema,
  cpf: z.string().min(1, 'Document is required'),
  role: z.enum(['admin', 'tutor', 'student']),
});

type CreateAccountUseCaseResponse = Either<
  | InvalidInputError
  | DuplicateEmailError
  | DuplicateCPFError
  | RepositoryError
  | Error,
  { user: Omit<UserProps, 'password'> & { id: string } }
>;

@Injectable()
export class CreateAccountUseCase {
  constructor(
    private readonly accountRepository: IAccountRepository,
    @Inject('SALT_ROUNDS') private readonly saltRounds: number,
  ) {}

  async execute(
    request: CreateAccountRequest,
  ): Promise<CreateAccountUseCaseResponse> {
    const parse = createAccountSchema.safeParse(request);
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
    const { name, email, password, cpf, role } = parse.data;

    try {
      if ((await this.accountRepository.findByEmail(email)).isRight()) {
        return left(new DuplicateEmailError());
      }
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }

    try {
      if ((await this.accountRepository.findByCpf(cpf)).isRight()) {
        return left(new DuplicateCPFError());
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

    const user = User.create({ name, email, password: hashed, cpf, role });
    try {
      const r = await this.accountRepository.create(user);
      if (r.isLeft()) {
        return left(new RepositoryError(r.value.message));
      }
    } catch (err: any) {
      return left(new RepositoryError(err.message));
    }

    return right({ user: user.toResponseObject() });
  }
}
