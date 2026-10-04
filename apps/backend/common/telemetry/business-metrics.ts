import { metrics } from '@opentelemetry/api';

/**
 * Business metrics, exported through the same OpenTelemetry pipeline as the
 * automatic HTTP/DB metrics (see instrumentation.ts) — so they land in PostHog
 * Metrics and/or your OTLP collector.
 *
 * Attributes must stay low-cardinality (payment method, reason). Never put
 * user ids, booking references or event ids here; those belong on logs and
 * analytics events.
 */
const meter = metrics.getMeter('ticketing-api.business');

const bookingsConfirmed = meter.createCounter('tickets.bookings.confirmed', {
  description: 'Bookings that reached CONFIRMED',
});

const ticketsSold = meter.createCounter('tickets.sold', {
  description: 'Tickets in confirmed bookings',
});

const revenue = meter.createCounter('tickets.revenue', {
  description: 'Amount collected for confirmed bookings',
  unit: 'NGN',
});

const bookingsReleased = meter.createCounter('tickets.bookings.released', {
  description: 'Unpaid bookings released back to inventory',
});

const ticketsReleased = meter.createCounter('tickets.released', {
  description: 'Tickets returned to inventory from unpaid bookings',
});

const timeToPay = meter.createHistogram('tickets.payments.time_to_pay', {
  description: 'Time from booking creation to confirmed payment',
  unit: 'min',
});

export type ReleaseReason =
  | 'timeout'
  | 'unconfirmed'
  | 'amount_mismatch'
  | 'no_payment_reference';

export const BusinessMetrics = {
  bookingConfirmed(input: {
    paymentMethod: string;
    amount: number;
    ticketCount?: number;
    minutesToPay?: number;
  }): void {
    const attributes = { payment_method: input.paymentMethod };
    bookingsConfirmed.add(1, attributes);
    revenue.add(input.amount, attributes);
    if (input.ticketCount) {
      ticketsSold.add(input.ticketCount, attributes);
    }
    if (input.minutesToPay !== undefined) {
      timeToPay.record(input.minutesToPay, attributes);
    }
  },

  bookingReleased(reason: ReleaseReason, ticketCount: number): void {
    bookingsReleased.add(1, { reason });
    ticketsReleased.add(ticketCount, { reason });
  },
};
