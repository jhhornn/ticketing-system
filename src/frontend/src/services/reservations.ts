import api from './api';

export interface SeatReservation {
  seatId: number;
  version: number;
}

export interface CreateReservationRequest {
  seats: SeatReservation[];
  sessionId?: string;
}

export interface ReservationResponse {
  id: number;
  reservedSeatIds: number[];
  expiresAt: Date;
  expiresInSeconds: number;
  failedSeats?: Array<{ seatId: number; reason: string }>;
}

export interface CreateReservationData {
  eventId: number;
  seatNumbers: string[];
  userId: string;
}

export interface Reservation {
  id: number;
  eventId: number;
  seatNumber: string;
  userId: string;
  expiresAt: string;
  status: string;
  createdAt: string;
}

export const ReservationsService = {
  /**
   * Reserve seats with optimistic locking (NEW)
   * Sends seat IDs with their version numbers for conflict detection
   * 
   * @returns Partial success: reservedSeatIds + optional failedSeats
   */
  createReservation: async (
    eventId: number,
    data: CreateReservationRequest
  ): Promise<ReservationResponse> => {
    const response = await api.post<{ data: ReservationResponse }>(
      `/events/${eventId}/reservations`,
      data
    );
    
    // Convert expiresAt string to Date
    const result = response.data.data;
    return {
      ...result,
      expiresAt: new Date(result.expiresAt),
    };
  },

  // Legacy method
  create: async (data: CreateReservationData) => {
    const response = await api.post<{ data: Reservation[] }>('/reservations', data);
    return response.data.data;
  },

  cancel: async (id: number, userId: string) => {
    const response = await api.delete<{ data: unknown }>(`/reservations/${id}`, {
      data: { userId }
    });
    return response.data.data;
  },

  getUserReservations: async (userId: string) => {
    const response = await api.get<{ data: Reservation[] }>(`/reservations/user/${userId}`);
    return response.data.data;
  }
};
