/**
 * Audit action types for tracking system operations
 */
export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  RESERVE = 'RESERVE',
  BOOK = 'BOOK',
  CANCEL = 'CANCEL',
}

/**
 * Audit entity types for different models
 */
export enum AuditEntityType {
  EVENT = 'Event',
  EVENT_SECTION = 'EventSection',
  BOOKING = 'Booking',
  SEAT = 'Seat',
  RESERVATION = 'Reservation',
  PAYMENT = 'Payment',
  DISCOUNT = 'Discount',
  ADVERTISEMENT = 'Advertisement',
  VENUE = 'Venue',
  VENUE_SECTION = 'VenueSection',
}

/**
 * Audit log entry structure
 */
export interface IAuditLogEntry {
  entityType: string | AuditEntityType;
  entityId: number;
  action: AuditAction;
  changes?: any;
  performedBy: string;
  metadata?: any;
  ipAddress?: string;
}
