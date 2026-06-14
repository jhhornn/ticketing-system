import React, { useEffect, useState } from 'react';
import type { SeatStatusExplanation } from '../../utils/seatStatusUtils';
import './SeatStatusTooltip.css';

export interface SeatStatusChange {
  seatId: number;
  seatNumber: string;
  explanation: SeatStatusExplanation;
  position?: { x: number; y: number };
}

interface SeatStatusTooltipProps {
  change: SeatStatusChange | null;
  onDismiss: () => void;
  autoHideDuration?: number; // milliseconds
}

/**
 * SeatStatusTooltip Component
 * 
 * Displays a short-lived tooltip (3-5 seconds) when a seat's status changes,
 * providing human-readable explanations to improve user trust and transparency.
 * 
 * Features:
 * - Auto-dismisses after specified duration
 * - Severity-based styling (info, warning, error)
 * - Optional positioning near the affected seat
 * - Smooth fade-in/fade-out animations
 */
export const SeatStatusTooltip: React.FC<SeatStatusTooltipProps> = ({
  change,
  onDismiss,
  autoHideDuration = 4000, // 4 seconds default
}) => {
  const [isVisible, setIsVisible] = useState(!!change);

  useEffect(() => {
    if (!change) return;

    // Fade in with a small delay for animation
    const fadeInTimer = setTimeout(() => setIsVisible(true), 10);

    // Auto-hide after duration
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      // Give time for fade-out animation before calling onDismiss
      setTimeout(onDismiss, 300);
    }, autoHideDuration);

    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(hideTimer);
    };
  }, [change, autoHideDuration, onDismiss]);

  if (!change) return null;

  const { explanation, seatNumber, position } = change;
  const severityClass = `tooltip-${explanation.severity}`;
  const visibilityClass = isVisible ? 'tooltip-visible' : 'tooltip-hidden';

  const style = position
    ? {
        position: 'absolute' as const,
        left: position.x,
        top: position.y,
      }
    : {};

  return (
    <div
      className={`seat-status-tooltip ${severityClass} ${visibilityClass}`}
      style={style}
      role="alert"
      aria-live="polite"
    >
      <div className="tooltip-header">
        <span className="tooltip-icon">{getSeverityIcon(explanation.severity)}</span>
        <strong className="tooltip-title">{explanation.title}</strong>
        <button
          className="tooltip-close"
          onClick={() => {
            setIsVisible(false);
            setTimeout(onDismiss, 300);
          }}
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
      <div className="tooltip-body">
        <p className="tooltip-message">{explanation.message}</p>
        <span className="tooltip-seat-number">Seat: {seatNumber}</span>
      </div>
    </div>
  );
};

/**
 * Get icon based on severity
 */
function getSeverityIcon(severity: 'info' | 'warning' | 'error'): string {
  switch (severity) {
    case 'info':
      return 'ℹ️';
    case 'warning':
      return '⚠️';
    case 'error':
      return '❌';
    default:
      return 'ℹ️';
  }
}
