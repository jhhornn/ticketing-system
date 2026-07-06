export const BOOKING_IDEMPOTENCY_TTL_HOURS = 24;

export const BOOKING_REFERENCE_PREFIX = 'BK';

export const BOOKING_MESSAGES = {
  reservationNotFound: 'Reservation not found or already used',
  reservationAlreadyConfirmed: 'Reservation has already been confirmed',
  reservationExpired: 'Reservation has expired. Please reserve seats again.',
  invalidDiscountCode: 'Invalid discount code',
  bookingNotFound: 'Booking not found',
  eventNotFound: 'Event not found',
  eventBookingsForbidden:
    'You do not have permission to view bookings for this event',
} as const;
