/**
 * Error Translation Types
 * 
 * Defines the structure for error handling, translation, and user guidance.
 */

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

export type ErrorCategory = 
  | 'network'           // Connection/timeout issues
  | 'validation'        // Input validation failures
  | 'business_logic'    // Business rule violations (sold out, expired, etc.)
  | 'authentication'    // Auth failures
  | 'authorization'     // Permission issues
  | 'system'           // Server errors, unexpected failures
  | 'conflict';        // Race conditions, version conflicts

export type RecoveryStrategy = 
  | 'retry'            // Try the same action again
  | 'retry_modified'   // Try again with different parameters
  | 'restart'          // Start the flow over
  | 'manual'           // User must take manual action
  | 'wait'             // Wait and try later
  | 'contact_support'; // Escalate to support

export interface ErrorAction {
  label: string;
  action: RecoveryStrategy;
  autoRetryable?: boolean;  // Can be retried automatically
  retryDelay?: number;       // Milliseconds to wait before retry
  retryLimit?: number;       // Max retry attempts
}

export interface TranslatedError {
  // User-facing information
  title: string;
  message: string;
  technicalDetails?: string;  // For debugging/support
  
  // Categorization
  category: ErrorCategory;
  severity: ErrorSeverity;
  
  // Recovery guidance
  primaryAction: ErrorAction;
  secondaryAction?: ErrorAction;
  
  // Context
  context?: {
    flow: 'reservation' | 'payment' | 'timer' | 'general';
    affectedResource?: string;  // e.g., "Seat A12", "Payment #123"
  };
  
  // Original error
  originalError?: {
    httpStatus?: number;
    backendReason?: string;
    message?: string;
  };
}

/**
 * Backend error reasons from API responses
 */
export const BackendErrorReasons = {
  // Seat/Reservation errors
  SEAT_ALREADY_RESERVED: 'seat_already_reserved',
  SEAT_ALREADY_BOOKED: 'seat_already_booked',
  SEAT_NOT_AVAILABLE: 'seat_not_available',
  SEAT_LOCKED: 'seat_locked',
  STALE_VERSION: 'stale_version',
  RESERVATION_EXPIRED: 'reservation_expired',
  RESERVATION_NOT_FOUND: 'reservation_not_found',
  
  // Event errors
  EVENT_NOT_FOUND: 'event_not_found',
  EVENT_SOLD_OUT: 'event_sold_out',
  EVENT_NOT_STARTED: 'event_not_started',
  EVENT_ENDED: 'event_ended',
  
  // Payment errors
  PAYMENT_FAILED: 'payment_failed',
  PAYMENT_DECLINED: 'payment_declined',
  PAYMENT_TIMEOUT: 'payment_timeout',
  INSUFFICIENT_FUNDS: 'insufficient_funds',
  INVALID_CARD: 'invalid_card',
  PAYMENT_DUPLICATE: 'payment_duplicate',
  
  // Validation errors
  INVALID_INPUT: 'invalid_input',
  MISSING_REQUIRED_FIELD: 'missing_required_field',
  INVALID_EMAIL: 'invalid_email',
  INVALID_PHONE: 'invalid_phone',
  
  // Auth errors
  UNAUTHORIZED: 'unauthorized',
  TOKEN_EXPIRED: 'token_expired',
  FORBIDDEN: 'forbidden',
  
  // System errors
  INTERNAL_ERROR: 'internal_error',
  SERVICE_UNAVAILABLE: 'service_unavailable',
  RATE_LIMITED: 'rate_limited',
  MAINTENANCE: 'maintenance',
} as const;

export type BackendErrorReason = typeof BackendErrorReasons[keyof typeof BackendErrorReasons];

/**
 * HTTP Status Codes
 */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

export type HttpStatusCode = typeof HttpStatus[keyof typeof HttpStatus];
