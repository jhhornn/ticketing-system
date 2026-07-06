/**
 * Seat Status Utilities
 * 
 * Provides human-readable explanations for seat status changes
 * and availability issues to improve user trust and transparency.
 */

export interface SeatStatusExplanation {
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
}

/**
 * Calculate remaining time for a reserved seat
 */
export function calculateRemainingTime(reservedUntil: Date | null): number | null {
  if (!reservedUntil) return null;
  
  const now = new Date();
  const remaining = reservedUntil.getTime() - now.getTime();
  
  return remaining > 0 ? Math.floor(remaining / 1000) : 0;
}

/**
 * Format remaining time in a human-readable way
 */
export function formatRemainingTime(seconds: number): string {
  if (seconds <= 0) return 'expired';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  
  return `${remainingSeconds}s`;
}

/**
 * Get explanation for a reserved seat
 */
export function getReservedSeatExplanation(reservedUntil: Date | null): SeatStatusExplanation {
  const remainingSeconds = calculateRemainingTime(reservedUntil);
  
  if (remainingSeconds === null) {
    return {
      title: 'Seat Reserved',
      message: 'This seat is currently reserved by another customer.',
      severity: 'info',
    };
  }
  
  if (remainingSeconds <= 0) {
    return {
      title: 'Reservation Expiring',
      message: 'This seat reservation is about to expire and will become available soon.',
      severity: 'info',
    };
  }
  
  const timeFormatted = formatRemainingTime(remainingSeconds);
  
  return {
    title: 'Seat Temporarily Unavailable',
    message: `Another customer is holding this seat. It will become available if not purchased within ${timeFormatted}.`,
    severity: 'warning',
  };
}

/**
 * Get explanation for a booked seat
 */
export function getBookedSeatExplanation(): SeatStatusExplanation {
  return {
    title: 'Seat Unavailable',
    message: 'This seat has been purchased and is no longer available.',
    severity: 'error',
  };
}

/**
 * Get explanation for a version mismatch error
 */
export function getVersionMismatchExplanation(seatNumber: string): SeatStatusExplanation {
  return {
    title: 'Seat Just Taken',
    message: `Seat ${seatNumber} was just reserved by another customer. The seat map has been refreshed with current availability.`,
    severity: 'warning',
  };
}

/**
 * Get explanation for seat becoming unavailable during selection
 */
export function getSeatUnavailableExplanation(
  seatNumber: string,
  newStatus: string,
  reservedUntil: Date | null = null
): SeatStatusExplanation {
  if (newStatus === 'RESERVED') {
    const remainingSeconds = calculateRemainingTime(reservedUntil);
    const timeFormatted = remainingSeconds ? formatRemainingTime(remainingSeconds) : 'shortly';
    
    return {
      title: 'Seat Just Reserved',
      message: `Seat ${seatNumber} was just reserved by another customer. It may become available again in ${timeFormatted} if not purchased.`,
      severity: 'warning',
    };
  }
  
  if (newStatus === 'BOOKED') {
    return {
      title: 'Seat Sold',
      message: `Seat ${seatNumber} was just purchased by another customer and is no longer available.`,
      severity: 'error',
    };
  }
  
  return {
    title: 'Seat Unavailable',
    message: `Seat ${seatNumber} is no longer available for selection.`,
    severity: 'warning',
  };
}

/**
 * Get explanation based on seat status
 */
export function getSeatStatusExplanation(
  status: string,
  reservedUntil: Date | null = null
): SeatStatusExplanation | null {
  switch (status) {
    case 'RESERVED':
      return getReservedSeatExplanation(reservedUntil);
    case 'BOOKED':
      return getBookedSeatExplanation();
    case 'BLOCKED':
      return {
        title: 'Seat Blocked',
        message: 'This seat is not available for booking.',
        severity: 'info',
      };
    case 'AVAILABLE':
      return null;
    default:
      return null;
  }
}

/**
 * Generate user-friendly error message for reservation failures
 */
export function getReservationFailureMessage(
  failedSeats: Array<{ seatId: number; reason: string }>,
  seatNumberMap: Map<number, string>
): string {
  if (failedSeats.length === 0) return '';
  
  const versionMismatches = failedSeats.filter(f =>
    f.reason.toLowerCase().includes('version') || 
    f.reason.toLowerCase().includes('conflict')
  );
  
  const unavailable = failedSeats.filter(f =>
    !f.reason.toLowerCase().includes('version') && 
    !f.reason.toLowerCase().includes('conflict')
  );
  
  const messages: string[] = [];
  
  if (versionMismatches.length > 0) {
    const seatNumbers = versionMismatches
      .map(f => seatNumberMap.get(f.seatId) || `#${f.seatId}`)
      .join(', ');
    
    messages.push(
      `${versionMismatches.length === 1 ? 'Seat' : 'Seats'} ${seatNumbers} ${versionMismatches.length === 1 ? 'was' : 'were'} just reserved by another customer.`
    );
  }
  
  if (unavailable.length > 0) {
    const seatNumbers = unavailable
      .map(f => seatNumberMap.get(f.seatId) || `#${f.seatId}`)
      .join(', ');
    
    messages.push(
      `${unavailable.length === 1 ? 'Seat' : 'Seats'} ${seatNumbers} ${unavailable.length === 1 ? 'is' : 'are'} no longer available.`
    );
  }
  
  return messages.join(' ');
}
