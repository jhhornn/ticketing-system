import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service.js';
import { LockingService } from '../../common/locks/locking.service.js';
import { PaymentService } from '../payment/payment.service.js';
import { DiscountsService } from '../discounts/discounts.service.js';
import { ConfirmBookingDto, BookingResponseDto } from './dto/booking.dto.js';
// import { PaymentMethod } from '../payment/strategies/payment-strategy.interface.js';
import {
  BookingStatus,
  PaymentStatus,
  ReservationStatus,
  SeatStatus,
} from '../../common/enums/index.js';
import { v4 as uuidv4 } from 'uuid';
import {
  type AuthRequestUser,
  isAdminUser,
} from '../auth/guards/auth-request.types.js';
import {
  AnalyticsService,
  ServerAnalyticsEvents,
} from '../../common/analytics/analytics.service.js';
import { BusinessMetrics } from '../../common/telemetry/business-metrics.js';
import {
  BOOKING_IDEMPOTENCY_TTL_HOURS,
  BOOKING_MESSAGES,
  BOOKING_REFERENCE_PREFIX,
} from './booking.constants.js';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly lockingService: LockingService,
    private readonly paymentService: PaymentService,
    private readonly discountsService: DiscountsService,
    private readonly analytics: AnalyticsService,
  ) {}

  /**
   * Confirm booking with payment (with idempotency)
   * Implements saga pattern for rollback on failure
   */
  async confirmBooking(
    dto: ConfirmBookingDto,
    user: Pick<AuthRequestUser, 'id' | 'email'>,
  ): Promise<BookingResponseDto> {
    const {
      reservationId,
      paymentMethod,
      idempotencyKey,
      discountCode,
      metadata,
    } = dto;
    const userId = user.id;

    // Check idempotency first
    const existingBooking = await this.checkIdempotency(idempotencyKey, userId);
    if (existingBooking) {
      this.logger.log(
        `Returning existing booking for idempotency key: ${idempotencyKey}`,
      );
      return existingBooking;
    }

    // Start saga/transaction
    let paymentId: string | undefined;
    let paymentMetadata: Record<string, unknown> | undefined;
    let reservedDiscountCode: string | undefined;
    let createdBookingId: bigint | undefined;
    const seatIds: bigint[] = []; // Only for assigned seats
    const sectionAllocations: { sectionId: bigint; quantity: number }[] = []; // For GA

    try {
      // Step 1: Find the reservation
      const reservation = await this.prisma.reservation.findFirst({
        where: {
          id: BigInt(reservationId),
          userId,
        },
        include: {
          seat: true,
          eventSection: true,
          event: true,
        },
      });

      if (!reservation) {
        this.logger.warn(
          `Reservation not found: ID=${reservationId}, UserId=${userId}`,
        );
        throw new NotFoundException(BOOKING_MESSAGES.reservationNotFound);
      }

      // Check if reservation is already used
      if (reservation.status === ReservationStatus.CONFIRMED) {
        throw new BadRequestException(
          BOOKING_MESSAGES.reservationAlreadyConfirmed,
        );
      }

      // Check if reservation is active
      if (reservation.status !== ReservationStatus.ACTIVE) {
        throw new BadRequestException(
          `Reservation status is ${reservation.status}`,
        );
      }

      // Check if reservation is expired
      if (reservation.expiresAt < new Date()) {
        throw new BadRequestException(BOOKING_MESSAGES.reservationExpired);
      }

      // Find all reservations in the same session (for multi-seat bookings)
      const reservations = await this.prisma.reservation.findMany({
        where: {
          ...(reservation.sessionId
            ? { sessionId: reservation.sessionId }
            : { id: reservation.id }),
          eventId: reservation.eventId,
          userId,
          status: ReservationStatus.ACTIVE,
        },
        include: {
          seat: true,
          eventSection: true,
          event: true,
        },
      });

      // Step 2: Acquire Locks
      const lockResources: string[] = [];
      const gaReservations = reservations.filter(
        (r) => r.sectionId && !r.seatId,
      );
      const assignedReservations = reservations.filter((r) => r.seatId);

      // Lock assigned seats
      assignedReservations.forEach((r) => {
        if (r.seat) {
          lockResources.push(
            this.toSeatLockResource(r.eventId, r.seat.seatNumber),
          );
        }
      });

      // For GA, we lock the section? Or just rely on reservation existence?
      // Since reservations are already created and allocated, we just need to confirm them.
      // Maybe lock section to prevent concurrent modification if needed, but row locking on reservation might be enough.
      // Let's assume reservation state 'ACTIVE' protects them for now, but confirm logic is inside transaction or saga.
      // We'll stick to seat locks for assigned.

      return await this.lockingService.withMultipleLocks(
        lockResources,
        async () => {
          // Step 3: Calculate total amount
          let totalAmount = 0;

          // Process Assigned: Price on Seat (fallback to Section if null?)
          for (const r of assignedReservations) {
            const price = r.seat?.price ?? 0; // Or fetch from section if seat price is null
            totalAmount += Number(price);
          }

          // Process GA: Price on Section
          for (const r of gaReservations) {
            if (r.eventSection) {
              totalAmount += Number(r.eventSection.price);
            } else if (r.sectionId) {
              // Fetch section if not included? (We should include it)
              // If missing, that's an error state
              this.logger.warn(`Reservation ${r.id} missing section data`);
            }
          }

          if (totalAmount <= 0 && !reservation.event.isFree) {
            throw new BadRequestException(
              'This paid event has no valid ticket price. Please contact the event organizer.',
            );
          }

          // Step 3.5: Apply discount if provided
          let discountAmount = 0;
          let finalAmount = totalAmount;
          let appliedDiscountCode: string | undefined;

          if (discountCode && totalAmount > 0) {
            const validation = await this.discountsService.validateDiscount(
              discountCode,
              Number(reservation.eventId),
            );

            if (validation.valid && validation.discount) {
              const discount = validation.discount;

              // Check minimum order amount if specified
              if (
                discount.minOrderAmount &&
                totalAmount < discount.minOrderAmount
              ) {
                this.logger.warn(
                  `Discount ${discountCode} requires minimum order of ${discount.minOrderAmount}, but total is ${totalAmount}`,
                );
              } else {
                // Calculate discount
                if (discount.type === 'PERCENTAGE') {
                  discountAmount = (totalAmount * discount.amount) / 100;
                } else {
                  // FIXED_AMOUNT
                  discountAmount = discount.amount;
                }

                // Ensure discount doesn't exceed total
                discountAmount = Math.min(discountAmount, totalAmount);
                finalAmount = totalAmount - discountAmount;
                appliedDiscountCode = discountCode;

                this.logger.log(
                  `Applied discount ${discountCode}: -$${discountAmount.toFixed(2)} (${totalAmount} -> ${finalAmount})`,
                );
              }
            } else {
              this.logger.warn(`Invalid discount code: ${validation.reason}`);
              throw new BadRequestException(
                validation.reason || BOOKING_MESSAGES.invalidDiscountCode,
              );
            }
          }

          // Step 3.6: Atomically claim a use of the discount BEFORE charging,
          // so concurrent checkouts cannot exceed its usage limit
          if (appliedDiscountCode) {
            const claimed =
              await this.discountsService.reserveUsage(appliedDiscountCode);
            if (!claimed) {
              throw new BadRequestException(
                BOOKING_MESSAGES.discountUsageLimitReached,
              );
            }
            reservedDiscountCode = appliedDiscountCode;
          }

          // Step 4: Process payment
          let paymentStatus: PaymentStatus = PaymentStatus.SUCCESS;

          if (finalAmount > 0) {
            const paymentRequest = {
              amount: finalAmount,
              currency: 'NGN',
              userId,
              metadata: {
                ...metadata,
                // SECURITY: Receipt email comes from the account, not the client
                email: user.email,
                reservationId,
                eventId: Number(reservation.eventId),
                discountCode: appliedDiscountCode,
                discountAmount,
              },
              idempotencyKey: this.toPaymentIdempotencyKey(idempotencyKey),
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
            paymentStatus = paymentResponse.status;
            paymentMetadata = paymentResponse.metadata;

            this.logger.log(
              `Payment processed: ${paymentId}, Status: ${paymentStatus}`,
            );
          } else {
            // Free event - no payment needed
            paymentId = `free_${Date.now()}`;
            paymentStatus = PaymentStatus.SUCCESS;
            this.logger.log('Free event - no payment required');
          }

          // Step 5: Create booking
          const bookingReference = this.generateBookingReference();

          // Determine booking status based on payment status
          const bookingStatus =
            paymentStatus === PaymentStatus.PENDING
              ? BookingStatus.PENDING
              : BookingStatus.CONFIRMED;

          const booking = await this.prisma.booking.create({
            data: {
              eventId: reservation.eventId,
              userId,
              totalAmount: finalAmount,
              status: bookingStatus,
              paymentId,
              paymentStatus: paymentStatus,
              bookingReference,
              discountCode: appliedDiscountCode ?? null,
              confirmedAt:
                paymentStatus === PaymentStatus.PENDING ? null : new Date(),
            },
          });

          createdBookingId = booking.id;

          this.logger.log(
            `Booking created: ${bookingReference}, Status: ${bookingStatus}, Payment: ${paymentStatus}`,
          );

          // Step 6: Link items to booking
          for (const res of reservations) {
            const isGA = !!res.sectionId && !res.seatId;
            let price = 0;

            if (isGA) {
              price = Number(res.eventSection?.price || 0);
            } else if (res.seat) {
              // Determine price for assigned seat
              // Seat price might be null now? If schema says `Decimal?`.
              // Assuming it falls back to section price or 0.
              price = Number(res.seat.price || 0);
            }

            await this.prisma.bookingSeat.create({
              data: {
                bookingId: booking.id,
                seatId: res.seatId || null, // Can be null for GA
                sectionId: res.sectionId || null, // Can be null for Assigned (if not linked) or present
                quantity: 1, // Store quantity
                price: price,
              },
            });

            if (!isGA && res.seatId) {
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
            } else if (isGA && res.sectionId) {
              // Track GA allocations?
              // Already tracked in allocated count on section during reservation.
              // We just need to confirm reservation.
              sectionAllocations.push({
                sectionId: res.sectionId,
                quantity: 1,
              });
            }

            // Mark reservation as confirmed
            await this.prisma.reservation.update({
              where: { id: res.id },
              data: { status: ReservationStatus.CONFIRMED },
            });
          }

          // Step 7: Store idempotency key
          const seatNumbers = reservations
            .map(
              (r) =>
                r.seat?.seatNumber ||
                (r.eventSection ? `${r.eventSection.name} (GA)` : 'Unknown'),
            )
            .filter(Boolean);

          const response = this.toBookingResponse(
            {
              ...booking,
              totalAmount: Number(booking.totalAmount),
              paymentId: booking.paymentId ?? '',
              paymentMetadata,
            },
            seatNumbers,
          );

          await this.storeIdempotency(
            idempotencyKey,
            { ...dto, userId },
            response,
            200,
          );

          this.logger.log(
            `Booking confirmed: ${bookingReference} (Payment: ${paymentId})`,
          );

          const bookingAnalytics = {
            bookingReference,
            eventId: Number(reservation.eventId),
            paymentMethod: finalAmount > 0 ? paymentMethod : 'free',
            amount: finalAmount,
            currency: 'NGN',
            ticketCount: reservations.length,
            discountCode: appliedDiscountCode,
            discountAmount,
          };
          this.analytics.capture(userId, ServerAnalyticsEvents.bookingCreated, {
            ...bookingAnalytics,
            status: bookingStatus,
          });
          // Free/instant payments are confirmed now; Paystack bookings are
          // confirmed later by BookingSettlementService
          if (bookingStatus === BookingStatus.CONFIRMED) {
            BusinessMetrics.bookingConfirmed({
              paymentMethod: bookingAnalytics.paymentMethod,
              amount: finalAmount,
              ticketCount: reservations.length,
              minutesToPay: 0,
            });
            this.analytics.capture(
              userId,
              ServerAnalyticsEvents.bookingConfirmed,
              bookingAnalytics,
            );
          }

          return response;
        },
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Booking failed: ${errorMessage}. Initiating rollback.`,
        errorStack,
      );

      // Saga rollback: Refund payment if it was successful
      if (paymentId) {
        try {
          await this.paymentService.refundPayment({ paymentId }, paymentMethod);
          this.logger.log(`Payment ${paymentId} refunded successfully`);
        } catch (refundError) {
          const errorMessage =
            refundError instanceof Error
              ? refundError.message
              : 'Unknown error';
          this.logger.error(
            `Failed to refund payment ${paymentId}: ${errorMessage}`,
          );
        }
      }

      // Don't leave a half-created booking looking active
      if (createdBookingId) {
        try {
          await this.prisma.booking.update({
            where: { id: createdBookingId },
            data: {
              status: BookingStatus.FAILED,
              paymentStatus: paymentId
                ? PaymentStatus.REFUNDED
                : PaymentStatus.FAILED,
            },
          });
        } catch (bookingError) {
          this.logger.error(
            `Failed to mark booking ${createdBookingId} as failed: ${bookingError}`,
          );
        }
      }

      // Give back the discount use claimed for this attempt
      if (reservedDiscountCode) {
        try {
          await this.discountsService.releaseUsage(reservedDiscountCode);
        } catch (discountError) {
          this.logger.error(
            `Failed to release discount ${reservedDiscountCode}: ${discountError}`,
          );
        }
      }

      // Release seats if they were locked (Assigned only)
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
          this.logger.error(`Failed to release seats: ${releaseError}`);
        }
      }

      // Revert GA ?
      // If we failed after creating booking but before confirming reservations...
      // Reservations are still ACTIVE. They will expire naturally or user fails.
      // If we explicitly cancelled them or something, we'd need to roll back.
      // But we just leave them as ACTIVE/RESERVED.

      throw error;
    }
  }

  /**
   * Get booking by reference
   */
  async getBookingByReference(
    bookingReference: string,
    user: Pick<AuthRequestUser, 'id' | 'role'>,
  ): Promise<BookingResponseDto> {
    const booking = await this.prisma.booking.findUnique({
      where: { bookingReference },
      include: {
        bookingSeats: {
          include: {
            seat: true,
          },
        },
        event: {
          select: { createdBy: true },
        },
      },
    });

    // SECURITY: Only the booking owner, the event organizer or an admin may
    // view a booking. Respond with 404 to avoid confirming the reference exists.
    if (
      !booking ||
      (booking.userId !== user.id &&
        booking.event.createdBy !== user.id &&
        !isAdminUser(user))
    ) {
      throw new NotFoundException(BOOKING_MESSAGES.bookingNotFound);
    }

    const seatNumbers = booking.bookingSeats.map(
      (bs) => bs.seat?.seatNumber || 'GA',
    );

    return this.toBookingResponse(
      {
        ...booking,
        totalAmount: Number(booking.totalAmount),
        paymentId: booking.paymentId ?? '',
      },
      seatNumbers,
    );
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
      const seatNumbers = booking.bookingSeats.map(
        (bs) => bs.seat?.seatNumber || 'GA',
      );
      return this.toBookingResponse(
        {
          ...booking,
          totalAmount: Number(booking.totalAmount),
          paymentId: booking.paymentId ?? '',
        },
        seatNumbers,
      );
    });
  }

  /**
   * Check idempotency key
   */
  private async checkIdempotency(
    key: string,
    userId: string,
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

    // SECURITY: Never replay another user's booking for a reused/guessed key
    const storedRequest = JSON.parse(record.request || '{}') as {
      userId?: string;
    };
    if (storedRequest.userId !== userId) {
      throw new ConflictException('Idempotency key has already been used');
    }

    // Return cached response
    return JSON.parse(record.response || '{}') as BookingResponseDto;
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
    expiresAt.setHours(expiresAt.getHours() + BOOKING_IDEMPOTENCY_TTL_HOURS);

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
    return `${BOOKING_REFERENCE_PREFIX}-${timestamp}-${random}`;
  }

  /**
   * Convert booking to response DTO
   */
  private toBookingResponse(
    booking: {
      id: bigint;
      bookingReference: string;
      eventId: bigint;
      userId: string;
      totalAmount: number;
      status: BookingStatus;
      paymentStatus: PaymentStatus;
      paymentId: string;
      paymentMetadata?: Record<string, unknown>;
      createdAt: Date;
      confirmedAt: Date | null;
    },
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
      paymentMetadata: booking.paymentMetadata,
      seatNumbers,
      createdAt: booking.createdAt,
      confirmedAt: booking.confirmedAt ?? undefined,
    };
  }

  /**
   * Get all bookings for an event (for event organizers)
   */
  async getEventBookings(
    eventId: number,
    userId: string,
  ): Promise<BookingResponseDto[]> {
    // First, verify event ownership
    const event = await this.prisma.event.findUnique({
      where: { id: BigInt(eventId) },
      select: { createdBy: true },
    });

    if (!event) {
      throw new NotFoundException(BOOKING_MESSAGES.eventNotFound);
    }

    if (event.createdBy !== userId) {
      throw new ForbiddenException(BOOKING_MESSAGES.eventBookingsForbidden);
    }

    // Fetch all bookings for this event with user and seat details
    const bookings = await this.prisma.booking.findMany({
      where: {
        eventId: BigInt(eventId),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        bookingSeats: {
          include: {
            seat: true,
            eventSection: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Map to response DTOs with enhanced information
    return bookings.map((booking) => {
      const seatNumbers = this.toSeatLabels(booking.bookingSeats);

      return {
        bookingId: booking.id.toString(),
        bookingReference: booking.bookingReference,
        eventId: Number(booking.eventId),
        userId: booking.userId,
        userEmail: booking.user.email,
        userName: this.toDisplayName(
          booking.user.firstName,
          booking.user.lastName,
        ),
        totalAmount: Number(booking.totalAmount),
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        paymentId: booking.paymentId || undefined,
        seatNumbers,
        createdAt: booking.createdAt,
        confirmedAt: booking.confirmedAt ?? undefined,
      };
    });
  }

  private toSeatLabels(
    bookingSeats: Array<{
      quantity: number;
      seat: { seatNumber: string } | null;
      eventSection: { name: string } | null;
    }>,
  ): string[] {
    const seatNumbers: string[] = [];

    bookingSeats.forEach((bookingSeat) => {
      if (bookingSeat.seat) {
        seatNumbers.push(bookingSeat.seat.seatNumber);
        return;
      }

      if (bookingSeat.eventSection) {
        seatNumbers.push(
          `${bookingSeat.eventSection.name} (GA x${bookingSeat.quantity})`,
        );
      }
    });

    return seatNumbers;
  }

  private toDisplayName(
    firstName: string | null,
    lastName: string | null,
  ): string {
    const fullName = `${firstName || ''} ${lastName || ''}`.trim();
    return fullName || 'N/A';
  }

  private toSeatLockResource(eventId: bigint, seatNumber: string): string {
    return `seat:${eventId}:${seatNumber}`;
  }

  private toPaymentIdempotencyKey(idempotencyKey: string): string {
    return `payment_${idempotencyKey}`;
  }
}
