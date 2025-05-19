import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';


@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1) Retrieve required roles metadata for this handler
    const roles = this.reflector.get<string[]>(ROLES_KEY, context.getHandler());

    // 2) If no roles are specified, allow access
    if (!roles || roles.length === 0) {
      return true;
    }

    // 3) Get the authenticated user from the request
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // 4) If there's no user, deny access
    if (!user) {
      return false;
    }

    // 5) Check if user's role is one of the required roles
    return roles.includes(user.role);
  }
}
