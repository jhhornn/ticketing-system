import React from 'react';
import { Clock, Wifi } from 'lucide-react';
import { PaymentProtectionCopy } from '../../utils/uiCopy';

interface SlowNetworkIndicatorProps {
  /** Whether slow network has been detected */
  isSlowNetwork: boolean;
  /** Optional callback for analytics */
  onDisplay?: () => void;
}

/**
 * SlowNetworkIndicator
 * 
 * Displays a reassuring message when payment processing is taking longer than expected
 * due to slow network conditions. Prevents users from abandoning or refreshing the page.
 * 
 * **Purpose:**
 * - Reduce payment abandonment during slow connections
 * - Reassure users that retry is safe
 * - Prevent page refreshes that could cause confusion
 * 
 * **Triggers:**
 * - Payment request exceeds 5 seconds
 * - Network latency detected
 * 
 * **Usage:**
 * ```tsx
 * <SlowNetworkIndicator 
 *   isSlowNetwork={requestDuration > 5000}
 *   onDisplay={() => analytics.track('slow_network_shown')}
 * />
 * ```
 */
export const SlowNetworkIndicator: React.FC<SlowNetworkIndicatorProps> = ({
  isSlowNetwork,
  onDisplay,
}) => {
  React.useEffect(() => {
    if (isSlowNetwork) {
      onDisplay?.();
    }
  }, [isSlowNetwork, onDisplay]);

  if (!isSlowNetwork) return null;

  return (
    <div
      className="
        bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg
        animate-fade-in
      "
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="relative">
            <Wifi className="w-5 h-5 text-amber-600" />
            <Clock className="w-3 h-3 text-amber-600 absolute -bottom-0.5 -right-0.5" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-amber-900 text-sm mb-1">
            {PaymentProtectionCopy.slowNetwork.reassurance.heading}
          </h3>
          <p className="text-amber-800 text-sm leading-relaxed mb-2">
            {PaymentProtectionCopy.slowNetwork.reassurance.message}
          </p>
          <p className="text-amber-700 text-xs font-medium">
            {PaymentProtectionCopy.slowNetwork.safeToWait}
          </p>
        </div>
      </div>
    </div>
  );
};
