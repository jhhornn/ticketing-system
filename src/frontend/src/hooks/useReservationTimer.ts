// import { useState, useEffect, useCallback, useRef } from 'react';

// interface UseReservationTimerProps {
//   expiresAt: Date | null;
//   onExpire?: () => void;
//   warningThresholdSeconds?: number; // Show warning when time remaining is below this
// }

// interface UseReservationTimerReturn {
//   // Time remaining
//   timeRemaining: number; // seconds
//   timeRemainingFormatted: string; // "MM:SS"
  
//   // State flags
//   isExpired: boolean;
//   isWarning: boolean; // true when below warning threshold
  
//   // Progress (for progress bars)
//   progressPercentage: number; // 0-100
  
//   // Actions
//   reset: (newExpiresAt: Date) => void;
//   clear: () => void;
// }

// /**
//  * useReservationTimer Hook
//  * 
//  * Countdown timer for seat reservations with automatic expiry handling.
//  * Updates every second and triggers callback when time runs out.
//  * 
//  * **Visual States:**
//  * - Normal (>60s): Green/Blue timer
//  * - Warning (<60s): Yellow/Orange timer with pulse animation
//  * - Critical (<30s): Red timer with faster pulse
//  * - Expired (0s): Triggers onExpire callback
//  * 
//  * **Backend Integration:**
//  * - expiresAt comes from POST /events/:id/reservations response
//  * - When expired, backend cron job releases seats automatically
//  * - Frontend should poll /events/:id/seats every 5-10s to detect releases
//  * 
//  * **Edge Cases:**
//  * - User closes tab: Reservation expires server-side (10 min default)
//  * - Clock skew: Use server timestamp, not client time
//  * - Network delay: Add 2-3 second buffer to avoid race conditions
//  * 
//  * **UX Flow:**
//  * 1. User reserves seats → receives expiresAt timestamp
//  * 2. Timer starts countdown from 10:00
//  * 3. At 1:00 → show warning toast
//  * 4. At 0:00 → call onExpire() → redirect to seat map
//  * 5. Show modal: "Your reservation expired. Please select seats again."
//  * 
//  * @example
//  * ```tsx
//  * const { timeRemainingFormatted, isWarning, isExpired } = useReservationTimer({
//  *   expiresAt: reservation.expiresAt,
//  *   onExpire: () => {
//  *     toast.error('Reservation expired');
//  *     navigate(`/events/${eventId}`);
//  *   },
//  *   warningThresholdSeconds: 60,
//  * });
//  * 
//  * return (
//  *   <div className={`timer ${isWarning ? 'warning' : ''} ${isExpired ? 'expired' : ''}`}>
//  *     ⏱️ {timeRemainingFormatted}
//  *   </div>
//  * );
//  * ```
//  */
// export const useReservationTimer = ({
//   expiresAt,
//   onExpire,
//   warningThresholdSeconds = 60,
// }: UseReservationTimerProps): UseReservationTimerReturn => {
//   const [timeRemaining, setTimeRemaining] = useState<number>(0);
//   const [isExpired, setIsExpired] = useState<boolean>(false);
//   const [initialDuration, setInitialDuration] = useState<number>(0);
//   const intervalRef = useRef<number | null>(null);
//   const onExpireRef = useRef(onExpire);

//   // Keep onExpire callback up to date
//   useEffect(() => {
//     onExpireRef.current = onExpire;
//   }, [onExpire]);

//   // Main timer effect
//   useEffect(() => {
//     if (!expiresAt) {
//       return;
//     }

//     const now = Date.now();
//     const expires = new Date(expiresAt).getTime();
//     const duration = Math.max(0, Math.floor((expires - now) / 1000));
    
//     // Store initial duration for progress calculation
//     setInitialDuration(duration);

//     const updateTimer = () => {
//       const now = Date.now();
//       const expires = new Date(expiresAt).getTime();
//       const remaining = Math.max(0, Math.floor((expires - now) / 1000));

//       setTimeRemaining(remaining);

//       if (remaining === 0 && !isExpired) {
//         setIsExpired(true);
        
//         // Call onExpire callback
//         if (onExpireRef.current) {
//           onExpireRef.current();
//         }

//         // Clear interval
//         if (intervalRef.current) {
//           clearInterval(intervalRef.current);
//           intervalRef.current = null;
//         }
//       }
//     };

//     // Initial update
//     updateTimer();

//     // Update every second
//     intervalRef.current = setInterval(updateTimer, 1000);

//     return () => {
//       if (intervalRef.current) {
//         clearInterval(intervalRef.current);
//         intervalRef.current = null;
//       }
//     };
//   }, [expiresAt, isExpired]);

//   const reset = useCallback((newExpiresAt: Date) => {
//     const now = Date.now();
//     const expires = new Date(newExpiresAt).getTime();
//     const duration = Math.max(0, Math.floor((expires - now) / 1000));
    
//     setInitialDuration(duration);
//     setTimeRemaining(duration);
//     setIsExpired(false);
//   }, []);

//   const clear = useCallback(() => {
//     if (intervalRef.current) {
//       clearInterval(intervalRef.current);
//       intervalRef.current = null;
//     }
//     setTimeRemaining(0);
//     setIsExpired(true);
//   }, []);

