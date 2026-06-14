import React, { useState, useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';
import { PaymentProtectionCopy } from '../../utils/uiCopy';

interface IdempotencyReplayNotificationProps {
  /** Whether an idempotency replay was detected */
  isReplay: boolean;
  /** The booking reference from the replayed response */
  bookingReference?: string;
  /** Callback when notification is dismissed */
  onDismiss?: () => void;
  /** Optional callback for analytics */
  onDisplay?: () => void;
  /** Auto-dismiss after X seconds (default: 8) */
  autoDismissSeconds?: number;
}

/**
 * IdempotencyReplayNotification
 * 
 * Displays a success notification when the backend returns a cached response
 * due to idempotency replay (duplicate payment attempt detected and prevented).
 * 
 * **Purpose:**
 * - Surface idempotency protection in plain language
 * - Reassure users that duplicate charge was prevented
 * - Build trust in the payment system
 * 
 * **Detection:**
 * - Backend returns `Idempotency-Replay: true` header
 * - HTTP 200 response with existing booking data (vs 201 for new booking)
 * 
 * **Usage:**
 * ```tsx
 * <IdempotencyReplayNotification
 *   isReplay={response.headers['idempotency-replay'] === 'true'}
 *   bookingReference={booking.bookingReference}
 *   onDisplay={() => analytics.track('replay_surfaced')}
 * />
 * ```
 */
export const IdempotencyReplayNotification: React.FC<IdempotencyReplayNotificationProps> = ({
  isReplay,
  bookingReference,
  onDismiss,
  onDisplay,
  autoDismissSeconds = 8,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isReplay) {
      setIsVisible(true);
      onDisplay?.();

      // Auto-dismiss after specified seconds
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoDismissSeconds * 1000);

      return () => clearTimeout(timer);
    }
  }, [isReplay, autoDismissSeconds, onDisplay]);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible || !isReplay) return null;

  const message = bookingReference
    ? PaymentProtectionCopy.replay.notification.message(bookingReference)
    : PaymentProtectionCopy.replay.short;

  return (
    <div
      className="
        bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg
        shadow-md animate-slide-in-from-top
      "
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <CheckCircle className="w-6 h-6 text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-green-900 text-sm mb-1">
            {PaymentProtectionCopy.replay.notification.heading}
          </h3>
          <p className="text-green-800 text-sm leading-relaxed">
            {message}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="
            flex-shrink-0 text-green-600 hover:text-green-800 
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 
            rounded transition-colors
          "
          aria-label="Dismiss notification"
          title="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
