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
import { CreateReservationDto, ReservationResponseDto } from './dto/reservation.dto.js';
import { ReservationStatus, SeatStatus } from '../../common/enums/index.js';

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
   * Reserve seats with distributed locking
   * Implements sorted locking to prevent deadlocks
   */
  async reserveSeats(
    dto: CreateReservationDto,
  ): Promise<ReservationResponseDto[]> {
    const { eventId, seatNumbers, userId } = dto;

    // Sort seat numbers to prevent deadlock (always lock in same order)
    const sortedSeatNumbers = [...seatNumbers].sort();

    // Create lock resources
    const lockResources = sortedSeatNumbers.map(
      (seatNum) => `seat:${eventId}:${seatNum}`,
    );

    this.logger.log(
      `Attempting to reserve ${sortedSeatNumbers.length} seats for event ${eventId}`,
    );

    // Acquire all locks atomically
    return await this.lockingService.withMultipleLocks(
      lockResources,
      async () => {
        // Calculate expiry time
        const expiresAt = new Date();
        expiresAt.setMinutes(
          expiresAt.getMinutes() + this.RESERVATION_TIMEOUT_MINUTES,
        );

        const reservations: ReservationResponseDto[] = [];

        for (const seatNumber of sortedSeatNumbers) {
          // Find the seat
          const seat = await this.prisma.seat.findUnique({
            where: {
              eventId_seatNumber: {
                eventId: BigInt(eventId),
                seatNumber,
              },
            },
          });

          if (!seat) {
            throw new NotFoundException(
              `Seat ${seatNumber} not found for event ${eventId}`,
            );
          }

          // Check if seat is available
          if (seat.status !== SeatStatus.AVAILABLE) {
            throw new ConflictException(
              `Seat ${seatNumber} is not available (status: ${seat.status})`,
            );
          }

          // Check if seat is already reserved and not expired
          if (seat.reservedUntil && seat.reservedUntil > new Date()) {
            throw new ConflictException(
              `Seat ${seatNumber} is already reserved until ${seat.reservedUntil}`,
            );
          }

          // Update seat status to RESERVED
          const updatedSeat = await this.prisma.seat.update({
            where: {
              id: seat.id,
            },
            data: {
              status: SeatStatus.RESERVED,
              reservedBy: userId,
              reservedUntil: expiresAt,
            },
          });

          // Create reservation record
          const reservation = await this.prisma.reservation.create({
            data: {
              seatId: updatedSeat.id,
              eventId: BigInt(eventId),
              userId,
              expiresAt,
              status: ReservationStatus.ACTIVE,
            },
          });

          reservations.push({
            reservationId: reservation.id.toString(),
            eventId: Number(reservation.eventId),
            seatNumbers: [seatNumber],
            userId: reservation.userId,
            expiresAt: reservation.expiresAt,
            status: reservation.status,
            createdAt: reservation.createdAt,
          });
        }

        this.logger.log(
          `Successfully reserved ${reservations.length} seats for user ${userId}`,
        );

        return reservations;
      },
      { ttlSeconds: this.LOCK_TTL_SECONDS },
    );
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

    const lockKey = `seat:${reservation.eventId}:${reservation.seat.seatNumber}`;

    await this.lockingService.withLock(lockKey, async () => {
      // Update seat status back to AVAILABLE
      await this.prisma.seat.update({
        where: { id: reservation.seatId },
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

      this.logger.log(`Cancelled reservation ${reservationId}`);
    });
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
          const lockKey = `seat:${reservation.eventId}:${reservation.seat.seatNumber}`;

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
            const freshReservation = await this.prisma.reservation.findUnique({
              where: { id: reservation.id },
            });

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

              this.logger.debug(
                `Cleaned up expired reservation ${reservation.id}`,
              );
            }
          } finally {
            await this.lockingService.releaseLock(lock);
          }
        } catch (error) {
          this.logger.error(
            `Error cleaning up reservation ${reservation.id}: ${error.message}`,
          );
        }
      }

      this.logger.log(`Cleanup completed`);
    } catch (error) {
      this.logger.error(`Cleanup job failed: ${error.message}`, error.stack);
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

    return reservations.map((r) => ({
      reservationId: r.id.toString(),
      eventId: Number(r.eventId),
      seatNumbers: [r.seat.seatNumber],
      userId: r.userId,
      expiresAt: r.expiresAt,
      status: r.status,
      createdAt: r.createdAt,
    }));
  }
}
