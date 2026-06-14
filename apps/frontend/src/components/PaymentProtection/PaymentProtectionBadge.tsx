import React, { useState } from 'react';
import { Shield, Info, Check, RefreshCw } from 'lucide-react';
import { PaymentProtectionCopy } from '../../utils/uiCopy';

interface PaymentProtectionBadgeProps {
  /** Callback when badge is clicked - for analytics */
  onBadgeClick?: () => void;
  /** Optional className for styling */
  className?: string;
}

/**
 * PaymentProtectionBadge
 * 
 * Displays a "Payment Protected" badge that opens an educational modal
 * explaining idempotency protection and retry safety.
 * 
 * **Purpose:**
 * - Reduces payment anxiety by making protection visible
 * - Educates users about duplicate charge prevention
 * - Encourages safe retries when payments fail
 * 
 * **Usage:**
 * ```tsx
 * <PaymentProtectionBadge 
 *   onBadgeClick={() => analytics.track('payment_protection_viewed')}
 * />
 * ```
 */
export const PaymentProtectionBadge: React.FC<PaymentProtectionBadgeProps> = ({
  onBadgeClick,
  className = '',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleBadgeClick = () => {
    setIsModalOpen(true);
    onBadgeClick?.();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      {/* Badge Button */}
      <button
        type="button"
        onClick={handleBadgeClick}
        className={`
          inline-flex items-center gap-2 px-3 py-1.5 
          bg-green-50 hover:bg-green-100 
          border border-green-200 rounded-lg 
          text-sm font-medium text-green-700 
          transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
          ${className}
        `}
        title={PaymentProtectionCopy.tooltips.badgeHover}
        aria-label="Payment protection information"
      >
        <Shield className="w-4 h-4" />
        <span>{PaymentProtectionCopy.badge.text}</span>
        <Info className="w-3.5 h-3.5 opacity-70" />
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="payment-protection-title"
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-8 h-8" />
                <h2 id="payment-protection-title" className="text-2xl font-bold">
                  {PaymentProtectionCopy.modal.title}
                </h2>
              </div>
              <p className="text-green-50 text-sm">
                {PaymentProtectionCopy.modal.subtitle}
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* No Double Charges */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {PaymentProtectionCopy.modal.sections.noDoubleCharge.heading}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {PaymentProtectionCopy.modal.sections.noDoubleCharge.message}
                  </p>
                </div>
              </div>

              {/* How It Works */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Info className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {PaymentProtectionCopy.modal.sections.howItWorks.heading}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {PaymentProtectionCopy.modal.sections.howItWorks.message}
                  </p>
                </div>
              </div>

              {/* Safe to Retry */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {PaymentProtectionCopy.modal.sections.safeRetry.heading}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {PaymentProtectionCopy.modal.sections.safeRetry.message}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end border-t border-gray-200">
              <button
                onClick={handleCloseModal}
                className="
                  px-6 py-2 bg-green-600 hover:bg-green-700 
                  text-white font-medium rounded-lg 
                  transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                "
              >
                {PaymentProtectionCopy.modal.cta}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
