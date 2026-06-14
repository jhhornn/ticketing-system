// src/backend/api/auth/guards/event-owner.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../../common/database/prisma.service.js';
import { AUTH_GUARD_MESSAGES } from '../auth.constants.js';
import { AuthenticatedRequest, getRequiredUser } from './auth-request.types.js';

@Injectable()
export class EventOwnerGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = getRequiredUser(request);
    const eventId = request.params.id as string;

    if (!eventId) {
      throw new ForbiddenException(AUTH_GUARD_MESSAGES.eventIdNotProvided);
    }

    // Admin users can manage all events
    if (user.role === Role.ADMIN) {
      return true;
    }

    // Check if user created this event
    const event = await this.prisma.event.findUnique({
      where: { id: BigInt(eventId) },
      select: {
        id: true,
        createdBy: true,
      },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    if (event.createdBy !== user.id) {
      throw new ForbiddenException(
        AUTH_GUARD_MESSAGES.noPermissionToManageEvent,
      );
    }

    return true;
  }
}
