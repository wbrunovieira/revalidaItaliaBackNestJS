// src/domain/auth/application/use-cases/authenticate-user.use-case.ts

import { Injectable } from '@nestjs/common'
import { z } from 'zod'
import { compare } from 'bcryptjs'

import { IAccountRepository } from '../repositories/i-account-repository'

import { AuthenticationError } from './errors/authentication-error'
import type { UserProps } from '@/domain/auth/enterprise/entities/user.entity'
import { Either, left, right } from '@/core/either'

// 1) Esquema de validação
const schema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(6,   'Password must be at least 6 characters long'),
})
export interface AuthenticateUserRequest {
  email:    string
  password: string
}

// 2) Tipo de retorno: se deu certo, retorna o user sem a senha
export type AuthenticateUserResponse =
  Either<
    AuthenticationError,
    { user: Omit<UserProps, 'password'> & { id: string } }
  >

@Injectable()
export class AuthenticateUserUseCase {
  constructor(private repo: IAccountRepository) {}

  async execute(
    req: AuthenticateUserRequest,
  ): Promise<AuthenticateUserResponse> {
    // 1) parse + validação
    const parsed = schema.safeParse(req)
    if (!parsed.success) {
      const issue = parsed.error.issues[0].message
      return left(new AuthenticationError(issue))
    }
    const { email, password } = parsed.data

    // 2) buscar usuário
    const found = await this.repo.findByEmail(email)
    if (found.isLeft()) {
      // não encontrou ou erro no repositório
      return left(new AuthenticationError())
    }
    const user = found.value

    // 3) comparar senhas
    const match = await compare(password, (user as any).props.password)
    if (!match) {
      return left(new AuthenticationError())
    }

    // 4) retorno
    return right({
      user: user.toResponseObject(),
    })
  }
}