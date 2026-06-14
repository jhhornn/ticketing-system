import { useState, useEffect, useCallback, useRef } from 'react';

interface PaymentProtectionState {
  /** Whether slow network has been detected (>5s request time) */
  isSlowNetwork: boolean;
  /** Whether an idempotency replay was detected */
  isReplay: boolean;
  /** Booking reference from replay (if available) */
  replayBookingReference?: string;
  /** Current request start time */
  requestStartTime: number | null;
  /** Request duration in milliseconds */
  requestDuration: number;
}

interface UsePaymentProtectionReturn extends PaymentProtectionState {
  /** Call when payment request starts */
  startPaymentTracking: () => void;
  /** Call when payment request completes */
  endPaymentTracking: (isReplayDetected?: boolean, bookingReference?: string) => void;
  /** Reset all tracking state */
  resetTracking: () => void;
  /** Track analytics event */
  trackEvent: (eventName: string, metadata?: Record<string, unknown>) => void;
}

/**
 * usePaymentProtection
 * 
 * Custom hook for managing payment protection UX features:
 * - Slow network detection
 * - Idempotency replay detection
 * - Analytics tracking
 * 
 * **Detection Logic:**
 * - Slow network: Request duration > 5 seconds
 * - Replay: Backend returns `Idempotency-Replay: true` header or HTTP 200 (vs 201)
 * 
 * **Usage:**
 * ```tsx
 * const {
 *   isSlowNetwork,
 *   isReplay,
 *   replayBookingReference,
 *   startPaymentTracking,
 *   endPaymentTracking,
 *   trackEvent,
 * } = usePaymentProtection();
 * 
 * // Before payment request
 * startPaymentTracking();
 * 
 * // After payment response
 * const isReplay = response.headers['idempotency-replay'] === 'true';
 * endPaymentTracking(isReplay, booking.bookingReference);
 * 
 * // Track user interactions
 * trackEvent('payment_protection_badge_clicked');
 * ```
 */
export const usePaymentProtection = (): UsePaymentProtectionReturn => {
  const [state, setState] = useState<PaymentProtectionState>({
    isSlowNetwork: false,
    isReplay: false,
    replayBookingReference: undefined,
    requestStartTime: null,
    requestDuration: 0,
  });

  const slowNetworkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Start tracking payment request
  const startPaymentTracking = useCallback(() => {
    const startTime = Date.now();
    
    setState((prev) => ({
      ...prev,
      requestStartTime: startTime,
      isSlowNetwork: false,
      isReplay: false,
      replayBookingReference: undefined,
      requestDuration: 0,
    }));

    // Set timer to detect slow network after 5 seconds
    slowNetworkTimerRef.current = setTimeout(() => {
      setState((prev) => ({
        ...prev,
        isSlowNetwork: true,
      }));
    }, 5000);
  }, []);

  // End tracking payment request
  const endPaymentTracking = useCallback(
    (isReplayDetected = false, bookingReference?: string) => {
      // Clear slow network timer
      if (slowNetworkTimerRef.current) {
        clearTimeout(slowNetworkTimerRef.current);
        slowNetworkTimerRef.current = null;
      }

      setState((prev) => {
        const duration = prev.requestStartTime
          ? Date.now() - prev.requestStartTime
          : 0;

        return {
          ...prev,
          requestStartTime: null,
          requestDuration: duration,
          isReplay: isReplayDetected,
          replayBookingReference: isReplayDetected ? bookingReference : undefined,
          // Keep isSlowNetwork true if it was already detected
          isSlowNetwork: prev.isSlowNetwork || duration > 5000,
        };
      });
    },
    []
  );

  // Reset all tracking state
  const resetTracking = useCallback(() => {
    if (slowNetworkTimerRef.current) {
      clearTimeout(slowNetworkTimerRef.current);
      slowNetworkTimerRef.current = null;
    }

    setState({
      isSlowNetwork: false,
      isReplay: false,
      replayBookingReference: undefined,
      requestStartTime: null,
      requestDuration: 0,
    });
  }, []);

  // Track analytics events
  const trackEvent = useCallback(
    (eventName: string, metadata?: Record<string, unknown>) => {
      // Log to console (replace with actual analytics integration)
      console.log('[Payment Protection Analytics]', {
        event: eventName,
        timestamp: new Date().toISOString(),
        ...metadata,
        requestDuration: state.requestDuration,
        wasSlowNetwork: state.isSlowNetwork,
        wasReplay: state.isReplay,
      });

      // TODO: Integrate with actual analytics service
      // Example: analytics.track(eventName, metadata);
    },
    [state.requestDuration, state.isSlowNetwork, state.isReplay]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (slowNetworkTimerRef.current) {
        clearTimeout(slowNetworkTimerRef.current);
      }
    };
  }, []);

  return {
    ...state,
    startPaymentTracking,
    endPaymentTracking,
    resetTracking,
    trackEvent,
  };
};

/**
 * Utility function to detect idempotency replay from response
 * 
 * @param response - Axios response object
 * @returns Whether replay was detected
 */
export const detectIdempotencyReplay = (response: {
  status: number;
  headers: Record<string, string>;
}): boolean => {
  // Check for explicit header
  if (response.headers['idempotency-replay'] === 'true') {
    return true;
  }

  // Check for HTTP 200 (existing booking) vs 201 (new booking)
  // Note: Backend should send 200 for replays, 201 for new bookings
  if (response.status === 200) {
    return true;
  }

  return false;
};
