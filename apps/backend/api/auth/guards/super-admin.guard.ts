// src/backend/api/auth/guards/super-admin.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { AUTH_GUARD_MESSAGES } from '../auth.constants.js';
import { AuthenticatedRequest, getRequiredUser } from './auth-request.types.js';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = getRequiredUser(request);

    if (user.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException(
        AUTH_GUARD_MESSAGES.superAdminAccessRequired,
      );
    }

    return true;
  }
}
