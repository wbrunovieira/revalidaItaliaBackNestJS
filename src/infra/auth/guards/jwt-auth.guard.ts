// src/infra/auth/guards/jwt-auth.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(ctx: ExecutionContext): boolean {
    const isPublic = this.reflector.get<boolean>(
      IS_PUBLIC_KEY,
      ctx.getHandler(),
    );
    if (isPublic) {
      return true;
    }

    return super.canActivate(ctx) as boolean;
  }
}