//   // Format time as MM:SS
//   const timeRemainingFormatted = (() => {
//     const minutes = Math.floor(timeRemaining / 60);
//     const seconds = timeRemaining % 60;
//     return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
//   })();

//   // Determine warning state
//   const isWarning = timeRemaining > 0 && timeRemaining <= warningThresholdSeconds;

//   // Calculate progress percentage (100% = full time, 0% = expired)
//   const progressPercentage = initialDuration > 0
//     ? Math.max(0, Math.min(100, (timeRemaining / initialDuration) * 100))
//     : 0;

//   return {
//     timeRemaining,
//     timeRemainingFormatted,
//     isExpired,
//     isWarning,
//     progressPercentage,
//     reset,
//     clear,
//   };
// };

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

interface UseReservationTimerProps {
  expiresAt: Date | string | null; // Allow string to be safe with API JSON responses
  onExpire?: () => void;
  warningThresholdSeconds?: number;
}

interface UseReservationTimerReturn {
  timeRemaining: number;
  timeRemainingFormatted: string;
  isExpired: boolean;
  isWarning: boolean;
  progressPercentage: number;
  reset: (newExpiresAt: Date) => void;
  clear: () => void;
}

export const useReservationTimer = ({
  expiresAt,
  onExpire,
  warningThresholdSeconds = 60,
}: UseReservationTimerProps): UseReservationTimerReturn => {
  
  // Helper to ensure we have a valid timestamp number
  const getTimestamp = (date: Date | string | null) => 
    date ? new Date(date).getTime() : 0;

  // Helper to calculate seconds remaining
  const calculateRemaining = (targetTime: number) => {
    if (!targetTime) return 0;
    const now = Date.now();
    return Math.max(0, Math.floor((targetTime - now) / 1000));
  };

  // 1. Convert prop to a timestamp for stable comparison
  const targetTimestamp = getTimestamp(expiresAt);

  // 2. STATE
  // We track the 'last seen' timestamp to detect prop changes
  const [trackedTimestamp, setTrackedTimestamp] = useState<number>(targetTimestamp);
  
  // The actual countdown state
  const [timeRemaining, setTimeRemaining] = useState<number>(() => calculateRemaining(targetTimestamp));
  
  // The duration used for the progress bar (State, NOT Ref, so we can read it in render)
  const [initialDuration, setInitialDuration] = useState<number>(() => calculateRemaining(targetTimestamp));

  // 3. PROP SYNC (The Fix for Error #1)
  // If the prop changes (e.g. new reservation made), we update state *during render*.
  // React detects this, aborts the current render, and re-renders with the new state immediately.
  if (targetTimestamp !== trackedTimestamp) {
    const newRemaining = calculateRemaining(targetTimestamp);
    setTrackedTimestamp(targetTimestamp);
    setTimeRemaining(newRemaining);
    setInitialDuration(newRemaining);
  }

  // 4. REFS (For non-visual logic)
  const intervalRef = useRef<number | null>(null);
  const onExpireRef = useRef(onExpire);
  const hasExpiredRef = useRef(false);

  // Keep callback fresh
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  // 5. EFFECT (The Ticking Logic)
  useEffect(() => {
    // If no time, stop.
    if (!targetTimestamp) return;

    // Reset expiry tracker on new valid time
    hasExpiredRef.current = false;

    // Clear existing interval
    if (intervalRef.current) clearInterval(intervalRef.current);

    // Start Interval
    intervalRef.current = window.setInterval(() => {
      setTimeRemaining((prev) => {
        const next = prev - 1;
        
        if (next <= 0) {
          // Timer Finished
          if (intervalRef.current) clearInterval(intervalRef.current);
          
          // Trigger callback safely
          if (!hasExpiredRef.current && onExpireRef.current) {
            hasExpiredRef.current = true;
            onExpireRef.current();
          }
          return 0;
        }
        return next;
      });
    }, 1000);

    // Cleanup
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  // We depend on targetTimestamp. The internal state 'timeRemaining' drives the cleanup naturally.
  }, [targetTimestamp]); 

  // 6. DERIVED UI HELPERS
  const isExpired = timeRemaining === 0 && targetTimestamp > 0;
  const isWarning = timeRemaining > 0 && timeRemaining <= warningThresholdSeconds;

  const timeRemainingFormatted = useMemo(() => {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [timeRemaining]);

  // 7. PROGRESS CALCULATION (Fix for Error #2)
  // Now accessing 'initialDuration' (State), not 'initialDurationRef'
  const progressPercentage = initialDuration > 0
    ? Math.max(0, Math.min(100, (timeRemaining / initialDuration) * 100))
    : 0;

  // Manual Actions
  const reset = useCallback((newExpiresAt: Date) => {
    // Note: This relies on the parent passing the new prop down usually,
    // but for local overrides:
    const newTarget = getTimestamp(newExpiresAt);
    const newVal = calculateRemaining(newTarget);
    setTrackedTimestamp(newTarget);
    setTimeRemaining(newVal);
    setInitialDuration(newVal);
    hasExpiredRef.current = false;
  }, []);

  const clear = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimeRemaining(0);
    hasExpiredRef.current = true;
  }, []);

  return {
    timeRemaining,
    timeRemainingFormatted,
    isExpired,
    isWarning,
    progressPercentage,
    reset,
    clear,
  };
};