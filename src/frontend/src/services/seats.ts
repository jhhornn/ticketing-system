import api from './api';

export const SeatStatus = {
  AVAILABLE: 'AVAILABLE',
  RESERVED: 'RESERVED',
  BOOKED: 'BOOKED',
  BLOCKED: 'BLOCKED',
} as const;

export type SeatStatus = typeof SeatStatus[keyof typeof SeatStatus];

export interface Seat {
  id: number;
  eventId: number;
  seatNumber: string;
  section: string | null;
  rowNumber: string | null;
  seatType: string;
  status: SeatStatus;
  price: number;
  version: number;
  reservedUntil: Date | null;
  createdAt: string;
}

export interface Section {
  name: string;
  seats: Seat[];
  totalSeats: number;
  availableSeats: number;
  minPrice: string;
  maxPrice: string;
}

export interface SeatMapResponse {
  eventId: number;
  sections: Section[];
  totalSeats: number;
  availableSeats: number;
  timestamp: Date;
}

export const SeatsService = {
  /**
   * Get optimized seat map grouped by sections
   * Includes version numbers for optimistic locking
   */
  getSeatMapForEvent: async (eventId: number): Promise<SeatMapResponse> => {
    const response = await api.get<{ data: SeatMapResponse }>(
      `/events/${eventId}/seats`
    );
    
    const data = response.data.data;
    
    // Convert timestamp and reservedUntil to Date objects
    return {
      ...data,
      timestamp: new Date(data.timestamp),
      sections: data.sections.map(section => ({
        ...section,
        seats: section.seats.map(seat => ({
          ...seat,
          reservedUntil: seat.reservedUntil ? new Date(seat.reservedUntil) : null,
        })),
      })),
    };
  },
  getEventSeats: async (eventId: number) => {
    const response = await api.get<{ data: Seat[] }>(`/events/${eventId}/seats`);
    return response.data.data;
  }
};
