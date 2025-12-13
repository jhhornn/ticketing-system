export enum PaymentMethod {
  STRIPE = 'stripe',
  PAYSTACK = 'paystack',
  FLUTTERWAVE = 'flutterwave',
  MOCK = 'mock',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export interface PaymentRequest {
  amount: number;
  currency?: string;
  userId: string;
  metadata?: Record<string, any>;
  idempotencyKey: string;
}

export interface PaymentResponse {
  success: boolean;
  paymentId: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  transactionReference?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface RefundRequest {
  paymentId: string;
  amount?: number; // Partial refund if specified
  reason?: string;
}

export interface RefundResponse {
  success: boolean;
  refundId: string;
  amount: number;
  status: string;
  errorMessage?: string;
}

/**
 * Payment Strategy Interface
 * Implement this interface for each payment provider
 */
export interface IPaymentStrategy {
  /**
   * Process a payment
   */
  processPayment(request: PaymentRequest): Promise<PaymentResponse>;

  /**
   * Verify a payment status
   */
  verifyPayment(paymentId: string): Promise<PaymentResponse>;

  /**
   * Refund a payment
   */
  refundPayment(request: RefundRequest): Promise<RefundResponse>;

  /**
   * Handle webhook from payment provider
   */
  handleWebhook?(payload: any): Promise<void>;
}
