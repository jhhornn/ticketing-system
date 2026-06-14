/**
 * Error Translation Layer
 * 
 * Maps HTTP status codes and backend error reasons to user-friendly messages
 * with clear next actions and recovery strategies.
 */

import {
  BackendErrorReasons,
  HttpStatus,
  type TranslatedError,
  type ErrorCategory,
  type ErrorSeverity,
  type RecoveryStrategy,
} from '../types/errors';

export type { TranslatedError };

/**
 * Error Mapping Configuration
 */
interface ErrorMapping {
  title: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  primaryStrategy: RecoveryStrategy;
  secondaryStrategy?: RecoveryStrategy;
  autoRetryable?: boolean;
  retryDelay?: number;
  retryLimit?: number;
}

/**
 * HTTP Status Code Mappings
 */

const HTTP_STATUS_MAPPINGS: Record<number, ErrorMapping> = {
  // Network errors (0 = no response)
  0: {
    title: 'Connection Lost',
    message: 'Unable to reach the server. Please check your internet connection and try again.',
    category: 'network',
    severity: 'error',
    primaryStrategy: 'retry',
    autoRetryable: true,
    retryDelay: 2000,
    retryLimit: 3,
  },
  
  // Client errors
  [HttpStatus.BAD_REQUEST]: {
    title: 'Invalid Request',
    message: 'The information provided is not valid. Please review and try again.',
    category: 'validation',
    severity: 'warning',
    primaryStrategy: 'manual',
  },
  
  [HttpStatus.UNAUTHORIZED]: {
    title: 'Session Expired',
    message: 'Your session has expired. Please sign in again to continue.',
    category: 'authentication',
    severity: 'warning',
    primaryStrategy: 'restart',
  },
  
  [HttpStatus.FORBIDDEN]: {
    title: 'Access Denied',
    message: 'You don\'t have permission to perform this action.',
    category: 'authorization',
    severity: 'error',
    primaryStrategy: 'contact_support',
  },
  
  [HttpStatus.NOT_FOUND]: {
    title: 'Not Found',
    message: 'The requested resource could not be found. It may have been removed or is no longer available.',
    category: 'business_logic',
    severity: 'error',
    primaryStrategy: 'restart',
  },
  
  [HttpStatus.CONFLICT]: {
    title: 'Conflict Detected',
    message: 'The information has changed. Please refresh and try again.',
    category: 'conflict',
    severity: 'warning',
    primaryStrategy: 'retry_modified',
    secondaryStrategy: 'restart',
  },
  
  [HttpStatus.UNPROCESSABLE_ENTITY]: {
    title: 'Cannot Process Request',
    message: 'The request cannot be processed due to validation errors. Please check your information.',
    category: 'validation',
    severity: 'warning',
    primaryStrategy: 'manual',
  },
  
  [HttpStatus.TOO_MANY_REQUESTS]: {
    title: 'Too Many Requests',
    message: 'You\'ve made too many requests. Please wait a moment and try again.',
    category: 'system',
    severity: 'warning',
    primaryStrategy: 'wait',
    autoRetryable: true,
    retryDelay: 5000,
    retryLimit: 2,
  },
  
  // Server errors
  [HttpStatus.INTERNAL_SERVER_ERROR]: {
    title: 'Server Error',
    message: 'Something went wrong on our end. Our team has been notified. Please try again in a few moments.',
    category: 'system',
    severity: 'error',
    primaryStrategy: 'retry',
    secondaryStrategy: 'contact_support',
    autoRetryable: true,
    retryDelay: 3000,
    retryLimit: 2,
  },
  
  [HttpStatus.BAD_GATEWAY]: {
    title: 'Service Temporarily Unavailable',
    message: 'We\'re experiencing temporary connectivity issues. Please try again shortly.',
    category: 'network',
    severity: 'error',
    primaryStrategy: 'retry',
    autoRetryable: true,
    retryDelay: 5000,
    retryLimit: 2,
  },
  
  [HttpStatus.SERVICE_UNAVAILABLE]: {
    title: 'Service Maintenance',
    message: 'We\'re currently performing maintenance. Service will resume shortly.',
    category: 'system',
    severity: 'error',
    primaryStrategy: 'wait',
  },
  
  [HttpStatus.GATEWAY_TIMEOUT]: {
    title: 'Request Timeout',
    message: 'The request took too long to complete. Please try again.',
    category: 'network',
    severity: 'warning',
    primaryStrategy: 'retry',
    autoRetryable: true,
    retryDelay: 3000,
    retryLimit: 2,
  },
};

