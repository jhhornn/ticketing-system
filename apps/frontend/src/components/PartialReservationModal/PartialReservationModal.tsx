import React, { useMemo } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Users, DollarSign, Ticket, ArrowRight, RotateCcw } from 'lucide-react';

interface FailedSeat {
  seatId: number;
  reason: string;
}

interface PartialReservationModalProps {
  /** Number of seats successfully reserved */
  reservedCount: number;
  /** Array of failed seat details */
  failedSeats: FailedSeat[];
  /** Price per seat */
  pricePerSeat: number;
  /** Original number of seats attempted */
  originalCount: number;
  /** Seat numbers that were reserved (for display) */
  reservedSeatNumbers: string[];
  /** Seat numbers that failed (for display) */
  failedSeatNumbers: string[];
  /** Callback when user proceeds with partial reservation */
  onProceed: () => void;
  /** Callback when user wants to try selecting more seats */
  onSelectMore: () => void;
  /** Callback when user cancels everything */
  onCancel: () => void;
  /** Whether modal is open */
  isOpen: boolean;
}

/**
 * PartialReservationModal
 * 
 * Decision-oriented modal for partial reservation scenarios.
 * Provides clear recommendations, explicit trade-offs, and context.
 * 
 * **UX Goals:**
 * 1. Help users make informed decisions about partial success
 * 2. Show trade-offs explicitly (price, seating split)
 * 3. Explain why partial success happened
 * 4. Recommend best action based on context
 * 
 * **Decision Architecture:**
 * - High success rate (>66%) → Recommend "Proceed"
 * - Medium success rate (33-66%) → Neutral presentation
 * - Low success rate (<33%) → Recommend "Try again"
 * 
 * **Usage:**
 * ```tsx
 * <PartialReservationModal
 *   reservedCount={2}
 *   failedSeats={[{ seatId: 3, reason: 'Seat is reserved' }]}
 *   originalCount={3}
 *   pricePerSeat={50}
 *   reservedSeatNumbers={['A1', 'A2']}
 *   failedSeatNumbers={['A3']}
 *   onProceed={() => navigate('/checkout')}
 *   onSelectMore={() => setShowSeatMap(true)}
 *   onCancel={() => resetReservation()}
 *   isOpen={true}
 * />
 * ```
 */
