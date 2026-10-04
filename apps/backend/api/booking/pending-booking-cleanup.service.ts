import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/database/prisma.service.js';
import { BookingStatus, PaymentStatus } from '../../common/enums/index.js';
import { PaymentService } from '../payment/payment.service.js';
import {
  PaymentMethod,
  type PaymentResponse,
} from '../payment/strategies/payment-strategy.interface.js';
import {
  BookingSettlementService,
  toMinorUnits,
} from './settlement/booking-settlement.service.js';
import {
  MOCK_PAYMENT_ID_PREFIX,
  PENDING_BOOKING_CLEANUP_BATCH_SIZE,
  PENDING_PAYMENT_MAX_MINUTES,
  PENDING_PAYMENT_TIMEOUT_MINUTES,
} from './booking.constants.js';

const MINUTE_MS = 60 * 1000;

/**
 * Releases seats held by bookings whose payment was never completed
 * (e.g. the customer closed the Paystack checkout page).
 *
 * Before releasing, the provider is asked for the real outcome so a payment
 * whose webhook was missed is confirmed instead of being thrown away.
 */
@Injectable()
export class PendingBookingCleanupService {
  private readonly logger = new Logger(PendingBookingCleanupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
    private readonly bookingSettlement: BookingSettlementService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async releaseAbandonedBookings(): Promise<void> {
    const now = Date.now();
    const timeoutCutoff = new Date(
      now - PENDING_PAYMENT_TIMEOUT_MINUTES * MINUTE_MS,
    );
    const hardCutoff = new Date(now - PENDING_PAYMENT_MAX_MINUTES * MINUTE_MS);

    try {
      const stale = await this.prisma.booking.findMany({
        where: {
          status: BookingStatus.PENDING,
          createdAt: { lte: timeoutCutoff },
        },
        select: { id: true, paymentId: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
        take: PENDING_BOOKING_CLEANUP_BATCH_SIZE,
      });

      for (const booking of stale) {
        try {
          await this.settle(booking, booking.createdAt <= hardCutoff);
        } catch (error) {
          this.logger.error(
            `Failed to settle pending booking ${booking.id}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Pending booking cleanup failed: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private async settle(
    booking: { id: bigint; paymentId: string | null },
    pastHardLimit: boolean,
  ): Promise<void> {
    if (!booking.paymentId) {
      await this.bookingSettlement.releaseUnpaidBooking(
        booking.id,
        'no payment reference',
      );
      return;
    }

    const status = await this.checkPaymentStatus(booking.paymentId);

    if (status.state === 'paid') {
      const result = await this.bookingSettlement.confirmPaidBooking(
        booking.paymentId,
        status.paid,
      );
      if (result === 'amount_mismatch') {
        await this.bookingSettlement.releaseUnpaidBooking(
          booking.id,
          'payment amount mismatch',
        );
        await this.paymentService.refundPayment(
          { paymentId: booking.paymentId, reason: 'Payment amount mismatch' },
          status.method,
        );
      }
      return;
    }

    if (status.state === 'failed') {
      await this.bookingSettlement.releaseUnpaidBooking(
        booking.id,
        'payment not completed before timeout',
      );
      return;
    }

    // Outcome unknown (provider unreachable / still processing): retry on the
    // next run, but never hold seats forever.
    if (pastHardLimit) {
      await this.bookingSettlement.releaseUnpaidBooking(
        booking.id,
        `payment unconfirmed after ${PENDING_PAYMENT_MAX_MINUTES} minutes`,
      );
    }
  }

  private async checkPaymentStatus(paymentId: string): Promise<
    | {
        state: 'paid';
        method: PaymentMethod;
        paid: { amountMinor: number; currency: string };
      }
    | { state: 'failed' | 'unknown' }
  > {
    const method = paymentId.startsWith(MOCK_PAYMENT_ID_PREFIX)
      ? PaymentMethod.MOCK
      : PaymentMethod.PAYSTACK;

    let response: PaymentResponse;
    try {
      response = await this.paymentService.verifyPayment(paymentId, method);
    } catch {
      return { state: 'unknown' };
    }

    if (response.success && response.status === PaymentStatus.SUCCESS) {
      return {
        state: 'paid',
        method,
        paid: {
          amountMinor: toMinorUnits(response.amount),
          currency: response.currency,
        },
      };
    }

    return {
      state: response.status === PaymentStatus.FAILED ? 'failed' : 'unknown',
    };
  }
}
