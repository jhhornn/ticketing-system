export const RESERVATION_ENV_KEYS = {
  timeoutMinutes: 'RESERVATION_TIMEOUT_MINUTES',
  lockTtlSeconds: 'LOCK_TTL_SECONDS',
} as const;

export const RESERVATION_DEFAULTS = {
  timeoutMinutes: 10,
  lockTtlSeconds: 30,
  cleanupBatchSize: 100,
  cleanupSeatLockTtlSeconds: 5,
} as const;

export const RESERVATION_LOCK_PREFIXES = {
  section: 'section:',
  seat: 'seat:',
  seatReserve: 'seat:reserve:',
} as const;

export const RESERVATION_MESSAGES = {
  eventNotFound: 'Event not found',
  sectionNotFound: 'Section not found',
  sectionEventMismatch: 'Section does not belong to this event',
  notGaSection: 'Not a General Admission section',
  notEnoughTickets: 'Not enough tickets available',
  noSeatsProvided: 'No seats provided',
  noSeatsReserved: 'No seats could be reserved',
  reservationNotFound: 'Reservation not found',
  cancelOwnReservationOnly: 'You can only cancel your own reservations',
  cleanupCompleted: 'Cleanup completed',
  cleanupJobFailed: 'Cleanup job failed:',
  foundExpiredReservations: 'Found expired reservations to cleanup',
  cancelledReservation: 'Cancelled reservation',
  seatLockInUse: 'Seat is currently locked by another request',
  seatNotFound: 'Seat not found',
  staleSeatVersion: 'Seat was modified by another user (stale version)',
  unableToReserveSeat: 'Unable to reserve seat',
  failedToRetrieveCreatedReservations:
    'Failed to retrieve created reservations',
  cannotPurchasePastEvents: 'Cannot purchase tickets for past events',
  ticketsNotAvailable: 'Tickets are not available. Event is',
  eventSoldOut: 'Event is sold out',
  ticketSalesStartOn: 'Ticket sales start on',
  cannotCancelWithStatus: 'Cannot cancel reservation with status:',
} as const;
