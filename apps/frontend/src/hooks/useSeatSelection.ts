import { useState, useCallback } from 'react';

export interface Seat {
  id: number;
  seatNumber: string;
  rowNumber: string | null;
  seatType: string;
  price: number;
  status: 'AVAILABLE' | 'RESERVED' | 'BOOKED' | 'BLOCKED';
  version: number;
  reservedUntil: Date | null;
}

export interface Section {
  name: string;
  seats: Seat[];
  totalSeats: number;
  availableSeats: number;
  minPrice: string;
  maxPrice: string;
}

export interface SeatMapData {
  eventId: number;
  sections: Section[];
  totalSeats: number;
  availableSeats: number;
  timestamp: Date;
}

interface SelectedSeatInfo {
  id: number;
  seatNumber: string;
  price: number;
  version: number;
  section: string;
}

interface UseSeatSelectionReturn {
  // State
  selectedSeats: SelectedSeatInfo[];
  totalPrice: number;
  seatCount: number;
  
  // Actions
  toggleSeat: (seat: Seat, section: string) => void;
  clearSelection: () => void;
  isSeatSelected: (seatId: number) => boolean;
  
  // For API
  getReservationPayload: () => Array<{ seatId: number; version: number }>;
}

/**
 * useSeatSelection Hook
 * 
 * Manages local seat selection state before reservation is made.
 * Tracks selected seats with their versions for optimistic locking.
 * 
 * **States:**
 * - AVAILABLE (green): Can be selected
 * - RESERVED (yellow): Temporarily held, show countdown if yours
 * - BOOKED (gray): Permanently unavailable
 * - BLOCKED (gray): Administratively blocked
 * 
 * **User Flow:**
 * 1. User clicks available seats → added to selection
 * 2. UI shows total price and count
 * 3. Click "Reserve" → sends { seatId, version }[] to backend
 * 4. Backend validates versions using optimistic locking
 * 5. Returns: { reservedSeatIds, failedSeats }
 * 
 * **Edge Cases:**
 * - If seat becomes unavailable (status change), disable selection
 * - Version mismatch on reserve → backend returns failure → UI shows toast
 * - Seat was just reserved → refresh seat map, show error
 * 
 * @param maxSeats - Maximum number of seats user can select (default: 10)
 */
export const useSeatSelection = (maxSeats: number = 10): UseSeatSelectionReturn => {
  const [selectedSeats, setSelectedSeats] = useState<SelectedSeatInfo[]>([]);

  const toggleSeat = useCallback(
    (seat: Seat, section: string) => {
      setSelectedSeats((prev) => {
        const isSelected = prev.some((s) => s.id === seat.id);

        if (isSelected) {
          // Remove seat
          return prev.filter((s) => s.id !== seat.id);
        } else {
          // Add seat if limit not reached
          if (prev.length >= maxSeats) {
            // Could trigger a toast notification here
            console.warn(`Maximum ${maxSeats} seats can be selected`);
            return prev;
          }

          return [
            ...prev,
            {
              id: seat.id,
              seatNumber: seat.seatNumber,
              price: seat.price,
              version: seat.version,
              section,
            },
          ];
        }
      });
    },
    [maxSeats]
  );

  const clearSelection = useCallback(() => {
    setSelectedSeats([]);
  }, []);

  const isSeatSelected = useCallback(
    (seatId: number): boolean => {
      return selectedSeats.some((s) => s.id === seatId);
    },
    [selectedSeats]
  );

  const totalPrice = selectedSeats.reduce(
    (sum, seat) => sum + seat.price,
    0
  );

  const getReservationPayload = useCallback(() => {
    return selectedSeats.map((seat) => ({
      seatId: seat.id,
      version: seat.version,
    }));
  }, [selectedSeats]);

  return {
    selectedSeats,
    totalPrice,
    seatCount: selectedSeats.length,
    toggleSeat,
    clearSelection,
    isSeatSelected,
    getReservationPayload,
  };
};
