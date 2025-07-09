// src/infra/controllers/auth.controller.ts
import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthenticateUserUseCase } from '@/domain/auth/application/use-cases/authenticate-user.use-case';
import { AuthenticateUserRequest } from '@/domain/auth/application/use-cases/authenticate-user.use-case';
import {
  IS_PUBLIC_KEY,
  Public,
} from '@/infra/auth/decorators/public.decorator';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authenticateUser: AuthenticateUserUseCase,
    private readonly jwtService: JwtService,
  ) {}

  @Public()
  @Post('login')
  async login(@Body() dto: AuthenticateUserRequest) {
    const result = await this.authenticateUser.execute(dto);

    if (result.isLeft()) {
      throw new UnauthorizedException(result.value.message);
    }

    const { user } = result.value;

    const token = this.jwtService.sign({
      sub: user.id,
      role: user.role,
    });

    return { accessToken: token, user };
  }
}