/**
 * Backend Error Reason Mappings
 */
const BACKEND_REASON_MAPPINGS: Record<string, ErrorMapping> = {
  // Seat/Reservation errors
  [BackendErrorReasons.SEAT_ALREADY_RESERVED]: {
    title: 'Seat Already Reserved',
    message: 'This seat was just reserved by another customer. Please select a different seat.',
    category: 'business_logic',
    severity: 'warning',
    primaryStrategy: 'retry_modified',
    secondaryStrategy: 'restart',
  },
  
  [BackendErrorReasons.SEAT_ALREADY_BOOKED]: {
    title: 'Seat No Longer Available',
    message: 'This seat has been booked and is no longer available. Please choose another seat.',
    category: 'business_logic',
    severity: 'warning',
    primaryStrategy: 'retry_modified',
    secondaryStrategy: 'restart',
  },
  
  [BackendErrorReasons.SEAT_NOT_AVAILABLE]: {
    title: 'Seat Unavailable',
    message: 'This seat is not available for booking. Please select a different seat.',
    category: 'business_logic',
    severity: 'warning',
    primaryStrategy: 'retry_modified',
  },
  
  [BackendErrorReasons.SEAT_LOCKED]: {
    title: 'Seat Temporarily Locked',
    message: 'This seat is being processed by another customer. It may become available in a moment.',
    category: 'business_logic',
    severity: 'info',
    primaryStrategy: 'wait',
    autoRetryable: true,
    retryDelay: 3000,
    retryLimit: 3,
  },
  
  [BackendErrorReasons.STALE_VERSION]: {
    title: 'Information Out of Date',
    message: 'Seat availability has changed. Refreshing the latest information...',
    category: 'conflict',
    severity: 'warning',
    primaryStrategy: 'retry',
    autoRetryable: true,
    retryDelay: 1000,
    retryLimit: 2,
  },
  
  [BackendErrorReasons.RESERVATION_EXPIRED]: {
    title: 'Reservation Expired',
    message: 'Your 10-minute reservation window has expired. Please select your seats again.',
    category: 'business_logic',
    severity: 'warning',
    primaryStrategy: 'restart',
  },
  
  [BackendErrorReasons.RESERVATION_NOT_FOUND]: {
    title: 'Reservation Not Found',
    message: 'We couldn\'t find your reservation. It may have expired. Please start over.',
    category: 'business_logic',
    severity: 'error',
    primaryStrategy: 'restart',
  },
  
  // Event errors
  [BackendErrorReasons.EVENT_NOT_FOUND]: {
    title: 'Event Not Found',
    message: 'This event could not be found. It may have been cancelled or removed.',
    category: 'business_logic',
    severity: 'error',
    primaryStrategy: 'restart',
  },
  
  [BackendErrorReasons.EVENT_SOLD_OUT]: {
    title: 'Event Sold Out',
    message: 'All tickets for this event have been sold. Check back for returns or cancellations.',
    category: 'business_logic',
    severity: 'warning',
    primaryStrategy: 'restart',
  },
  
  [BackendErrorReasons.EVENT_NOT_STARTED]: {
    title: 'Sales Not Started',
    message: 'Ticket sales for this event haven\'t started yet. Please check back later.',
    category: 'business_logic',
    severity: 'info',
    primaryStrategy: 'wait',
  },
  
  [BackendErrorReasons.EVENT_ENDED]: {
    title: 'Event Ended',
    message: 'This event has already ended. Tickets are no longer available.',
    category: 'business_logic',
    severity: 'warning',
    primaryStrategy: 'restart',
  },
  
  // Payment errors
  [BackendErrorReasons.PAYMENT_FAILED]: {
    title: 'Payment Failed',
    message: 'We couldn\'t process your payment. Please check your payment details and try again.',
    category: 'business_logic',
    severity: 'error',
    primaryStrategy: 'retry',
    secondaryStrategy: 'manual',
  },
  
  [BackendErrorReasons.PAYMENT_DECLINED]: {
    title: 'Payment Declined',
    message: 'Your payment was declined by your bank. Please use a different payment method or contact your bank.',
    category: 'business_logic',
    severity: 'error',
    primaryStrategy: 'retry_modified',
    secondaryStrategy: 'contact_support',
  },
  
  [BackendErrorReasons.PAYMENT_TIMEOUT]: {
    title: 'Payment Timeout',
    message: 'The payment request timed out. Your card has not been charged. Please try again.',
    category: 'network',
    severity: 'warning',
    primaryStrategy: 'retry',
    autoRetryable: true,
    retryDelay: 3000,
    retryLimit: 2,
  },
  
  [BackendErrorReasons.INSUFFICIENT_FUNDS]: {
    title: 'Insufficient Funds',
    message: 'Your payment method has insufficient funds. Please use a different payment method.',
    category: 'business_logic',
    severity: 'warning',
    primaryStrategy: 'retry_modified',
  },
  
  [BackendErrorReasons.INVALID_CARD]: {
    title: 'Invalid Card',
    message: 'The card information provided is invalid. Please check and try again.',
    category: 'validation',
    severity: 'warning',
    primaryStrategy: 'manual',
  },
  
  [BackendErrorReasons.PAYMENT_DUPLICATE]: {
    title: 'Duplicate Payment Detected',
    message: 'This payment has already been processed. Please check your booking confirmation.',
    category: 'business_logic',
    severity: 'info',
    primaryStrategy: 'restart',
  },
  
  // Validation errors
  [BackendErrorReasons.INVALID_INPUT]: {
    title: 'Invalid Information',
    message: 'Some information is missing or incorrect. Please review and try again.',
    category: 'validation',
    severity: 'warning',
    primaryStrategy: 'manual',
  },
  
  [BackendErrorReasons.MISSING_REQUIRED_FIELD]: {
    title: 'Required Information Missing',
    message: 'Please fill in all required fields before continuing.',
    category: 'validation',
    severity: 'warning',
    primaryStrategy: 'manual',
  },
  
  [BackendErrorReasons.INVALID_EMAIL]: {
    title: 'Invalid Email',
    message: 'Please enter a valid email address.',
    category: 'validation',
    severity: 'warning',
    primaryStrategy: 'manual',
  },
  
  [BackendErrorReasons.INVALID_PHONE]: {
    title: 'Invalid Phone Number',
    message: 'Please enter a valid phone number.',
    category: 'validation',
    severity: 'warning',
    primaryStrategy: 'manual',
  },
  
  // Auth errors
  [BackendErrorReasons.UNAUTHORIZED]: {
    title: 'Authentication Required',
    message: 'Please sign in to continue.',
    category: 'authentication',
    severity: 'warning',
    primaryStrategy: 'restart',
  },
  
  [BackendErrorReasons.TOKEN_EXPIRED]: {
    title: 'Session Expired',
    message: 'Your session has expired. Please sign in again.',
    category: 'authentication',
    severity: 'warning',
    primaryStrategy: 'restart',
  },
  
  [BackendErrorReasons.FORBIDDEN]: {
    title: 'Access Denied',
    message: 'You don\'t have permission to perform this action.',
    category: 'authorization',
    severity: 'error',
    primaryStrategy: 'contact_support',
  },
  
  // System errors
  [BackendErrorReasons.INTERNAL_ERROR]: {
    title: 'System Error',
    message: 'An unexpected error occurred. Our team has been notified. Please try again.',
    category: 'system',
    severity: 'error',
    primaryStrategy: 'retry',
    secondaryStrategy: 'contact_support',
    autoRetryable: true,
    retryDelay: 3000,
    retryLimit: 2,
  },
  
  [BackendErrorReasons.SERVICE_UNAVAILABLE]: {
    title: 'Service Temporarily Unavailable',
    message: 'The service is temporarily unavailable. Please try again in a few moments.',
    category: 'system',
    severity: 'error',
    primaryStrategy: 'wait',
  },
  
  [BackendErrorReasons.RATE_LIMITED]: {
    title: 'Too Many Requests',
    message: 'Please wait a moment before trying again.',
    category: 'system',
    severity: 'warning',
    primaryStrategy: 'wait',
    autoRetryable: true,
    retryDelay: 5000,
    retryLimit: 2,
  },
  
  [BackendErrorReasons.MAINTENANCE]: {
    title: 'Scheduled Maintenance',
    message: 'We\'re currently performing scheduled maintenance. Please check back soon.',
    category: 'system',
    severity: 'info',
    primaryStrategy: 'wait',
  },
};

