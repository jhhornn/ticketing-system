/**
 * Error Handling Hook
 * 
 * Provides error translation and automatic retry logic
 */

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  translateApiError,
  translateReservationError,
  translatePaymentError,
  isRetryable,
  // requiresRestart, // Unused
  getRetryConfig,
} from '../utils/errorTranslation';
import type { TranslatedError } from '../types/errors';

interface UseErrorHandlerOptions {
  context?: {
    flow?: 'reservation' | 'payment' | 'timer' | 'general';
    affectedResource?: string;
  };
  onRestart?: () => void;
  onContactSupport?: () => void;
  enableAutoRetry?: boolean;
  retryAction?: () => void | Promise<void>;
}

interface ErrorHandlerResult {
  error: TranslatedError | null;
  handleError: (error: unknown, customOptions?: UseErrorHandlerOptions) => void;
  clearError: () => void;
  retry: () => void;
  isRetrying: boolean;
}

export function useErrorHandler(
  options: UseErrorHandlerOptions = {}
): ErrorHandlerResult {
  const [error, setError] = useState<TranslatedError | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const retryActionRef = useRef<(() => void | Promise<void>) | undefined>(options.retryAction);

  const clearError = useCallback((resetState: boolean = true) => {
    setError(null);
    setIsRetrying(false);
    if (resetState) {
      retryCountRef.current = 0;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
  }, []);

  const handleAction = useCallback((translatedError: TranslatedError) => {
    switch (translatedError.primaryAction.action) {
      case 'restart':
        if (options.onRestart) {
          options.onRestart();
        } else {
          // Default: reload page or navigate to start
          window.location.reload();
        }
        break;
        
      case 'contact_support':
        if (options.onContactSupport) {
          options.onContactSupport();
        } else {
          // Default: show support contact info
          toast.info('Please contact support at support@example.com');
        }
        break;
        
      case 'manual':
        // User needs to review and fix input - no automatic action
        break;
        
      case 'wait':
        // Show waiting message
        toast.info('Please wait a moment and try again');
        break;
    }
  }, [options]);

  const retry = useCallback(() => {
    if (!error) return;
    
    const retryConfig = getRetryConfig(error);
    retryCountRef.current += 1;
    
    if (retryCountRef.current > retryConfig.maxAttempts) {
      toast.error('Max retry attempts reached. Please try again later.');
      setIsRetrying(false);
      return;
    }
    
    setIsRetrying(true);
    
    retryTimeoutRef.current = setTimeout(async () => {
      // Trigger retry by clearing error and executing the retry action
      // Pass false to clearError to PREVENT resetting the retry count
      clearError(false);
      if (retryActionRef.current) {
        try {
            await retryActionRef.current();
        } catch (e) {
            console.error("Retry action failed", e);
        }
      }
    }, retryConfig.delay);
  }, [error, clearError]);

  const handleError = useCallback((
    rawError: unknown,
    customOptions: UseErrorHandlerOptions = {}
  ) => {
    // Clear any existing retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    
    // Update retry action if provided
    if (customOptions.retryAction) {
        retryActionRef.current = customOptions.retryAction;
    } else if (options.retryAction) {
        retryActionRef.current = options.retryAction;
    }
    
    // Merge options
    const mergedContext = {
      ...options.context,
      ...customOptions.context,
    };
    
    // Translate error based on flow
    let translatedError: TranslatedError;
    
    switch (mergedContext.flow) {
      case 'reservation':
        translatedError = translateReservationError(rawError);
        break;
      case 'payment':
        translatedError = translatePaymentError(rawError);
        break;
      default:
        translatedError = translateApiError(rawError, mergedContext);
    }
    
    // Set error state
    setError(translatedError);
    
    // Show toast notification
    toast.error(translatedError.title, {
      description: translatedError.message,
      duration: 5000,
    });
    
    // Handle automatic retry if enabled
    if (
      (options.enableAutoRetry || customOptions.enableAutoRetry) &&
      translatedError.primaryAction.autoRetryable &&
      isRetryable(translatedError)
    ) {
      retry();
    } else {
      // Execute primary action if not retryable
      handleAction(translatedError);
    }
    
    // Log error for monitoring
    console.error('[Error Handler]', {
      title: translatedError.title,
      category: translatedError.category,
      severity: translatedError.severity,
      originalError: translatedError.originalError,
      context: translatedError.context,
    });
  }, [options, retry, handleAction]);

  return {
    error,
    handleError,
    clearError,
    retry,
    isRetrying,
  };
}

/**
 * Specialized hook for reservation errors
 */
export function useReservationErrorHandler(
  onRestart?: () => void
) {
  return useErrorHandler({
    context: { flow: 'reservation' },
    onRestart,
    enableAutoRetry: true,
  });
}

/**
 * Specialized hook for payment errors
 */
export function usePaymentErrorHandler(
  onRestart?: () => void
) {
  return useErrorHandler({
    context: { flow: 'payment' },
    onRestart,
    enableAutoRetry: false, // Payment errors should not auto-retry
  });
}

/**
 * Specialized hook for timer errors
 */
export function useTimerErrorHandler(
  onExpiry: () => void
) {
  return useErrorHandler({
    context: { flow: 'timer' },
    onRestart: onExpiry,
    enableAutoRetry: false,
  });
}
