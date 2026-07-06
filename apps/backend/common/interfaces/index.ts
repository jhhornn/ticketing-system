/**
 * Central export for all common interfaces
 */
export * from './user.interface.js';
export * from './audit.interface.js';

// Re-export enums and interfaces for convenience
export { AuditAction, AuditEntityType } from './audit.interface.js';
export type { IAuditLogEntry } from './audit.interface.js';
export type {
  IAuthenticatedUser,
  IAuthenticatedRequest,
} from './user.interface.js';
