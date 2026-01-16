import api from './api';

export const BookingStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
} as const;

export type BookingStatus = typeof BookingStatus[keyof typeof BookingStatus];

export const PaymentStatus = {
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const;

export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus];

export const PaymentMethod = {
  STRIPE: 'stripe',
  PAYSTACK: 'paystack',
  FLUTTERWAVE: 'flutterwave',
  MOCK: 'mock',
} as const;

export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];

export interface ConfirmBookingData {
  reservationId: string;
  userId: string;
  paymentMethod: PaymentMethod;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
}

export interface CreateBookingRequest {
  eventId: number;
  seatIds: number[];
  paymentMethod: PaymentMethod;
  discountCode?: string;
}

export interface Booking {
  bookingId: string;
  bookingReference: string;
  eventId: number;
  userId: string;
  totalAmount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentTransactionId?: string;
  seatNumbers: string[];
  createdAt: string;
  confirmedAt?: string;
}

export const BookingsService = {
  /**
   * Create booking with idempotency key
   * Uses Idempotency-Key header to prevent duplicate bookings
   */
  createBooking: async (
    data: CreateBookingRequest,
    idempotencyKey: string
  ): Promise<Booking> => {
    const response = await api.post<{ data: Booking }>(
      '/bookings',
      data,
      {
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      }
    );
    return response.data.data;
  },
  confirmBooking: async (data: ConfirmBookingData) => {
    const response = await api.post<{ data: Booking }>('/bookings/confirm', data);
    return response.data.data;
  },

  getByReference: async (bookingReference: string) => {
    const response = await api.get<{ data: Booking }>(`/bookings/reference/${bookingReference}`);
    return response.data.data;
  },

  getMyBookings: async (): Promise<Booking[]> => {
    const response = await api.get('/bookings/me');
    return response.data.data;
  },

  getUserBookings: async (userId: string): Promise<Booking[]> => {
    const response = await api.get(`/bookings/user/${userId}`);
    return response.data.data;
  }
};
