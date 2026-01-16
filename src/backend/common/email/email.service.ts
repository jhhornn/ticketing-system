import { Injectable, Inject } from '@nestjs/common';
import type { EmailStrategy } from './strategies/email-strategy.interface.js';

@Injectable()
export class EmailService {
  constructor(
    @Inject('EMAIL_STRATEGY')
    private emailStrategy: EmailStrategy,
  ) {}

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    await this.emailStrategy.sendEmail(to, subject, body);
  }

  async sendBookingConfirmation(
    to: string,
    bookingReference: string,
    eventName: string,
    seatNumbers: string[],
  ): Promise<void> {
    const subject = `Booking Confirmation - ${bookingReference}`;
    const body = `
      Dear Customer,

      Your booking has been confirmed!

      Booking Reference: ${bookingReference}
      Event: ${eventName}
      Seats: ${seatNumbers.join(', ')}

      Thank you for your booking.

      Best regards,
      Ticketing System Team
    `;

    await this.sendEmail(to, subject, body);
  }

  async sendBookingCancellation(
    to: string,
    bookingReference: string,
    eventName: string,
  ): Promise<void> {
    const subject = `Booking Cancellation - ${bookingReference}`;
    const body = `
      Dear Customer,

      Your booking has been cancelled.

      Booking Reference: ${bookingReference}
      Event: ${eventName}

      If you did not request this cancellation, please contact support immediately.

      Best regards,
      Ticketing System Team
    `;

    await this.sendEmail(to, subject, body);
  }
}
