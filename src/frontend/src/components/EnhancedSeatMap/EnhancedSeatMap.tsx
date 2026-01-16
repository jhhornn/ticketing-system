import React, { useEffect, useState, useCallback } from 'react';
import { SeatsService } from '../../services/seats';
import { useSeatSelection, type SeatMapData, type Seat } from '../../hooks/useSeatSelection';
import { useReservationTimer } from '../../hooks/useReservationTimer';
import { useCheckoutStateMachine } from '../../hooks/useCheckoutStateMachine';
import { ReservationsService } from '../../services/reservations';
import { useToast } from '../../hooks/useToast';
import './EnhancedSeatMap.css';

interface ReservationData {
  reservedSeatIds: number[];
  expiresAt: Date;
  expiresInSeconds: number;
  failedSeats?: Array<{ seatId: number; reason: string }>;
}

interface EnhancedSeatMapProps {
  eventId: number;
  onReservationComplete?: (reservationData: ReservationData) => void;
}

interface ErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
}

/**
 * EnhancedSeatMap Component
 * 
 * Complete seat selection and reservation flow with:
 * - Real-time seat status display
 * - Optimistic locking with version tracking
 * - Partial success handling
 * - Reservation timer
 * - Error recovery
 * 
 * **Flow:**
 * 1. Load seat map (grouped by sections)
 * 2. User selects available seats → local state
 * 3. Click "Reserve" → POST with seat IDs + versions
 * 4. Handle response: { reservedSeatIds, failedSeats }
 * 5. Start timer, proceed to checkout
 * 
 * **Real-time Updates:**
 * - Poll GET /events/:id/seats every 10s
 * - Update seat statuses & versions
 * - If selected seat becomes unavailable → remove from selection + toast
 */
