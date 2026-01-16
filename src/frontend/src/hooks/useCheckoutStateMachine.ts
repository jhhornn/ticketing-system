import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

/**
 * Checkout State Machine States:
 * 
 * IDLE → User hasn't started checkout
 * RESERVING → Calling POST /events/:id/reservations
 * RESERVED → Seats reserved, showing checkout form
 * PROCESSING_PAYMENT → Submitting payment with idempotency key
 * CONFIRMING → Waiting for booking confirmation
 * CONFIRMED → Booking successful, showing confirmation
 * FAILED → Error occurred, showing retry options
 * EXPIRED → Reservation timer expired
 */
export type CheckoutState =
  | 'IDLE'
  | 'RESERVING'
  | 'RESERVED'
  | 'PROCESSING_PAYMENT'
  | 'CONFIRMING'
  | 'CONFIRMED'
  | 'FAILED'
  | 'EXPIRED';

interface ReservationData {
  reservedSeatIds: number[];
  expiresAt: Date;
  expiresInSeconds: number;
  failedSeats?: Array<{ seatId: number; reason: string }>;
}

interface BookingData {
  bookingId: number;
  bookingReference: string;
  totalAmount: string;
  status: string;
}

interface CheckoutError {
  message: string;
  code?: string;
  failedSeats?: Array<{ seatId: number; reason: string }>;
  retryable: boolean;
}

interface UseCheckoutStateMachineReturn {
  // Current state
  state: CheckoutState;
  
  // Data
  reservationData: ReservationData | null;
  bookingData: BookingData | null;
  error: CheckoutError | null;
  idempotencyKey: string;
  
  // State transitions
  startReservation: () => void;
  reservationSuccess: (data: ReservationData) => void;
  reservationFailed: (error: CheckoutError) => void;
  startPayment: () => void;
  paymentSuccess: () => void;
  paymentFailed: (error: CheckoutError) => void;
  confirmationSuccess: (data: BookingData) => void;
  confirmationFailed: (error: CheckoutError) => void;
  reservationExpired: () => void;
  reset: () => void;
  
  // Helpers
  canRetry: boolean;
  isLoading: boolean;
  generateNewIdempotencyKey: () => string;
}

/**
 * useCheckoutStateMachine Hook
 * 
 * Manages the complete checkout flow state machine with idempotency.
 * Ensures payment operations are safe to retry using idempotency keys.
 * 
 * **State Machine Flow:**
 * 
 * ```
 * IDLE
 *   ↓ [User clicks "Reserve Seats"]
 * RESERVING (loading)
 *   ↓ [API: POST /events/:id/reservations]
 *   ├→ RESERVED (success) → Show payment form + timer
 *   └→ FAILED (error) → Show retry button
 * 
 * RESERVED
 *   ↓ [User submits payment]
 * PROCESSING_PAYMENT (loading)
 *   ↓ [API: POST /bookings with idempotency key]
 *   ├→ CONFIRMING (waiting for confirmation)
 *   └→ FAILED (error) → Show retry (SAME idempotency key)
 * 
 * CONFIRMING
 *   ↓ [API: GET /bookings/:id]
 *   ├→ CONFIRMED (success) → Show confirmation page
 *   └→ FAILED (error) → Show retry
 * 
 * RESERVED (any state before CONFIRMED)
 *   ↓ [Timer expires]
 * EXPIRED → Show "Session Expired" message
 * ```
 * 
 * **Idempotency Key Strategy:**
 * - Generated once when entering PROCESSING_PAYMENT
 * - Sent in header: `Idempotency-Key: uuid-v4`
 * - Backend stores: { key, request, response, statusCode }
 * - Same key on retry → returns cached response (no duplicate booking)
 * - New attempt (after FAILED + reset) → generates new key
 * 
 * **Error Handling:**
 * - Network error: retryable=true, keep same key
 * - Validation error: retryable=false, must reset
 * - Seat conflict: retryable=false, go back to seat selection
 * - Payment declined: retryable=true, allow payment retry
 * 
 * **Usage Example:**
 * ```tsx
 * const {
 *   state,
 *   startReservation,
 *   reservationSuccess,
 *   startPayment,
 *   idempotencyKey,
 * } = useCheckoutStateMachine();
 * 
 * const handleReserve = async () => {
 *   startReservation();
 *   try {
 *     const data = await reserveSeats(eventId, selectedSeats);
 *     reservationSuccess(data);
 *   } catch (err) {
 *     reservationFailed({ message: err.message, retryable: true });
 *   }
 * };
 * 
 * const handlePayment = async (paymentInfo) => {
 *   startPayment();
 *   try {
 *     const result = await createBooking({
 *       ...paymentInfo,
 *       idempotencyKey, // Include in request
 *     });
 *     confirmationSuccess(result);
 *   } catch (err) {
 *     paymentFailed({ message: err.message, retryable: true });
 *   }
 * };
 * ```
 */
export const useCheckoutStateMachine = (): UseCheckoutStateMachineReturn => {
  const [state, setState] = useState<CheckoutState>('IDLE');
  const [reservationData, setReservationData] = useState<ReservationData | null>(null);
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [error, setError] = useState<CheckoutError | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');
  
  // Track if we're in a loading state
  const isLoading = ['RESERVING', 'PROCESSING_PAYMENT', 'CONFIRMING'].includes(state);
  
  // Can retry if error is retryable and not expired
  const canRetry = error?.retryable === true && state === 'FAILED';

  const generateNewIdempotencyKey = useCallback((): string => {
    const key = `booking-${uuidv4()}`;
    setIdempotencyKey(key);
    return key;
  }, []);

  const startReservation = useCallback(() => {
    setState('RESERVING');
    setError(null);
  }, []);

  const reservationSuccess = useCallback((data: ReservationData) => {
    setState('RESERVED');
    setReservationData(data);
    setError(null);
  }, []);

  const reservationFailed = useCallback((err: CheckoutError) => {
    setState('FAILED');
    setError(err);
  }, []);

  const startPayment = useCallback(() => {
    setState('PROCESSING_PAYMENT');
    setError(null);
    
    // Generate idempotency key if not exists (first attempt)
    if (!idempotencyKey) {
      generateNewIdempotencyKey();
    }
  }, [idempotencyKey, generateNewIdempotencyKey]);

  const paymentSuccess = useCallback(() => {
    setState('CONFIRMING');
    setError(null);
  }, []);

  const paymentFailed = useCallback((err: CheckoutError) => {
    setState('FAILED');
    setError(err);
    // Keep idempotency key for retry
  }, []);

  const confirmationSuccess = useCallback((data: BookingData) => {
    setState('CONFIRMED');
    setBookingData(data);
    setError(null);
  }, []);

  const confirmationFailed = useCallback((err: CheckoutError) => {
    setState('FAILED');
    setError(err);
  }, []);

  const reservationExpired = useCallback(() => {
    setState('EXPIRED');
    setError({
      message: 'Your reservation has expired. Please select seats again.',
      retryable: false,
    });
  }, []);

  const reset = useCallback(() => {
    setState('IDLE');
    setReservationData(null);
    setBookingData(null);
    setError(null);
    setIdempotencyKey('');
  }, []);

  return {
    state,
    reservationData,
    bookingData,
    error,
    idempotencyKey,
    startReservation,
    reservationSuccess,
    reservationFailed,
    startPayment,
    paymentSuccess,
    paymentFailed,
    confirmationSuccess,
    confirmationFailed,
    reservationExpired,
    reset,
    canRetry,
    isLoading,
    generateNewIdempotencyKey,
  };
};
