import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { AUTH_METADATA_KEYS } from '../auth.constants.js';
import { AuthenticatedRequest } from './auth-request.types.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
      AUTH_METADATA_KEYS.roles,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const { user } = request;

    if (!user) {
      return false;
    }

    return requiredRoles.includes(user.role);
  }
}
