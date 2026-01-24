import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/database/prisma.service.js';
import { LockingService } from '../../common/locks/locking.service.js';
import {
  CreateReservationDto,
  ReservationResponseDto,
} from './dto/create-reservation.dto.js';
import { ReservationStatus, SeatStatus } from '../../common/enums/index.js';

// interface LegacyReservationDto {
//   eventId: number;
//   seatNumbers: string[];
//   userId: string;
// }

@Injectable()
export class ReservationService {
  private readonly logger = new Logger(ReservationService.name);
  private readonly RESERVATION_TIMEOUT_MINUTES = parseInt(
    process.env.RESERVATION_TIMEOUT_MINUTES || '10',
    10,
  );
  private readonly LOCK_TTL_SECONDS = parseInt(
    process.env.LOCK_TTL_SECONDS || '30',
    10,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly lockingService: LockingService,
  ) {}

  /**
   * Reserve General Admission tickets
   */
  async reserveGaTickets(
    eventId: number,
    userId: string,
    sectionId: number,
    quantity: number,
    sessionId?: string,
  ): Promise<ReservationResponseDto> {
    // Check if event allows purchases
    const event = await this.prisma.event.findUnique({
      where: { id: BigInt(eventId) },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const now = new Date();

    if (event.eventDate < now) {
      throw new BadRequestException('Cannot purchase tickets for past events');
    }

    if (event.saleStartTime && event.saleStartTime > now) {
      throw new BadRequestException(
        `Ticket sales start on ${event.saleStartTime.toLocaleString()}`,
      );
    }

    if (event.status !== 'ON_SALE' && event.status !== 'UPCOMING') {
      throw new BadRequestException(
        `Tickets are not available. Event is ${event.status.toLowerCase()}`,
      );
    }

    if (event.availableSeats <= 0) {
      throw new BadRequestException('Event is sold out');
    }

    const lockKey = `section:${sectionId}`;
    const expiresAt = new Date(
      Date.now() + this.RESERVATION_TIMEOUT_MINUTES * 60 * 1000,
    );

    return await this.lockingService.withLock(
      lockKey,
      async () => {
        // 1. Check Capacity
        const section = await this.prisma.eventSection.findUnique({
          where: { id: BigInt(sectionId) },
        });

        if (!section) {
          throw new NotFoundException('Section not found');
        }

        if (section.eventId !== BigInt(eventId)) {
          throw new BadRequestException(
            'Section does not belong to this event',
          );
        }

        if (section.type !== 'GENERAL') {
          throw new BadRequestException('Not a General Admission section');
        }

        const available = section.totalCapacity - section.allocated;
        if (available < quantity) {
          throw new ConflictException('Not enough tickets available');
        }

        // 2. Increment Allocated
        await this.prisma.eventSection.update({
          where: { id: BigInt(sectionId) },
          data: {
            allocated: { increment: quantity },
          },
        });

        // 3. Create Reservations (one per ticket to track expiry)
        // Note: For large quantities, this might be loop-heavy, but usually cart size is small.
        const reservations: any[] = [];
        for (let i = 0; i < quantity; i++) {
          reservations.push({
            eventId: BigInt(eventId),
            sectionId: BigInt(sectionId),
            userId,
            sessionId: sessionId || null,
            expiresAt,
            status: ReservationStatus.ACTIVE,
          });
        }

        await this.prisma.reservation.createMany({
          data: reservations,
        });

        // Fetch the created reservations to get their IDs
        // Query by userId, sectionId, and status to get the just-created reservations
        const createdReservations = await this.prisma.reservation.findMany({
          where: {
            eventId: BigInt(eventId),
            sectionId: BigInt(sectionId),
            userId,
            sessionId: sessionId || null,
            status: ReservationStatus.ACTIVE,
            expiresAt,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: quantity,
        });

        if (createdReservations.length === 0) {
          throw new Error('Failed to retrieve created reservations');
        }

        // Update event global availability
        await this.prisma.event.update({
          where: { id: BigInt(eventId) },
          data: {
            availableSeats: { decrement: quantity },
          },
        });

        const expiresInSeconds = Math.floor(
          (expiresAt.getTime() - Date.now()) / 1000,
        );

        // Return the first reservation ID for the booking flow
        const firstReservationId = Number(createdReservations[0].id);

        return {
          id: firstReservationId,
          reservedSeatIds: createdReservations.map((r) => Number(r.id)),
          expiresAt,
          expiresInSeconds,
        };
      },
      { ttlSeconds: this.LOCK_TTL_SECONDS },
    );
  }

  /**
   * Reserve seats with optimistic locking and partial success handling
   */
  async reserveSeatsWithOptimisticLocking(
    eventId: number,
    userId: string,
    dto: CreateReservationDto,
  ): Promise<ReservationResponseDto> {
    // Route to GA logic if sectionId is present
    if (dto.sectionId) {
      return this.reserveGaTickets(
        eventId,
        userId,
        dto.sectionId,
        dto.quantity || 1,
        dto.sessionId,
      );
    }

    // Check if event allows purchases
    const event = await this.prisma.event.findUnique({
      where: { id: BigInt(eventId) },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const now = new Date();

    if (event.eventDate < now) {
      throw new BadRequestException('Cannot purchase tickets for past events');
    }

    if (event.saleStartTime && event.saleStartTime > now) {
      throw new BadRequestException(
        `Ticket sales start on ${event.saleStartTime.toLocaleString()}`,
      );
    }

    if (event.status !== 'ON_SALE' && event.status !== 'UPCOMING') {
      throw new BadRequestException(
        `Tickets are not available. Event is ${event.status.toLowerCase()}`,
      );
    }

    if (event.availableSeats <= 0) {
      throw new BadRequestException('Event is sold out');
    }

    // Existing Assigned Seating Logic
    const { seats, sessionId } = dto;
    if (!seats || seats.length === 0) {
      throw new BadRequestException('No seats provided');
    }

    // Sort by seatId to prevent deadlocks
    const sortedSeats = [...seats].sort((a, b) => a.seatId - b.seatId);

    const reservedSeatIds: number[] = [];
    const failedSeats: Array<{ seatId: number; reason: string }> = [];

    const expiresAt = new Date(
      Date.now() + this.RESERVATION_TIMEOUT_MINUTES * 60 * 1000,
    );

    // Try to reserve each seat atomically
    for (const { seatId, version } of sortedSeats) {
      const lockKey = `seat:reserve:${seatId}`;

      try {
        // Acquire distributed lock for this specific seat
        const lock = await this.lockingService.acquireLock(lockKey, {
          ttlSeconds: this.LOCK_TTL_SECONDS,
        });

        if (!lock) {
          failedSeats.push({
            seatId,
            reason: 'Seat is currently locked by another request',
          });
          continue;
        }

        try {
          // Attempt optimistic locking update
          const updated = await this.prisma.seat.updateMany({
            where: {
              id: BigInt(seatId),
              eventId: BigInt(eventId),
              status: 'AVAILABLE',
              version: BigInt(version), // Optimistic lock check
            },
            data: {
              status: 'RESERVED',
              reservedBy: userId,
              reservedUntil: expiresAt,
              version: { increment: 1 }, // Increment version
            },
          });

          if (updated.count === 0) {
            // Check why it failed
            const seat = await this.prisma.seat.findUnique({
              where: { id: BigInt(seatId) },
            });

            if (!seat) {
              failedSeats.push({ seatId, reason: 'Seat not found' });
            } else if (seat.status !== 'AVAILABLE') {
              failedSeats.push({
                seatId,
                reason: `Seat is ${seat.status.toLowerCase()}`,
              });
            } else if (Number(seat.version) !== version) {
              failedSeats.push({
                seatId,
                reason: 'Seat was modified by another user (stale version)',
              });
            } else {
              failedSeats.push({ seatId, reason: 'Unable to reserve seat' });
            }
          } else {
            // Success - create reservation record
            await this.prisma.reservation.create({
              data: {
                seatId: BigInt(seatId),
                eventId: BigInt(eventId),
                userId,
                sessionId: sessionId || null,
                expiresAt,
                status: 'ACTIVE',
              },
            });

            reservedSeatIds.push(seatId);

            this.logger.log(
              `Successfully reserved seat ${seatId} for user ${userId} (version ${version} → ${version + 1})`,
            );
          }
        } finally {
          // Always release the lock
          if (lock) {
            await this.lockingService.releaseLock(lock);
          }
        }
      } catch (error) {
        this.logger.error(`Error reserving seat ${seatId}:`, error);
        failedSeats.push({
          seatId,
          reason: error instanceof Error ? error.message : 'Unexpected error',
        });
      }
    }

    if (reservedSeatIds.length === 0) {
      throw new ConflictException({
        message: 'No seats could be reserved',
        failedSeats,
      });
    }

    // Update event available seats count
    if (reservedSeatIds.length > 0) {
      await this.prisma.event.update({
        where: { id: BigInt(eventId) },
        data: {
          availableSeats: { decrement: reservedSeatIds.length },
        },
      });
    }

    // Fetch the created reservations to get their actual reservation IDs
    const reservations = await this.prisma.reservation.findMany({
      where: {
        eventId: BigInt(eventId),
        userId,
        sessionId: sessionId || null,
        status: ReservationStatus.ACTIVE,
        expiresAt,
        seatId: { in: reservedSeatIds.map((id) => BigInt(id)) },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (reservations.length === 0) {
      throw new Error('Failed to retrieve created reservations');
    }

    const expiresInSeconds = Math.floor(
      (expiresAt.getTime() - Date.now()) / 1000,
    );

    // Return actual reservation IDs, not seat IDs
    const reservationIds = reservations.map((r) => Number(r.id));

    return {
      id: reservationIds[0], // Return first reservation ID
      reservedSeatIds: reservationIds, // These are reservation IDs, not seat IDs
      expiresAt,
      expiresInSeconds,
      failedSeats: failedSeats.length > 0 ? failedSeats : undefined,
    };
  }

  /**
   * Cancel a reservation
   */
  async cancelReservation(
    reservationId: string,
    userId: string,
  ): Promise<void> {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: BigInt(reservationId) },
      include: { seat: true },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    if (reservation.userId !== userId) {
      throw new BadRequestException(
        'You can only cancel your own reservations',
      );
    }

    if (reservation.status !== ReservationStatus.ACTIVE) {
      throw new BadRequestException(
        `Cannot cancel reservation with status: ${reservation.status}`,
      );
    }

    // Handle GA Cancellation
    if (reservation.sectionId) {
      await this.prisma.$transaction(async (tx) => {
        // Release capacity
        await tx.eventSection.update({
          where: { id: reservation.sectionId! },
          data: { allocated: { decrement: 1 } },
        });

        // Cancel reservation
        await tx.reservation.update({
          where: { id: reservation.id },
          data: { status: ReservationStatus.CANCELLED },
        });

        // Increment global event availability
        await tx.event.update({
          where: { id: reservation.eventId },
          data: { availableSeats: { increment: 1 } },
        });
      });
      return;
    }

    // Handle Assigned Seat Cancellation
    if (reservation.seat) {
      const lockKey = `seat:${reservation.eventId}:${reservation.seat.seatNumber}`;

      await this.lockingService.withLock(lockKey, async () => {
        // Update seat status back to AVAILABLE
        await this.prisma.seat.update({
          where: { id: reservation.seatId! },
          data: {
            status: SeatStatus.AVAILABLE,
            reservedBy: null,
            reservedUntil: null,
          },
        });

        // Update reservation status
        await this.prisma.reservation.update({
          where: { id: reservation.id },
          data: { status: ReservationStatus.CANCELLED },
        });

        // Increment global event availability
        await this.prisma.event.update({
          where: { id: reservation.eventId },
          data: { availableSeats: { increment: 1 } },
        });

        this.logger.log(`Cancelled reservation ${reservationId}`);
      });
    }
  }

  /**
   * Cleanup expired reservations - runs every minute
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async cleanupExpiredReservations(): Promise<void> {
    const now = new Date();

    try {
      // Find expired reservations
      const expiredReservations = await this.prisma.reservation.findMany({
        where: {
          status: ReservationStatus.ACTIVE,
          expiresAt: {
            lte: now,
          },
        },
        include: {
          seat: true,
        },
        take: 100, // Process in batches
      });

      if (expiredReservations.length === 0) {
        return;
      }

      this.logger.log(
        `Found ${expiredReservations.length} expired reservations to cleanup`,
      );

      for (const reservation of expiredReservations) {
        try {
          // Handle GA Expiry
          if (reservation.sectionId) {
            await this.prisma.$transaction(async (tx) => {
              const fresh = await tx.reservation.findUnique({
                where: { id: reservation.id },
              });
              if (fresh && fresh.status === ReservationStatus.ACTIVE) {
                await tx.eventSection.update({
                  where: { id: reservation.sectionId! },
                  data: { allocated: { decrement: 1 } },
                });
                await tx.reservation.update({
                  where: { id: reservation.id },
                  data: { status: ReservationStatus.EXPIRED },
                });
                await tx.event.update({
                  where: { id: reservation.eventId },
                  data: { availableSeats: { increment: 1 } },
                });
              }
            });
            continue;
          }

          // Handle Assigned Seat Expiry
          if (reservation.seatId) {
            const lockKey = `seat:${reservation.eventId}:${reservation.seat!.seatNumber}`;

            // Try to acquire lock (may fail if someone is booking it)
            const lock = await this.lockingService.acquireLock(lockKey, {
              ttlSeconds: 5,
              retries: 0,
            });

            if (!lock) {
              // Someone else is processing this seat, skip
              continue;
            }

            try {
              // Double-check expiration and status
              const freshReservation = await this.prisma.reservation.findUnique(
                {
                  where: { id: reservation.id },
                },
              );

              if (
                freshReservation &&
                freshReservation.status === ReservationStatus.ACTIVE &&
                freshReservation.expiresAt <= now
              ) {
                // Release the seat
                await this.prisma.seat.update({
                  where: { id: reservation.seatId },
                  data: {
                    status: SeatStatus.AVAILABLE,
                    reservedBy: null,
                    reservedUntil: null,
                  },
                });

                // Mark reservation as expired
                await this.prisma.reservation.update({
                  where: { id: reservation.id },
                  data: { status: ReservationStatus.EXPIRED },
                });

                // Restore global availability
                await this.prisma.event.update({
                  where: { id: reservation.eventId },
                  data: { availableSeats: { increment: 1 } },
                });

                this.logger.debug(
                  `Cleaned up expired reservation ${reservation.id}`,
                );
              }
            } finally {
              await this.lockingService.releaseLock(lock);
            }
          }
        } catch (error) {
          this.logger.error(
            `Error cleaning up reservation ${reservation.id}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      this.logger.log(`Cleanup completed`);
    } catch (error) {
      this.logger.error(
        `Cleanup job failed: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Get user's active reservations
   */
  async getUserReservations(userId: string): Promise<ReservationResponseDto[]> {
    const reservations = await this.prisma.reservation.findMany({
      where: {
        userId,
        status: ReservationStatus.ACTIVE,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        seat: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return reservations.map((r) => {
      const expiresInSeconds = Math.floor(
        (r.expiresAt.getTime() - Date.now()) / 1000,
      );

      return {
        id: Number(r.id),
        reservedSeatIds: r.seatId ? [Number(r.seatId)] : [],
        sectionId: r.sectionId ? Number(r.sectionId) : undefined,
        expiresAt: r.expiresAt,
        expiresInSeconds,
      };
    });
  }
}
