/**
 * Re-export all Prisma enums for use throughout the application
 * This avoids importing from @prisma/client in every file
 */
export {
  BookingStatus,
  PaymentStatus,
  ReservationStatus,
  EventStatus,
  SeatType,
  SeatStatus,
  DiscountType,
  Role,
  SectionType,
  AdStatus,
  AdPlacement,
} from '@prisma/client';
