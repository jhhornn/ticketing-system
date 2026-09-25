import api from './api';

export interface PaymentVerification {
  success: boolean;
  paymentId: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  amount: number;
  currency: string;
  transactionReference?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

export const PaymentsService = {
  /**
   * Verify a Paystack payment by its transaction reference.
   * Call this after Paystack redirects the user back to the app.
   */
  verifyPayment: async (reference: string): Promise<PaymentVerification> => {
    const response = await api.get<{ data: PaymentVerification }>(
      `/payments/verify/${encodeURIComponent(reference)}`
    );
    return response.data.data ?? response.data;
  },
};