export const PartialReservationModal: React.FC<PartialReservationModalProps> = ({
  reservedCount,
  failedSeats,
  pricePerSeat,
  originalCount,
  reservedSeatNumbers,
  failedSeatNumbers,
  onProceed,
  onSelectMore,
  onCancel,
  isOpen,
}) => {
  // Calculate decision metrics
  const decision = useMemo(() => {
    const successRate = reservedCount / originalCount;
    const totalReservedPrice = reservedCount * pricePerSeat;
    const lostValue = failedSeats.length * pricePerSeat;
    
    // Categorize failure reasons
    const staleVersions = failedSeats.filter(f => f.reason.includes('stale version'));
    const alreadyReserved = failedSeats.filter(f => f.reason.includes('reserved'));
    const alreadyBooked = failedSeats.filter(f => f.reason.includes('booked'));
    const locked = failedSeats.filter(f => f.reason.includes('locked'));
    
    // Determine primary reason
    let primaryReason = 'unavailable';
    let explanation = 'The seats you selected were taken by other customers while you were choosing.';
    
    if (staleVersions.length > 0) {
      primaryReason = 'just_taken';
      explanation = staleVersions.length === 1
        ? 'This seat was reserved by another customer just moments ago while you were selecting.'
        : `These ${staleVersions.length} seats were reserved by other customers just moments ago.`;
    } else if (alreadyBooked.length > 0) {
      primaryReason = 'sold_out';
      explanation = alreadyBooked.length === 1
        ? 'This seat was just purchased and is no longer available.'
        : `These ${alreadyBooked.length} seats were just purchased and are no longer available.`;
    } else if (alreadyReserved.length > 0) {
      primaryReason = 'reserved';
      explanation = alreadyReserved.length === 1
        ? 'This seat is temporarily reserved by another customer (may become available if not purchased).'
        : `These ${alreadyReserved.length} seats are temporarily reserved by other customers.`;
    } else if (locked.length > 0) {
      primaryReason = 'timing';
      explanation = 'These seats were being processed by another request at the same time. They may be available now.';
    }
    
    // Determine recommendation
    let recommendation: 'proceed' | 'neutral' | 'try_again';
    let recommendationStrength: 'strong' | 'moderate' | 'weak';
    
    if (successRate >= 0.67) {
      recommendation = 'proceed';
      recommendationStrength = successRate >= 0.8 ? 'strong' : 'moderate';
    } else if (successRate >= 0.33) {
      recommendation = 'neutral';
      recommendationStrength = 'moderate';
    } else {
      recommendation = 'try_again';
      recommendationStrength = 'strong';
    }
    
    return {
      successRate,
      totalReservedPrice,
      lostValue,
      primaryReason,
      explanation,
      recommendation,
      recommendationStrength,
      staleVersions,
      alreadyReserved,
      alreadyBooked,
    };
  }, [reservedCount, failedSeats, originalCount, pricePerSeat]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="partial-reservation-title"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-8 h-8" />
            <h2 id="partial-reservation-title" className="text-2xl font-bold">
              Partial Reservation Success
            </h2>
          </div>
          <p className="text-amber-50 text-sm">
            We reserved {reservedCount} of {originalCount} seats you selected
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Why this happened */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <span>ℹ️</span>
              Why did this happen?
            </h3>
            <p className="text-blue-800 text-sm leading-relaxed">
              {decision.explanation}
            </p>
            <p className="text-blue-700 text-xs mt-2">
              Popular events fill up quickly. Seats are only held once you click "Reserve."
            </p>
          </div>

          {/* Trade-offs Summary */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Success Rate */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Ticket className="w-5 h-5 text-slate-600" />
                <span className="text-xs font-medium text-slate-500 uppercase">Success Rate</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {Math.round(decision.successRate * 100)}%
              </div>
              <div className="text-xs text-slate-600 mt-1">
                {reservedCount} of {originalCount} seats
              </div>
            </div>

            {/* Total Price */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-slate-600" />
                <span className="text-xs font-medium text-slate-500 uppercase">Total Price</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                ${decision.totalReservedPrice.toFixed(2)}
              </div>
              <div className="text-xs text-slate-600 mt-1">
                ${decision.lostValue.toFixed(2)} lost
              </div>
            </div>

            {/* Seating Split */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-slate-600" />
                <span className="text-xs font-medium text-slate-500 uppercase">Group Impact</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {failedSeats.length === 1 ? '1 seat' : `${failedSeats.length} seats`}
              </div>
              <div className="text-xs text-slate-600 mt-1">
                {failedSeats.length === 1 ? 'Person may need to sit separately' : 'Group may be split up'}
              </div>
            </div>
          </div>

          {/* Reserved Seats (Success) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-green-900">
                ✓ Reserved ({reservedCount} {reservedCount === 1 ? 'seat' : 'seats'})
              </h3>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex flex-wrap gap-2">
                {reservedSeatNumbers.map((seat, index) => (
                  <div
                    key={index}
                    className="px-3 py-2 bg-white border-2 border-green-500 rounded-lg font-mono text-sm font-semibold text-green-700"
                  >
                    {seat}
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-green-200 flex justify-between items-center">
                <span className="text-sm text-green-700">Subtotal</span>
                <span className="text-lg font-bold text-green-900">
                  ${decision.totalReservedPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Failed Seats */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-red-900">
                ✗ Unavailable ({failedSeats.length} {failedSeats.length === 1 ? 'seat' : 'seats'})
              </h3>
            </div>
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="space-y-2">
                {failedSeatNumbers.map((seat, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="font-mono font-semibold text-red-700">{seat}</span>
                    <span className="text-red-600 text-xs">
                      {failedSeats[index]?.reason || 'Unavailable'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Decision Guidance */}
          <div className={`
            rounded-xl p-5 border-2
            ${decision.recommendation === 'proceed' 
              ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300' 
              : decision.recommendation === 'try_again'
              ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300'
              : 'bg-gradient-to-br from-slate-50 to-gray-50 border-slate-300'
            }
          `}>
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              <span>💡</span>
              Our Recommendation
            </h3>
            
            {decision.recommendation === 'proceed' && (
              <div className="space-y-2">
                <p className="text-slate-700 leading-relaxed">
                  <strong className="text-green-700">Proceed with {reservedCount} seats.</strong> You got {Math.round(decision.successRate * 100)}% 
                  of what you wanted. The missing {failedSeats.length === 1 ? 'seat was' : 'seats were'} likely taken 
                  moments ago, and similar seats may not be available.
                </p>
                <ul className="text-sm text-slate-600 space-y-1 ml-4">
                  <li>✓ You've secured {reservedCount} confirmed {reservedCount === 1 ? 'seat' : 'seats'}</li>
                  <li>✓ Seats are held for {Math.floor(10)} minutes</li>
                  {failedSeats.length === 1 && (
                    <li>⚠️ 1 person may need alternative seating</li>
                  )}
                </ul>
              </div>
            )}
            
            {decision.recommendation === 'try_again' && (
              <div className="space-y-2">
                <p className="text-slate-700 leading-relaxed">
                  <strong className="text-blue-700">Try selecting more seats together.</strong> You only got {Math.round(decision.successRate * 100)}% 
                  of what you wanted. It may be better to cancel and find {originalCount} seats together.
                </p>
                <ul className="text-sm text-slate-600 space-y-1 ml-4">
                  <li>↻ Different seats may be available now</li>
                  <li>↻ Consider alternative sections or rows</li>
                  <li>⚠️ Your current reservation will be released</li>
                </ul>
              </div>
            )}
            
            {decision.recommendation === 'neutral' && (
              <div className="space-y-2">
                <p className="text-slate-700 leading-relaxed">
                  <strong className="text-slate-700">Your choice.</strong> You got {Math.round(decision.successRate * 100)}% 
                  of what you wanted. Consider whether {reservedCount} seats work for your group, or if you need all {originalCount} together.
                </p>
                <ul className="text-sm text-slate-600 space-y-1 ml-4">
                  <li>→ Proceed if fewer seats are acceptable</li>
                  <li>→ Try again if you need everyone together</li>
                  <li>⚠️ No guarantee similar seats available</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row gap-3">
          {/* Primary action (based on recommendation) */}
          {decision.recommendation === 'proceed' ? (
            <>
              <button
                onClick={onProceed}
                className="
                  flex-1 flex items-center justify-center gap-2 
                  px-6 py-3 bg-green-600 hover:bg-green-700 
                  text-white font-semibold rounded-lg 
                  transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                "
              >
                <CheckCircle className="w-5 h-5" />
                Proceed with {reservedCount} {reservedCount === 1 ? 'Seat' : 'Seats'} (${decision.totalReservedPrice.toFixed(2)})
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onSelectMore}
                className="
                  px-6 py-3 bg-white hover:bg-slate-50 
                  text-slate-700 font-medium rounded-lg border-2 border-slate-300
                  transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2
                "
              >
                <RotateCcw className="w-4 h-4 inline mr-2" />
                Try Again
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onSelectMore}
                className="
                  flex-1 flex items-center justify-center gap-2 
                  px-6 py-3 bg-blue-600 hover:bg-blue-700 
                  text-white font-semibold rounded-lg 
                  transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                "
              >
                <RotateCcw className="w-5 h-5" />
                Select {originalCount} Seats Together
              </button>
              <button
                onClick={onProceed}
                className="
                  px-6 py-3 bg-white hover:bg-slate-50 
                  text-slate-700 font-medium rounded-lg border-2 border-slate-300
                  transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2
                "
              >
                Proceed Anyway (${decision.totalReservedPrice.toFixed(2)})
              </button>
            </>
          )}
          
          <button
            onClick={onCancel}
            className="
              px-4 py-3 bg-white hover:bg-slate-50 
              text-slate-500 text-sm rounded-lg border border-slate-300
              transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2
            "
          >
            Cancel All
          </button>
        </div>
      </div>
    </div>
  );
};
