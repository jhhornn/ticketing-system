export const BOOKING_IDEMPOTENCY_TTL_HOURS = 24;

export const BOOKING_REFERENCE_PREFIX = 'BK';

export const BOOKING_MESSAGES = {
  reservationNotFound: 'Reservation not found or already used',
  reservationAlreadyConfirmed: 'Reservation has already been confirmed',
  reservationExpired: 'Reservation has expired. Please reserve seats again.',
  invalidDiscountCode: 'Invalid discount code',
  discountUsageLimitReached: 'Discount usage limit reached',
  bookingNotFound: 'Booking not found',
  eventNotFound: 'Event not found',
  eventBookingsForbidden:
    'You do not have permission to view bookings for this event',
} as const;

/** Minutes a booking may wait for payment before its seats are released. */
export const PENDING_PAYMENT_TIMEOUT_MINUTES = Number(
  process.env.PENDING_PAYMENT_TIMEOUT_MINUTES || 30,
);

/**
 * Release even if the provider cannot confirm the outcome after this long.
 * A payment that succeeds later is refunded automatically by the webhook.
 */
export const PENDING_PAYMENT_MAX_MINUTES = Number(
  process.env.PENDING_PAYMENT_MAX_MINUTES || 120,
);

export const PENDING_BOOKING_CLEANUP_BATCH_SIZE = 50;

export const MOCK_PAYMENT_ID_PREFIX = 'mock_';
