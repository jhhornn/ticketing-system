/**
 * UI Copy and User-Facing Messages
 * 
 * Centralized location for all user-facing text in the seat selection flow.
 * Improves maintainability and consistency across the application.
 */

export const SeatSelectionCopy = {
  // Seat status labels
  seatStatus: {
    available: 'Available',
    selected: 'Selected',
    reserved: 'Reserved by another customer',
    booked: 'Sold',
    blocked: 'Not available',
  },

  // Selection actions
  actions: {
    selectSeats: 'Select Your Seats',
    reserveSeats: 'Reserve Seats',
    reserving: 'Reserving...',
    clearSelection: 'Clear',
    proceedToCheckout: 'Proceed to Checkout',
    retry: 'Try Again',
  },

  // Availability info
  availability: {
    format: (available: number, total: number) => 
      `${available} / ${total} available`,
    lowAvailability: (available: number) =>
      `Only ${available} seat${available === 1 ? '' : 's'} left!`,
  },

  // Selection summary
  summary: {
    seatsSelected: (count: number) => 
      `${count} seat${count === 1 ? '' : 's'} selected`,
    totalPrice: (price: number) => 
      `$${price.toFixed(2)}`,
    maxSeatsReached: (max: number) =>
      `Maximum ${max} seats can be selected at once`,
  },

  // Reservation timer with dynamic tone based on time remaining
  timer: {
    // Legacy (kept for backward compatibility)
    timeRemaining: 'Time Remaining',
    reservationExpired: '⏱️ Your reservation expired. Please select seats again.',
    almostExpiring: (timeLeft: string) =>
      `⚠️ Hurry! Only ${timeLeft} remaining to complete your purchase.`,

    // Dynamic messaging by phase
    phases: {
      // >5 min: Calm, reassuring tone
      calm: {
        heading: 'Seats secured',
        message: 'Take your time reviewing your order',
        icon: '✓',
        progressNarrative: 'Seats held for you',
      },

      // 5-1 min: Focused, instructional tone
      focused: {
        heading: 'Complete your purchase',
        message: (timeLeft: string) => `${timeLeft} remaining to checkout`,
        icon: '⏱️',
        progressNarrative: 'Checkout in progress',
      },

      // <1 min: Urgent but not alarming
      urgent: {
        heading: 'Almost out of time',
        message: (timeLeft: string) => `${timeLeft} left — finish checkout now`,
        icon: '⏰',
        progressNarrative: 'Finalizing purchase',
      },

      // Expired state
      expired: {
        heading: 'Time expired',
        message: 'Your reservation has ended',
        icon: '⏱️',
        progressNarrative: 'Session ended',
      },
    },

    // Extension tooltip (shown even when extension is not allowed)
    extension: {
      tooltipTitle: 'Can I extend my time?',
      notAllowedMessage: 'Reservation time is fixed to ensure fairness. If your time runs out, seats return to the pool for other customers.',
      allowedMessage: 'Click to add 5 more minutes (one-time extension)',
      whyFixedTime: 'This prevents seats from being held indefinitely while others are waiting.',
    },
  },

  // Success messages
  success: {
    seatsReserved: (count: number) =>
      `✅ Successfully reserved ${count} seat${count === 1 ? '' : 's'}!`,
    readyForCheckout: 'Your seats are reserved! Complete your purchase within the time shown above.',
  },

  // Error messages
  errors: {
    loadFailed: '📡 Failed to load seat map. Please try again.',
    reservationFailed: '❌ Unable to reserve seats. Please try again.',
    noSeatsSelected: '⚠️ Please select at least one seat.',
    seatBecameUnavailable: (seatNumber: string) =>
      `🔄 Seat ${seatNumber} became unavailable and was removed from your selection.`,
    connectionIssue: '📡 Connection issue. Retrying...',
  },

  // Version mismatch / optimistic locking
  versionConflict: {
    single: (seatNumber: string) =>
      `🔄 Seat ${seatNumber} was just reserved by another customer.`,
    multiple: (count: number) =>
      `🔄 ${count} seats were just reserved by other customers.`,
    withRefresh: 'The seat map has been refreshed with current availability.',
    suggestion: 'Please select different seats to continue.',
  },

  // Partial success
  partialSuccess: {
    someFailed: (succeeded: number, failed: number) =>
      `⚠️ Reserved ${succeeded} seat${succeeded === 1 ? '' : 's'}. ${failed} seat${failed === 1 ? '' : 's'} became unavailable.`,
    selectAlternatives: 'You may select additional seats if available.',
    
    // Modal copy for partial reservation decisions
    modal: {
      title: 'Partial Reservation Success',
      subtitle: (reserved: number, total: number) =>
        `We reserved ${reserved} of ${total} seats you selected`,
      
      // Explanations by reason type
      explanations: {
        just_taken: {
          single: 'This seat was reserved by another customer just moments ago while you were selecting.',
          multiple: (count: number) => 
            `These ${count} seats were reserved by other customers just moments ago.`,
        },
        sold_out: {
          single: 'This seat was just purchased and is no longer available.',
          multiple: (count: number) =>
            `These ${count} seats were just purchased and are no longer available.`,
        },
        reserved: {
          single: 'This seat is temporarily reserved by another customer (may become available if not purchased).',
          multiple: (count: number) =>
            `These ${count} seats are temporarily reserved by other customers.`,
        },
        timing: 'These seats were being processed by another request at the same time. They may be available now.',
        context: 'Popular events fill up quickly. Seats are only held once you click "Reserve."',
      },
      
      // Decision recommendations
      recommendations: {
        proceed_strong: {
          heading: 'Proceed with available seats',
          message: (rate: number, failed: number) =>
            `You got ${rate}% of what you wanted. The missing ${failed === 1 ? 'seat was' : 'seats were'} likely taken moments ago, and similar seats may not be available.`,
          benefits: (reserved: number) => [
            `✓ You've secured ${reserved} confirmed ${reserved === 1 ? 'seat' : 'seats'}`,
            '✓ Seats are held for 10 minutes',
          ],
          tradeoff: (failed: number) =>
            failed === 1 ? '⚠️ 1 person may need alternative seating' : `⚠️ ${failed} people may need alternative seating`,
        },
        
        try_again_strong: {
          heading: 'Try selecting more seats together',
          message: (rate: number, total: number) =>
            `You only got ${rate}% of what you wanted. It may be better to cancel and find ${total} seats together.`,
          benefits: [
            '↻ Different seats may be available now',
            '↻ Consider alternative sections or rows',
          ],
          tradeoff: '⚠️ Your current reservation will be released',
        },
        
        neutral: {
          heading: 'Your choice',
          message: (reserved: number, rate: number, total: number) =>
            `You got ${rate}% of what you wanted. Consider whether ${reserved} seats work for your group, or if you need all ${total} together.`,
          options: [
            '→ Proceed if fewer seats are acceptable',
            '→ Try again if you need everyone together',
            '⚠️ No guarantee similar seats available',
          ],
        },
      },
      
      // Action button labels
      actions: {
        proceedWith: (count: number, price: number) =>
          `Proceed with ${count} ${count === 1 ? 'Seat' : 'Seats'} ($${price.toFixed(2)})`,
        selectTogether: (count: number) =>
          `Select ${count} Seats Together`,
        tryAgain: 'Try Again',
        proceedAnyway: (price: number) =>
          `Proceed Anyway ($${price.toFixed(2)})`,
        cancelAll: 'Cancel All',
      },
      
      // Trade-off cards
      tradeoffs: {
        successRate: {
          label: 'Success Rate',
          description: (reserved: number, total: number) =>
            `${reserved} of ${total} seats`,
        },
        totalPrice: {
          label: 'Total Price',
          lostValue: (amount: number) => `$${amount.toFixed(2)} lost`,
        },
        groupImpact: {
          label: 'Group Impact',
          single: 'Person may need to sit separately',
          multiple: 'Group may be split up',
        },
      },
      
      // Section headers
      sections: {
        whyHappened: 'Why did this happen?',
        reserved: (count: number) =>
          `✓ Reserved (${count} ${count === 1 ? 'seat' : 'seats'})`,
        unavailable: (count: number) =>
          `✗ Unavailable (${count} ${count === 1 ? 'seat' : 'seats'})`,
        recommendation: 'Our Recommendation',
        subtotal: 'Subtotal',
      },
    },
  },

  // Status change notifications
  statusChange: {
    justReserved: (seatNumber: string, timeLeft: string) =>
      `Seat ${seatNumber} was just reserved by another customer. It may become available again in ${timeLeft} if not purchased.`,
    justBooked: (seatNumber: string) =>
      `Seat ${seatNumber} was just purchased and is no longer available.`,
    nowAvailable: (seatNumber: string) =>
      `Seat ${seatNumber} is now available!`,
  },

  // Helper tooltips
  tooltips: {
    availableSeat: (seatNumber: string, price: number) =>
      `${seatNumber} - $${price.toFixed(2)}\\nClick to select this seat`,
    reservedSeat: (seatNumber: string, price: number, timeLeft: string) =>
      `${seatNumber} - $${price.toFixed(2)}\\nReserved by another customer\\nMay become available in ${timeLeft}`,
    bookedSeat: (seatNumber: string, price: number) =>
      `${seatNumber} - $${price.toFixed(2)}\\nThis seat has been purchased`,
    blockedSeat: (seatNumber: string) =>
      `${seatNumber}\\nThis seat is not available for booking`,
    selectedSeat: (seatNumber: string, price: number) =>
      `${seatNumber} - $${price.toFixed(2)}\\nClick to deselect`,
  },

  // Accessibility labels
  a11y: {
    seatMapRegion: 'Interactive seat map',
    seatButton: (seatNumber: string, status: string) =>
      `Seat ${seatNumber}, ${status}`,
    reservationTimer: 'Reservation time remaining',
    statusChangeAlert: 'Seat availability has changed',
  },
};

