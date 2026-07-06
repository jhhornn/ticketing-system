import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AUTH_METADATA_KEYS } from '../auth.constants.js';

export const Roles = (...roles: Role[]) =>
  SetMetadata(AUTH_METADATA_KEYS.roles, roles);
