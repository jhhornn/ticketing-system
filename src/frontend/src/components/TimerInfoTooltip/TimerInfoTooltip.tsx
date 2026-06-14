import React, { useState } from 'react';
import './TimerInfoTooltip.css';

interface TimerInfoTooltipProps {
  /** Whether time extension is allowed (feature flag) */
  extensionAllowed?: boolean;
  /** Callback when user clicks "Extend Time" (only shown if allowed) */
  onExtendTime?: () => void;
  /** Custom positioning (optional) */
  position?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * TimerInfoTooltip Component
 * 
 * Shows an explanation tooltip about reservation time limits and extensions.
 * Appears as "?" icon that users can click to learn more.
 * 
 * **Purpose:**
 * - Educates users why time limits exist (fairness)
 * - Shows extension option if enabled (future feature)
 * - Reduces anxiety by explaining the rules upfront
 * 
 * **Usage:**
 * ```tsx
 * <TimerInfoTooltip 
 *   extensionAllowed={false}
 * />
 * ```
 */
export const TimerInfoTooltip: React.FC<TimerInfoTooltipProps> = ({
  extensionAllowed = false,
  onExtendTime,
  position = 'bottom',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const tooltipContent = extensionAllowed 
    ? {
        title: 'Can I extend my time?',
        message: 'Click to add 5 more minutes (one-time extension)',
        action: 'Extend Time',
      }
    : {
        title: 'Can I extend my time?',
        message: 'Reservation time is fixed to ensure fairness. If your time runs out, seats return to the pool for other customers.',
        explanation: 'This prevents seats from being held indefinitely while others are waiting.',
      };

  const handleExtend = () => {
    if (extensionAllowed && onExtendTime) {
      onExtendTime();
      setIsOpen(false);
    }
  };

  return (
    <div className="timer-info-tooltip-wrapper">
      <button
        className="timer-info-icon"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Learn about reservation time limits"
        aria-expanded={isOpen}
        type="button"
      >
        ?
      </button>

      {isOpen && (
        <>
          {/* Backdrop for mobile tap-to-close */}
          <div 
            className="timer-tooltip-backdrop" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <div 
            className={`timer-tooltip-content ${position}`}
            role="tooltip"
          >
            <div className="timer-tooltip-header">
              <h4>{tooltipContent.title}</h4>
              <button
                className="timer-tooltip-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
                type="button"
              >
                ×
              </button>
            </div>

            <div className="timer-tooltip-body">
              <p>{tooltipContent.message}</p>
              
              {!extensionAllowed && tooltipContent.explanation && (
                <p className="timer-tooltip-explanation">
                  <span className="tooltip-icon">💡</span>
                  {tooltipContent.explanation}
                </p>
              )}

              {extensionAllowed && (
                <button
                  className="timer-extend-btn"
                  onClick={handleExtend}
                  type="button"
                >
                  {tooltipContent.action}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