/**
 * Payment Protection and Reassurance Copy
 * 
 * Reduces payment anxiety by explaining idempotency protection and retry safety.
 */
export const PaymentProtectionCopy = {
  // Badge text
  badge: {
    text: 'Payment Protected',
    icon: '🛡️',
  },

  // Modal content explaining protection
  modal: {
    title: 'Your Payment is Protected',
    subtitle: 'Safe to retry without worry',
    
    sections: {
      // Idempotency protection explanation
      noDoubleCharge: {
        heading: 'No Double Charges',
        message: 'If your payment request is submitted multiple times (slow network, accidental retry, etc.), you\'ll only be charged once. Our system remembers your request and prevents duplicate charges.',
        icon: '✓',
      },

      // How it works
      howItWorks: {
        heading: 'How It Works',
        message: 'Each payment attempt gets a unique "fingerprint" that lasts 24 hours. If we see the same fingerprint again, we return your original booking instead of creating a new charge.',
        icon: 'ℹ️',
      },

      // Safe to retry
      safeRetry: {
        heading: 'Safe to Retry',
        message: 'If your payment fails or times out, you can safely click "Confirm Payment" again. You won\'t be double-charged, and your seat reservation remains secure.',
        icon: '🔄',
      },
    },

    cta: 'Got it',
  },

  // Slow network detection messages
  slowNetwork: {
    detecting: 'Slow connection detected...',
    reassurance: {
      heading: 'Taking longer than usual',
      message: 'Your payment is still processing securely. Please don\'t close this page or refresh. If it times out, you can safely retry without being charged twice.',
      icon: '⏳',
    },
    safeToWait: 'Safe to wait — you won\'t be double-charged',
  },

  // Idempotency replay event (when backend returns cached response)
  replay: {
    notification: {
      heading: 'Booking Already Confirmed',
      message: (bookingReference: string) => 
        `This payment was already processed successfully (${bookingReference}). No duplicate charge was made.`,
      icon: '✓',
      type: 'success',
    },
    short: 'Duplicate prevented — original booking returned',
  },

  // Payment retry states
  retry: {
    timeout: {
      heading: 'Payment Timed Out',
      message: 'Your payment request didn\'t complete in time, but no charge was made. You can safely retry with the same payment method.',
      cta: 'Retry Payment',
      icon: '⏱️',
    },
    
    declined: {
      heading: 'Payment Declined',
      message: 'Your payment was declined by your bank. No charge was made. You can try again with a different card or payment method.',
      cta: 'Try Again',
      icon: '💳',
    },
    
    networkError: {
      heading: 'Connection Issue',
      message: 'We couldn\'t connect to the payment processor. Your card was not charged. Please check your connection and retry.',
      cta: 'Retry Payment',
      icon: '📡',
    },

    safeRetryNote: '🛡️ Safe to retry — duplicate charges are automatically prevented',
  },

  // Processing states
  processing: {
    initial: 'Processing payment...',
    verifying: 'Verifying payment...',
    confirming: 'Confirming booking...',
    slow: 'This is taking longer than usual, but your payment is secure...',
  },

  // Tooltips
  tooltips: {
    badgeHover: 'Your payment is protected from duplicate charges. Click to learn more.',
    replayEvent: 'This booking was already processed. No duplicate charge was made.',
    slowNetworkInfo: 'Slow connection detected. Your payment is still secure and won\'t be charged twice if you wait or retry.',
  },

  // Analytics event names (for consistency)
  analyticsEvents: {
    badgeClicked: 'payment_protection_badge_clicked',
    modalOpened: 'payment_protection_modal_opened',
    slowNetworkDetected: 'slow_network_detected',
    replayEventSurfaced: 'idempotency_replay_surfaced',
    retryAttempted: 'payment_retry_attempted',
    timeoutOccurred: 'payment_timeout_occurred',
  },
};

/**
 * Format time in a human-readable way for display
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return '0s';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  
  return `${secs}s`;
}