/**
 * Action Label Mappings
 */
const ACTION_LABELS: Record<RecoveryStrategy, string> = {
  retry: 'Try Again',
  retry_modified: 'Select Different Options',
  restart: 'Start Over',
  manual: 'Review Information',
  wait: 'Wait and Retry',
  contact_support: 'Contact Support',
};

/**
 * Translate an error to a user-friendly format
 */
export function translateError(
  httpStatus?: number,
  backendReason?: string,
  context?: {
    flow?: 'reservation' | 'payment' | 'timer' | 'general';
    affectedResource?: string;
  }
): TranslatedError {
  // Try backend reason first (more specific)
  let mapping: ErrorMapping | undefined;
  
  if (backendReason) {
    mapping = BACKEND_REASON_MAPPINGS[backendReason];
  }
  
  // Fall back to HTTP status
  if (!mapping && httpStatus !== undefined) {
    mapping = HTTP_STATUS_MAPPINGS[httpStatus];
  }
  
  // Ultimate fallback for unknown errors
  if (!mapping) {
    mapping = {
      title: 'Unexpected Error',
      message: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
      category: 'system',
      severity: 'error',
      primaryStrategy: 'retry',
      secondaryStrategy: 'contact_support',
    };
  }
  
  // Build translated error
  const translatedError: TranslatedError = {
    title: mapping.title,
    message: mapping.message,
    category: mapping.category,
    severity: mapping.severity,
    primaryAction: {
      label: ACTION_LABELS[mapping.primaryStrategy],
      action: mapping.primaryStrategy,
      autoRetryable: mapping.autoRetryable,
      retryDelay: mapping.retryDelay,
      retryLimit: mapping.retryLimit,
    },
    context: context ? {
      flow: context.flow || 'general',
      affectedResource: context.affectedResource,
    } : undefined,
    originalError: {
      httpStatus,
      backendReason,
    },
  };
  
  // Add secondary action if available
  if (mapping.secondaryStrategy) {
    translatedError.secondaryAction = {
      label: ACTION_LABELS[mapping.secondaryStrategy],
      action: mapping.secondaryStrategy,
    };
  }
  
  return translatedError;
}

