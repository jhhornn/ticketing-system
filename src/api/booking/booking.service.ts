import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service.js';
import { LockingService } from '../../common/locks/locking.service.js';
import { PaymentService } from '../payment/payment.service.js';
import {
  ConfirmBookingDto,
  BookingResponseDto,
} from './dto/booking.dto.js';
import {
  PaymentMethod,
  PaymentStatus,
} from '../payment/strategies/payment-strategy.interface.js';
import { BookingStatus, ReservationStatus, SeatStatus } from '../../common/enums/index.js';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly lockingService: LockingService,
    private readonly paymentService: PaymentService,
  ) {}

  /**
   * Confirm booking with payment (with idempotency)
   * Implements saga pattern for rollback on failure
   */
  async confirmBooking(
    dto: ConfirmBookingDto,
  ): Promise<BookingResponseDto> {
    const { reservationId, userId, paymentMethod, idempotencyKey, metadata } =
      dto;

    // Check idempotency first
    const existingBooking = await this.checkIdempotency(idempotencyKey);
    if (existingBooking) {
      this.logger.log(
        `Returning existing booking for idempotency key: ${idempotencyKey}`,
      );
      return existingBooking;
    }

    // Start saga/transaction
    let paymentId: string | undefined;
    let seatIds: bigint[] = [];

    try {
      // Step 1: Find all reservations for this reservation group
      const reservations = await this.prisma.reservation.findMany({
        where: {
          id: BigInt(reservationId),
          userId,
          status: ReservationStatus.ACTIVE,
        },
        include: {
          seat: true,
          event: true,
        },
      });

      if (reservations.length === 0) {
        throw new NotFoundException('Reservation not found or already used');
      }

      const reservation = reservations[0];

      // Check if reservation is expired
      if (reservation.expiresAt < new Date()) {
        throw new BadRequestException(
          'Reservation has expired. Please reserve seats again.',
        );
      }

      // Step 2: Lock all seats involved
      const lockResources = reservations.map(
        (r) => `seat:${r.eventId}:${r.seat.seatNumber}`,
      );

      return await this.lockingService.withMultipleLocks(
        lockResources,
        async () => {
          // Step 3: Calculate total amount
          const totalAmount = reservations.reduce(
            (sum, r) => sum + Number(r.seat.price),
            0,
          );

          // Step 4: Process payment
          const paymentRequest = {
            amount: totalAmount,
            currency: 'USD',
            userId,
            metadata: {
              ...metadata,
              reservationId,
              eventId: Number(reservation.eventId),
            },
            idempotencyKey: `payment_${idempotencyKey}`,
          };

          const paymentResponse = await this.paymentService.processPayment(
            paymentRequest,
            paymentMethod,
          );

          if (!paymentResponse.success) {
            throw new BadRequestException(
              `Payment failed: ${paymentResponse.errorMessage}`,
            );
          }

          paymentId = paymentResponse.paymentId;

          // Step 5: Create booking
          const bookingReference = this.generateBookingReference();

          const booking = await this.prisma.booking.create({
            data: {
              eventId: reservation.eventId,
              userId,
              totalAmount,
              status: BookingStatus.CONFIRMED,
              paymentId,
              paymentStatus: PaymentStatus.SUCCESS,
              bookingReference,
              confirmedAt: new Date(),
            },
          });

          // Step 6: Link seats to booking
          for (const res of reservations) {
            await this.prisma.bookingSeat.create({
              data: {
                bookingId: booking.id,
                seatId: res.seatId,
                price: res.seat.price,
              },
            });

            // Update seat status
            await this.prisma.seat.update({
              where: { id: res.seatId },
              data: {
                status: SeatStatus.BOOKED,
                bookingId: booking.id,
                reservedBy: null,
                reservedUntil: null,
              },
            });

            seatIds.push(res.seatId);

            // Mark reservation as confirmed
            await this.prisma.reservation.update({
              where: { id: res.id },
              data: { status: ReservationStatus.CONFIRMED },
            });
          }

          // Step 7: Store idempotency key
          const response = this.toBookingResponse(
            booking,
            reservations.map((r) => r.seat.seatNumber),
          );

          await this.storeIdempotency(
            idempotencyKey,
            dto,
            response,
            200,
          );

          this.logger.log(
            `Booking confirmed: ${bookingReference} (Payment: ${paymentId})`,
          );

          return response;
        },
      );
    } catch (error) {
      this.logger.error(
        `Booking failed: ${error.message}. Initiating rollback.`,
        error.stack,
      );

      // Saga rollback: Refund payment if it was successful
      if (paymentId) {
        try {
          await this.paymentService.refundPayment(
            { paymentId },
            paymentMethod,
          );
          this.logger.log(`Payment ${paymentId} refunded successfully`);
        } catch (refundError) {
          this.logger.error(
            `Failed to refund payment ${paymentId}: ${refundError.message}`,
          );
          // TODO: Queue for manual intervention
        }
      }

      // Release seats if they were locked
      if (seatIds.length > 0) {
        try {
          await this.prisma.seat.updateMany({
            where: {
              id: {
                in: seatIds,
              },
            },
            data: {
              status: SeatStatus.RESERVED, // Back to reserved state
              bookingId: null,
            },
          });
        } catch (releaseError) {
          this.logger.error(
            `Failed to release seats: ${releaseError.message}`,
          );
        }
      }

      throw error;
    }
  }

  /**
   * Get booking by reference
   */
  async getBookingByReference(
    bookingReference: string,
  ): Promise<BookingResponseDto> {
    const booking = await this.prisma.booking.findUnique({
      where: { bookingReference },
      include: {
        bookingSeats: {
          include: {
            seat: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const seatNumbers = booking.bookingSeats.map((bs) => bs.seat.seatNumber);

    return this.toBookingResponse(booking, seatNumbers);
  }

  /**
   * Get user bookings
   */
  async getUserBookings(userId: string): Promise<BookingResponseDto[]> {
    const bookings = await this.prisma.booking.findMany({
      where: { userId },
      include: {
        bookingSeats: {
          include: {
            seat: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return bookings.map((booking) => {
      const seatNumbers = booking.bookingSeats.map((bs) => bs.seat.seatNumber);
      return this.toBookingResponse(booking, seatNumbers);
    });
  }

  /**
   * Check idempotency key
   */
  private async checkIdempotency(
    key: string,
  ): Promise<BookingResponseDto | null> {
    const record = await this.prisma.idempotencyKey.findUnique({
      where: { key },
    });

    if (!record) {
      return null;
    }

    // Check if expired
    if (record.expiresAt < new Date()) {
      return null;
    }

    // Return cached response
    return JSON.parse(record.response || '{}');
  }

  /**
   * Store idempotency key
   */
  private async storeIdempotency(
    key: string,
    request: any,
    response: any,
    statusCode: number,
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

    await this.prisma.idempotencyKey.create({
      data: {
        key,
        request: JSON.stringify(request),
        response: JSON.stringify(response),
        statusCode,
        expiresAt,
      },
    });
  }

  /**
   * Generate unique booking reference
   */
  private generateBookingReference(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = uuidv4().split('-')[0].toUpperCase();
    return `BK-${timestamp}-${random}`;
  }

  /**
   * Convert booking to response DTO
   */
  private toBookingResponse(
    booking: any,
    seatNumbers: string[],
  ): BookingResponseDto {
    return {
      bookingId: booking.id.toString(),
      bookingReference: booking.bookingReference,
      eventId: Number(booking.eventId),
      userId: booking.userId,
      totalAmount: Number(booking.totalAmount),
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      paymentId: booking.paymentId,
      seatNumbers,
      createdAt: booking.createdAt,
      confirmedAt: booking.confirmedAt,
    };
  }
}
