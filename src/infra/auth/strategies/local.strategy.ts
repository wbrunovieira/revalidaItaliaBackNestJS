// src/infra/auth/strategies/local.strategy.ts

import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthenticateUserUseCase } from '@/domain/auth/application/use-cases/authentication/authenticate-user.use-case';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authenticateUseCase: AuthenticateUserUseCase) {
    // por padrão ele usa campos "username" e "password"
    // se quiser usar "email" em vez de "username", ajuste abaixo:
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string) {
    const result = await this.authenticateUseCase.execute({ email, password });

    if (result.isLeft()) {
      // falha de credenciais ou validação
      throw new UnauthorizedException(result.value.message);
    }

    // retorna o objeto user para anexar em req.user
    return result.value.user;
  }
}