/**
 * Translate API error response
 */
export function translateApiError(
  error: any,
  context?: {
    flow?: 'reservation' | 'payment' | 'timer' | 'general';
    affectedResource?: string;
  }
): TranslatedError {
  const httpStatus = error?.response?.status || error?.status;
  const backendReason = error?.response?.data?.reason || error?.reason;
  const backendMessage = error?.response?.data?.message || error?.message;
  
  const translated = translateError(httpStatus, backendReason, context);
  
  // Add technical details for debugging
  if (backendMessage) {
    translated.technicalDetails = backendMessage;
  }
  
  return translated;
}

/**
 * Get context-specific error message for reservation flow
 */
export function translateReservationError(
  error: any,
  seatNumbers?: string[]
): TranslatedError {
  const affectedResource = seatNumbers?.join(', ') || 'selected seats';
  return translateApiError(error, {
    flow: 'reservation',
    affectedResource,
  });
}

/**
 * Get context-specific error message for payment flow
 */
export function translatePaymentError(
  error: any,
  bookingId?: string
): TranslatedError {
  return translateApiError(error, {
    flow: 'payment',
    affectedResource: bookingId ? `Booking #${bookingId}` : undefined,
  });
}

/**
 * Get context-specific error message for timer expiry
 */
export function translateTimerError(
  reservationExpired: boolean = true
): TranslatedError {
  if (reservationExpired) {
    return translateError(
      undefined,
      BackendErrorReasons.RESERVATION_EXPIRED,
      { flow: 'timer' }
    );
  }
  
  return translateError(undefined, undefined, { flow: 'timer' });
}

/**
 * Check if an error is retryable
 */
export function isRetryable(translatedError: TranslatedError): boolean {
  return translatedError.primaryAction.action === 'retry' ||
         translatedError.primaryAction.action === 'wait' ||
         translatedError.primaryAction.autoRetryable === true;
}

/**
 * Check if an error requires restart
 */
export function requiresRestart(translatedError: TranslatedError): boolean {
  return translatedError.primaryAction.action === 'restart';
}

/**
 * Get retry configuration
 */
export function getRetryConfig(translatedError: TranslatedError): {
  delay: number;
  maxAttempts: number;
} {
  return {
    delay: translatedError.primaryAction.retryDelay || 3000,
    maxAttempts: translatedError.primaryAction.retryLimit || 3,
  };
}
