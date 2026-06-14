import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { AUTH_GUARD_MESSAGES } from '../auth.constants.js';

export interface AuthRequestUser {
  id: string;
  email: string;
  role: Role;
  firstName: string | null;
  lastName: string | null;
}

export type AuthenticatedRequest = Request & {
  user?: AuthRequestUser;
};

export function getRequiredUser(
  request: AuthenticatedRequest,
): AuthRequestUser {
  const { user } = request;

  if (!user) {
    throw new ForbiddenException(AUTH_GUARD_MESSAGES.userNotAuthenticated);
  }

  return user;
}
