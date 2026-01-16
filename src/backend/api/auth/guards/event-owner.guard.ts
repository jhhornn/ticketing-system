// src/backend/api/auth/guards/event-owner.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../../common/database/prisma.service.js';

interface RequestUser {
  id: string;
  role: string;
}

@Injectable()
export class EventOwnerGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as RequestUser;
    const eventId = request.params.id as string;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!eventId) {
      throw new ForbiddenException('Event ID not provided');
    }

    // Admin users can manage all events
    if (user.role === 'ADMIN') {
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
        'You do not have permission to manage this event',
      );
    }

    return true;
  }
}
