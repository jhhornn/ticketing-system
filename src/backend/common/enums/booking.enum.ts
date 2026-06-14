/**
 * Re-export Prisma booking-related enums and add custom enums
 */
export {
  BookingStatus,
  PaymentStatus,
  ReservationStatus,
} from '@prisma/client';
import type { BookingStatus } from '@prisma/client';

/**
 * Confirmed booking statuses (for filtering)
 */
export const CONFIRMED_BOOKING_STATUSES: BookingStatus[] = [
  'CONFIRMED',
  'PENDING',
];

/**
 * Type for confirmed booking statuses
 */
export type ConfirmedBookingStatus = 'CONFIRMED' | 'PENDING';
