// src/domain/auth/application/use-cases/authenticate-user.use-case.ts

import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { compare } from 'bcryptjs';

import { IUserRepository } from '../repositories/i-user-repository';
import { AuthenticationError } from './errors/authentication-error';
import type { UserProps } from '@/domain/auth/enterprise/entities/user.entity';
import { Either, left, right } from '@/core/either';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export interface AuthenticateUserRequest {
  email: string;
  password: string;
}

export type AuthenticateUserResponse = Either<
  AuthenticationError,
  { user: Omit<UserProps, 'password'> & { id: string } }
>;

@Injectable()
export class AuthenticateUserUseCase {
  constructor(private repo: IUserRepository) {}

  async execute(
    req: AuthenticateUserRequest,
  ): Promise<AuthenticateUserResponse> {
    const rawEmail = req.email;
    if (typeof rawEmail === 'string' && /['";=]/.test(rawEmail)) {
      return left(new AuthenticationError());
    }

    const parsed = schema.safeParse(req);
    if (!parsed.success) {
      const issue = parsed.error.issues[0].message;
      return left(new AuthenticationError(issue));
    }
    let { email, password } = parsed.data;

    email = email.trim().toLowerCase();

    const found = await this.repo.findByEmail(email);
    if (found.isLeft()) {
      return left(new AuthenticationError());
    }
    const user = found.value;
    
    if (!user) {
      return left(new AuthenticationError());
    }

    const match = await compare(password, (user as any).props.password);
    if (!match) {
      return left(new AuthenticationError());
    }

    return right({
      user: user.toResponseObject(),
    });
  }
}
