import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserPayload } from '@/infra/auth/strategies/jwt.strategy';

import { AuthenticateUserUseCase } from '@/domain/auth/application/use-cases/authentication/authenticate-user.use-case';
import { AuthenticateUserRequestDto } from '@/domain/auth/application/dtos/authenticate-user-request.dto';

@Injectable()
export class SignInService {
  constructor(
    private authenticateUseCase: AuthenticateUserUseCase,
    private jwtService: JwtService,
  ) {}

  async signIn(dto: AuthenticateUserRequestDto) {
    // 1) Executa o use-case
    const result = await this.authenticateUseCase.execute(dto);
    if (result.isLeft()) {
      // repassa o erro de credenciais
      throw result.value;
    }

    // 2) Gera o JWT
    const user = result.value.user;
    const payload: UserPayload = { sub: user.identityId, role: user.role };
    const token = this.jwtService.sign(payload);

    // 3) Retorna token e dados do user
    return { token, user };
  }
}
