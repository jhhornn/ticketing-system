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

// Re-export from specialized enum files
export * from './advertisement.enum.js';
export * from './booking.enum.js';
export * from './seat.enum.js';
export * from './section.enum.js';

// Re-export audit enums from interfaces (for convenience)
export { AuditAction, AuditEntityType } from '../interfaces/audit.interface.js';