export const EnhancedSeatMap: React.FC<EnhancedSeatMapProps> = ({
  eventId,
  onReservationComplete,
}) => {
  const [seatMap, setSeatMap] = useState<SeatMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollInterval, setPollInterval] = useState<number | null>(null);

  const { showToast } = useToast();
  const {
    totalPrice,
    seatCount,
    toggleSeat,
    clearSelection,
    isSeatSelected,
    getReservationPayload,
  } = useSeatSelection(10);

  const checkoutMachine = useCheckoutStateMachine();
  const {
    state,
    startReservation,
    reservationSuccess,
    reservationFailed,
    reset,
    reservationData,
    error: checkoutError,
    canRetry,
  } = checkoutMachine;

  const {
    timeRemainingFormatted,
    isWarning,
    progressPercentage,
  } = useReservationTimer({
    expiresAt: reservationData?.expiresAt || null,
    onExpire: () => {
      showToast('error', '⏱️ Your reservation expired. Please select seats again.');
      reset();
      clearSelection();
      loadSeatMap(); // Refresh to show released seats
    },
    warningThresholdSeconds: 60,
  });

  // Load seat map
  const loadSeatMap = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await SeatsService.getSeatMapForEvent(eventId);
      setSeatMap(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load seat map';
      setError(errorMessage);
      showToast('error', '📡 Failed to load seat map. Retrying...');
    } finally {
      setLoading(false);
    }
  }, [eventId, showToast]);

  // Initial load
  useEffect(() => {
    loadSeatMap();
  }, [loadSeatMap]);

  // Polling for real-time updates (every 10s)
  useEffect(() => {
    const interval = setInterval(() => {
      loadSeatMap();
    }, 10000);

    setPollInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loadSeatMap]);

  // Stop polling when reservation is confirmed
  useEffect(() => {
    if (state === 'RESERVED' && pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }
  }, [state, pollInterval]);

  // Handle seat selection
  const handleSeatClick = (seat: Seat, sectionName: string) => {
    if (seat.status !== 'AVAILABLE') return;
    if (state !== 'IDLE') return; // Can't select during reservation

    toggleSeat(seat, sectionName);
  };

  // Handle reservation submission
  const handleReserve = async () => {
    if (seatCount === 0) {
      showToast('warning', '⚠️ Please select at least one seat.');
      return;
    }

    startReservation();

    try {
      const payload = getReservationPayload();
      const sessionId = `session-${Date.now()}`;

      const result = await ReservationsService.createReservation(eventId, {
        seats: payload,
        sessionId,
      });

      // Handle partial success
      if (result.failedSeats && result.failedSeats.length > 0) {
        const staleVersions = result.failedSeats.filter(f =>
          f.reason.includes('stale version')
        );

        if (staleVersions.length > 0) {
          showToast(
            'warning',
            `🔄 ${staleVersions.length} seat(s) were just taken. Refreshing seat map...`,
            6000
          );
          loadSeatMap(); // Refresh to get new versions
        } else {
          showToast(
            'warning',
            `⚠️ Reserved ${result.reservedSeatIds.length} seats. ${result.failedSeats.length} unavailable.`,
            0
          );
        }
      }

      if (result.reservedSeatIds.length > 0) {
        showToast('success', `✅ Reserved ${result.reservedSeatIds.length} seats!`);
        reservationSuccess(result);
        
        if (onReservationComplete) {
          onReservationComplete(result);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response)
          ? String((err as ErrorResponse).response?.data?.message || 'Failed to reserve seats')
          : 'Failed to reserve seats';
      showToast('error', `❌ ${errorMessage}`);
      reservationFailed({
        message: errorMessage,
        retryable: true,
      });
    }
  };

  // Render seat with appropriate styling
  const renderSeat = (seat: Seat, sectionName: string) => {
    const selected = isSeatSelected(seat.id);
    const disabled = seat.status !== 'AVAILABLE' || state !== 'IDLE';

    let className = 'seat';
    if (selected) className += ' seat-selected';
    if (seat.status === 'RESERVED') className += ' seat-reserved';
    if (seat.status === 'BOOKED') className += ' seat-booked';
    if (seat.status === 'BLOCKED') className += ' seat-blocked';
    if (disabled && !selected) className += ' seat-disabled';

    return (
      <button
        key={seat.id}
        className={className}
        onClick={() => handleSeatClick(seat, sectionName)}
        disabled={disabled}
        title={`${seat.seatNumber} - $${seat.price} (${seat.status})`}
      >
        {seat.seatNumber}
      </button>
    );
  };

  if (loading && !seatMap) {
    return <div className="loading">Loading seat map...</div>;
  }

  if (error && !seatMap) {
    return (
      <div className="error">
        <p>{error}</p>
        <button onClick={loadSeatMap}>Retry</button>
      </div>
    );
  }

  if (!seatMap) {
    return <div className="error">No seat data available</div>;
  }

  return (
    <div className="enhanced-seat-map">
      {/* Header */}
      <div className="seat-map-header">
        <h2>Select Your Seats</h2>
        <div className="availability-info">
          <span>{seatMap.availableSeats} / {seatMap.totalSeats} available</span>
        </div>
      </div>

      {/* Reservation Timer (if active) */}
      {state === 'RESERVED' && (
        <div className={`reservation-timer ${isWarning ? 'warning' : ''}`}>
          <div className="timer-content">
            <span className="timer-icon">⏱️</span>
            <span className="timer-text">Time Remaining: {timeRemainingFormatted}</span>
          </div>
          <div className="timer-progress">
            <div
              className="timer-progress-bar"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="seat-legend">
        <div className="legend-item">
          <span className="legend-icon seat-available"></span>
          Available
        </div>
        <div className="legend-item">
          <span className="legend-icon seat-selected"></span>
          Selected
        </div>
        <div className="legend-item">
          <span className="legend-icon seat-reserved"></span>
          Reserved
        </div>
        <div className="legend-item">
          <span className="legend-icon seat-booked"></span>
          Booked
        </div>
      </div>

      {/* Sections */}
      <div className="sections-container">
        {seatMap.sections.map((section) => (
          <div key={section.name} className="section">
            <div className="section-header">
              <h3>{section.name}</h3>
              <span className="section-info">
                {section.availableSeats} available | ${section.minPrice} - ${section.maxPrice}
              </span>
            </div>
            <div className="seats-grid">
              {section.seats.map((seat) => renderSeat(seat, section.name))}
            </div>
          </div>
        ))}
      </div>

      {/* Selection Summary */}
      {seatCount > 0 && state === 'IDLE' && (
        <div className="selection-summary">
          <div className="summary-content">
            <div className="summary-info">
              <span className="seat-count">{seatCount} seat(s) selected</span>
              <span className="total-price">${totalPrice.toFixed(2)}</span>
            </div>
            <div className="summary-actions">
              <button className="btn-clear" onClick={clearSelection}>
                Clear
              </button>
              <button
                className="btn-reserve"
                onClick={handleReserve}
                disabled={['RESERVING', 'RESERVED'].includes(state)}
              >
                {['RESERVING', 'RESERVED'].includes(state) ? 'Reserving...' : 'Reserve Seats'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {checkoutError && (
        <div className="checkout-error">
          <p>{checkoutError.message}</p>
          {canRetry && (
            <button className="btn-retry" onClick={handleReserve}>
              Retry
            </button>
          )}
        </div>
      )}

      {/* Success State */}
      {state === 'RESERVED' && (
        <div className="reservation-success">
          <p>✅ Seats reserved! Proceed to checkout.</p>
          <button className="btn-checkout">
            Proceed to Checkout
          </button>
        </div>
      )}
    </div>
  );
};
