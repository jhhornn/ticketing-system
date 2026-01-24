// src/backend/api/events/events.service.ts
import { Injectable, NotFoundException, OnModuleInit, BadRequestException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/database/prisma.service.js';
import { AuditLogService } from '../../common/audit/audit-log.service.js';
import {
  CreateEventDto,
  UpdateEventDto,
  EventResponseDto,
} from './dto/events.dto.js';
import { EventStatus } from '../../common/enums/index.js';
import { Event } from '@prisma/client';

@Injectable()
export class EventsService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
  ) {}

  /**
   * Run status update when service initializes
   */
  async onModuleInit() {
    console.log('[EventsService] Initializing - updating event statuses...');
    await this.updateEventStatuses();
  }

  /**
   * Create an event - any authenticated user can create events
   * Venue capacity is auto-populated if using a registered venue
   */
  async create(dto: CreateEventDto, userId: string): Promise<EventResponseDto> {
    let totalSeats = dto.totalSeats;

    // If venueId provided, fetch venue and use its capacity
    if (dto.venueId) {
      const venue = await this.prisma.venue.findUnique({
        where: { id: BigInt(dto.venueId) },
        include: { venueSections: true },
      });

      if (venue) {
        totalSeats = venue.capacity;
      }

      // Create the event
      const event = await this.prisma.event.create({
        data: {
          eventName: dto.eventName,
          eventDate: new Date(dto.eventDate),
          venueId: BigInt(dto.venueId),
          customVenue: dto.customVenue,
          totalSeats,
          availableSeats: totalSeats,
          saleStartTime: dto.saleStartTime ? new Date(dto.saleStartTime) : null,
          isFree: dto.isFree || false,
          status: EventStatus.UPCOMING,
          createdBy: userId,
        },
        include: {
          venue: true,
        },
      });

      // Copy venue sections to event sections if venue has sections
      if (venue?.venueSections && venue.venueSections.length > 0) {
        console.log(`[EventsService] Copying ${venue.venueSections.length} sections from venue ${venue.name} to event ${event.eventName}`);
        
        for (const venueSection of venue.venueSections) {
          const eventSection = await this.prisma.eventSection.create({
            data: {
              eventId: event.id,
              venueId: venue.id, // Mark as venue-inherited
              name: venueSection.name,
              type: venueSection.type,
              price: 0, // Default price, can be updated later
              totalCapacity: venueSection.totalCapacity,
              allocated: 0,
            },
          });

          // Generate seats if it's an ASSIGNED section
          if (venueSection.type === 'ASSIGNED' && venueSection.rows && venueSection.seatsPerRow) {
            await this.generateSeatsForSection(
              Number(event.id),
              Number(eventSection.id),
              venueSection.rows,
              venueSection.seatsPerRow,
              0 // Default price
            );
          }
        }
      }

      return this.mapToDto(event);
    }

    // Create event without venue
    const event = await this.prisma.event.create({
      data: {
        eventName: dto.eventName,
        eventDate: new Date(dto.eventDate),
        venueId: null,
        customVenue: dto.customVenue,
        totalSeats,
        availableSeats: totalSeats,
        saleStartTime: dto.saleStartTime ? new Date(dto.saleStartTime) : null,
        isFree: dto.isFree || false,
        status: EventStatus.UPCOMING,
        createdBy: userId,
      },
      include: {
        venue: true,
      },
    });

    return this.mapToDto(event);
  }

  /**
   * Generate seats for a section (helper method for venue section inheritance)
   */
  private async generateSeatsForSection(
    eventId: number,
    sectionId: number,
    rows: number,
    seatsPerRow: number,
    price: number,
  ): Promise<void> {
    const seatsData: any[] = [];
    const rowLetters = this.generateRowLetters(rows);

    for (const row of rowLetters) {
      for (let i = 1; i <= seatsPerRow; i++) {
        seatsData.push({
          eventId: BigInt(eventId),
          sectionId: BigInt(sectionId),
          seatNumber: `${row}${i}`,
          rowNumber: row,
          seatType: 'REGULAR' as const,
          price,
          status: 'AVAILABLE' as const,
          version: 0,
        });
      }
    }

    await this.prisma.seat.createMany({
      data: seatsData,
    });
  }

  private generateRowLetters(count: number): string[] {
    const letters: string[] = [];
    for (let i = 0; i < count; i++) {
      if (i < 26) {
        letters.push(String.fromCharCode(65 + i)); // A-Z
      } else {
        const firstLetter = String.fromCharCode(65 + Math.floor(i / 26) - 1);
        const secondLetter = String.fromCharCode(65 + (i % 26));
        letters.push(firstLetter + secondLetter); // AA, AB, etc.
      }
    }
    return letters;
  }

  /**
   * Find all events - optionally filter by creator
   * For regular users, show all events (they can buy tickets to any event)
   */
  async findAll(
    userId?: string,
    onlyOwned: boolean = false,
  ): Promise<EventResponseDto[]> {
    let whereClause = {};

    // If filtering for owned events only
    if (onlyOwned && userId) {
      whereClause = { createdBy: userId };
    }

    const events = await this.prisma.event.findMany({
      where: whereClause,
      orderBy: { eventDate: 'asc' },
      include: {
        venue: true,
        discounts: {
          where: {
            isActive: true,
            OR: [
              { validUntil: null },
              { validUntil: { gte: new Date() } }
            ]
          },
          select: { id: true }
        }
      },
    });

    return events.map((event) => this.mapToDto(event));
  }

  async findOne(id: number): Promise<EventResponseDto> {
    const event = await this.prisma.event.findUnique({
      where: { id: BigInt(id) },
      include: {
        venue: true,
      },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return this.mapToDto(event);
  }

  /**
   * Check if an event allows ticket purchases
   */
  async canPurchaseTickets(eventId: number): Promise<{
    canPurchase: boolean;
    reason?: string;
  }> {
    const event = await this.prisma.event.findUnique({
      where: { id: BigInt(eventId) },
    });

    if (!event) {
      return { canPurchase: false, reason: 'Event not found' };
    }

    const now = new Date();

    // Check if event has passed
    if (event.eventDate < now) {
      return { canPurchase: false, reason: 'Event has already occurred' };
    }

    // Check if sales haven't started yet
    if (event.saleStartTime && event.saleStartTime > now) {
      return {
        canPurchase: false,
        reason: `Ticket sales start on ${event.saleStartTime.toLocaleString()}`,
      };
    }

    // Check if event is sold out
    if (event.availableSeats <= 0) {
      return { canPurchase: false, reason: 'Event is sold out' };
    }

    // Check if event status allows sales
    if (event.status !== EventStatus.ON_SALE && event.status !== EventStatus.UPCOMING) {
      return {
        canPurchase: false,
        reason: `Event is ${event.status.toLowerCase()}`,
      };
    }

    return { canPurchase: true };
  }

  /**
   * Update event - ownership is validated by EventOwnerGuard
   * Protects existing bookings from breaking changes
   */
  async update(id: number, dto: UpdateEventDto, userId?: string): Promise<EventResponseDto> {
    // Check if event exists
    const event = await this.prisma.event.findUnique({
      where: { id: BigInt(id) },
      include: {
        bookings: {
          where: { status: { in: ['CONFIRMED', 'PENDING'] } },
        },
        eventSections: true,
      },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    const hasBookings = event.bookings.length > 0;

    // SECURITY: Protect existing bookings from breaking changes
    if (hasBookings) {
      // Cannot reduce total capacity below what's already allocated
      if (dto.totalSeats && dto.totalSeats < event.totalSeats) {
        const totalAllocated = event.eventSections.reduce(
          (sum, section) => sum + section.allocated,
          0,
        );

        if (dto.totalSeats < totalAllocated) {
          throw new BadRequestException(
            `Cannot reduce capacity to ${dto.totalSeats}. ${totalAllocated} seats are already booked.`,
          );
        }
      }

      // Cannot change venue after bookings (invalidates sections/seats)
      if (dto.venueId && dto.venueId !== Number(event.venueId)) {
        throw new BadRequestException(
          'Cannot change venue after bookings have been made. This would invalidate existing tickets.',
        );
      }

      // Restrict event date changes to prevent confusion
      if (dto.eventDate) {
        const newDate = new Date(dto.eventDate);
        const currentDate = event.eventDate;
        const timeDiff = Math.abs(newDate.getTime() - currentDate.getTime());
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        // Allow minor adjustments (up to 48 hours)
        if (hoursDiff > 48) {
          throw new BadRequestException(
            `Cannot change event date by more than 48 hours after bookings exist. ` +
            `Please cancel existing bookings first or create a new event.`,
          );
        }
      }

      // Cannot change from paid to free or vice versa
      if (dto.isFree !== undefined && dto.isFree !== event.isFree) {
        throw new BadRequestException(
          'Cannot change pricing model (free/paid) after bookings have been made.',
        );
      }
    }

    // Audit log the changes
    await this.auditLog.log({
      entityType: 'Event',
      entityId: id,
      action: 'UPDATE',
      changes: dto,
      performedBy: userId || 'system',
      metadata: {
        hasBookings,
        bookingCount: event.bookings.length,
        oldValues: {
          eventName: event.eventName,
          eventDate: event.eventDate,
          totalSeats: event.totalSeats,
          venueId: event.venueId ? Number(event.venueId) : null,
          isFree: event.isFree,
        },
      },
    });

    const updatedEvent = await this.prisma.event.update({
      where: { id: BigInt(id) },
      data: {
        eventName: dto.eventName,
        eventDate: dto.eventDate ? new Date(dto.eventDate) : undefined,
        venueId: dto.venueId ? BigInt(dto.venueId) : undefined,
        customVenue: dto.customVenue,
        totalSeats: dto.totalSeats,
        status: dto.status,
        isFree: dto.isFree,
        saleStartTime: dto.saleStartTime
          ? new Date(dto.saleStartTime as string | number | Date)
          : undefined,
      },
      include: {
        venue: true,
      },
    });

    return this.mapToDto(updatedEvent);
  }

  /**
   * Delete event - ownership is validated by EventOwnerGuard
   */
  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.prisma.event.delete({
      where: { id: BigInt(id) },
    });
  }

  /**
   * Check if a user owns an event (created by the user)
   */
  async userOwnsEvent(userId: string, eventId: number): Promise<boolean> {
    const event = await this.prisma.event.findUnique({
      where: { id: BigInt(eventId) },
      select: { createdBy: true },
    });

    return event?.createdBy === userId;
  }

  private mapToDto(
    event: Event & { venue?: { name: string } | null; discounts?: any[] },
  ): EventResponseDto {
    return {
      id: Number(event.id),
      eventName: event.eventName,
      eventDate: event.eventDate,
      venueId: event.venueId ? Number(event.venueId) : null,
      venueName: event.venue?.name ?? null,
      customVenue: event.customVenue ?? null,
      totalSeats: event.totalSeats,
      availableSeats: event.availableSeats,
      status: event.status,
      saleStartTime: event.saleStartTime ?? new Date(),
      isFree: event.isFree,
      createdBy: event.createdBy,
      createdAt: event.createdAt,
      hasActiveDiscounts: event.discounts && event.discounts.length > 0,
    };
  }

  /**
   * Get event inventory (sections and seats)
   * Supports Hybrid Inventory (Assigned + General Admission)
   */
  async getEventInventory(eventId: number): Promise<any> {
    const sections = await this.prisma.eventSection.findMany({
      where: { eventId: BigInt(eventId) },
      include: {
        seats: {
          orderBy: [{ rowNumber: 'asc' }, { seatNumber: 'asc' }],
        },
      },
      orderBy: { price: 'desc' }, // Show most expensive first? or by name
    });

    const mappedSections = sections.map((section) => {
      const isGA = section.type === 'GENERAL';

      // Calculate Availability
      let availableCount = 0;
      if (isGA) {
        availableCount = section.totalCapacity - section.allocated;
      } else {
        // For Assigned, count seats with status AVAILABLE
        availableCount = section.seats.filter(
          (s) => s.status === 'AVAILABLE',
        ).length;
      }

      const payload: any = {
        id: Number(section.id),
        name: section.name,
        type: section.type,
        price: Number(section.price),
        capacity: {
          total: section.totalCapacity,
          available: availableCount,
        },
        mapCoordinates: section.mapCoordinates,
      };

      // Attach Seats only if Assigned
      // For performance, we might want to filter this based on user request, but for now include all
      if (!isGA) {
        payload.seats = section.seats.map((s) => ({
          id: Number(s.id),
          row: s.rowNumber,
          number: s.seatNumber,
          status: s.status,
          version: Number(s.version),
        }));
      }

      return payload;
    });

    return {
      eventId: Number(eventId),
      sections: mappedSections,
    };
  }

  /**
   * Scheduled job to update event statuses based on current date/time
   * Runs every hour to keep statuses in sync
   */
  @Cron(CronExpression.EVERY_HOUR)
  async updateEventStatuses(): Promise<void> {
    try {
      const now = new Date();

      // Mark past events as COMPLETED (if not already cancelled or sold out)
      await this.prisma.event.updateMany({
        where: {
          eventDate: { lt: now },
          status: { notIn: [EventStatus.CANCELLED, EventStatus.SOLD_OUT] },
        },
        data: {
          status: EventStatus.COMPLETED,
        },
      });

      // Mark events as ON_SALE if sale time has started and event hasn't occurred
      await this.prisma.event.updateMany({
        where: {
          saleStartTime: { lte: now },
          eventDate: { gte: now },
          status: EventStatus.UPCOMING,
          availableSeats: { gt: 0 },
        },
        data: {
          status: EventStatus.ON_SALE,
        },
      });

      // Mark events as SOLD_OUT if no seats available
      await this.prisma.event.updateMany({
        where: {
          availableSeats: { lte: 0 },
          status: { in: [EventStatus.ON_SALE, EventStatus.UPCOMING] },
        },
        data: {
          status: EventStatus.SOLD_OUT,
        },
      });

      console.log('[EventsService] Event statuses updated successfully');
    } catch (error) {
      console.error('[EventsService] Failed to update event statuses:', error);
    }
  }
}
