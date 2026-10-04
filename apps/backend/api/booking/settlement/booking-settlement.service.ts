import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service.js';
import { DiscountsService } from '../../discounts/discounts.service.js';
import {
  BookingStatus,
  PaymentStatus,
  SeatStatus,
} from '../../../common/enums/index.js';

/** Currency all bookings are charged in (see BookingService.confirmBooking). */
export const BOOKING_CURRENCY = 'NGN';

export type ConfirmPaidBookingResult =
  | 'confirmed'
  | 'already_confirmed'
  | 'not_found'
  | 'not_pending'
  | 'amount_mismatch';

export interface PaidAmount {
  /** Amount actually collected, in minor units (kobo). */
  amountMinor: number;
  currency: string;
}

export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Moves PENDING (awaiting payment) bookings to their final state.
 *
 * Shared by the payment webhook and the abandoned-booking cleanup job. Every
 * transition is a conditional update on `status = PENDING`, so concurrent
 * callers (webhook vs. cron, or multiple app instances) can never both act on
 * the same booking.
 */
@Injectable()
export class BookingSettlementService {
  private readonly logger = new Logger(BookingSettlementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly discountsService: DiscountsService,
  ) {}

  /**
   * Confirm a PENDING booking once its payment has succeeded, provided the
   * full amount was collected in the booking currency.
   */
  async confirmPaidBooking(
    paymentReference: string,
    paid: PaidAmount,
  ): Promise<ConfirmPaidBookingResult> {
    const booking = await this.prisma.booking.findFirst({
      where: { paymentId: paymentReference },
    });

    if (!booking) {
      return 'not_found';
    }

    if (booking.status === BookingStatus.CONFIRMED) {
      return 'already_confirmed';
    }

    if (booking.status !== BookingStatus.PENDING) {
      return 'not_pending';
    }

    const expectedMinor = toMinorUnits(Number(booking.totalAmount));
    if (
      paid.amountMinor !== expectedMinor ||
      paid.currency?.toUpperCase() !== BOOKING_CURRENCY
    ) {
      this.logger.error(
        `Amount mismatch for booking ${booking.bookingReference}: expected ${expectedMinor} ${BOOKING_CURRENCY} (minor units), got ${paid.amountMinor} ${paid.currency}`,
      );
      return 'amount_mismatch';
    }

    const { count } = await this.prisma.booking.updateMany({
      where: { id: booking.id, status: BookingStatus.PENDING },
      data: {
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.SUCCESS,
        confirmedAt: new Date(),
      },
    });

    if (count === 0) {
      // Lost a race with the cleanup job or another webhook delivery
      const fresh = await this.prisma.booking.findUnique({
        where: { id: booking.id },
        select: { status: true },
      });
      return fresh?.status === BookingStatus.CONFIRMED
        ? 'already_confirmed'
        : 'not_pending';
    }

    this.logger.log(`Booking ${booking.bookingReference} confirmed`);
    return 'confirmed';
  }

  /**
   * Fail a PENDING booking whose payment never completed and return its
   * inventory (seats / GA allocation / event availability) and discount use.
   *
   * @returns true if this call released the booking, false if it was no
   *          longer PENDING.
   */
  async releaseUnpaidBooking(
    bookingId: bigint,
    reason: string,
  ): Promise<boolean> {
    const released = await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.booking.updateMany({
        where: { id: bookingId, status: BookingStatus.PENDING },
        data: {
          status: BookingStatus.FAILED,
          paymentStatus: PaymentStatus.FAILED,
        },
      });

      if (count === 0) {
        return null;
      }

      const booking = await tx.booking.findUniqueOrThrow({
        where: { id: bookingId },
        include: { bookingSeats: true },
      });

      let releasedTickets = 0;

      for (const item of booking.bookingSeats) {
        if (item.seatId) {
          // Only free the seat if it is still held by this booking
          const { count: freed } = await tx.seat.updateMany({
            where: { id: item.seatId, bookingId: booking.id },
            data: {
              status: SeatStatus.AVAILABLE,
              bookingId: null,
              reservedBy: null,
              reservedUntil: null,
              // Bump the optimistic-lock version so stale seat maps refresh
              version: { increment: 1 },
            },
          });
          releasedTickets += freed;
        } else if (item.sectionId) {
          await tx.eventSection.update({
            where: { id: item.sectionId },
            data: { allocated: { decrement: item.quantity } },
          });
          releasedTickets += item.quantity;
        }
      }

      if (releasedTickets > 0) {
        await tx.event.update({
          where: { id: booking.eventId },
          data: { availableSeats: { increment: releasedTickets } },
        });
      }

      if (booking.discountCode) {
        await this.discountsService.releaseUsage(booking.discountCode, tx);
      }

      return { reference: booking.bookingReference, releasedTickets };
    });

    if (!released) {
      return false;
    }

    this.logger.log(
      `Released unpaid booking ${released.reference} (${released.releasedTickets} tickets): ${reason}`,
    );
    return true;
  }

  /** Same as releaseUnpaidBooking, looked up by payment reference. */
  async releaseUnpaidBookingByReference(
    paymentReference: string,
    reason: string,
  ): Promise<boolean> {
    const booking = await this.prisma.booking.findFirst({
      where: { paymentId: paymentReference },
      select: { id: true },
    });

    return booking ? this.releaseUnpaidBooking(booking.id, reason) : false;
  }
}
