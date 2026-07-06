import { Injectable, Logger } from '@nestjs/common';
import {
  IPaymentStrategy,
  PaymentRequest,
  PaymentResponse,
  RefundRequest,
  RefundResponse,
  PaymentStatus,
} from './payment-strategy.interface';
import { v4 as uuidv4 } from 'uuid';

/**
 * Mock payment strategy for testing
 * Simulates payment processing without calling external APIs
 */
@Injectable()
export class MockPaymentStrategy implements IPaymentStrategy {
  private readonly logger = new Logger(MockPaymentStrategy.name);
  private readonly payments = new Map<string, PaymentResponse>();

  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    this.logger.log(
      `Processing mock payment for ${request.amount} ${request.currency || 'USD'}`,
    );

    // Simulate processing delay
    await this.sleep(500);

    const paymentId = `mock_${uuidv4()}`;

    // Check if caller wants to simulate a specific outcome
    const simulateFailure = request.metadata?.simulateFailure === true;
    const simulatePending = request.metadata?.simulatePending === true;

    let status: PaymentStatus;
    let success: boolean;
    let errorMessage: string | undefined;

    if (simulateFailure) {
      // Explicit failure for testing
      status = PaymentStatus.FAILED;
      success = false;
      errorMessage = 'Mock payment failed for testing (simulated)';
      this.logger.warn('Mock payment: Simulating FAILURE');
    } else if (simulatePending) {
      // Pending payment for testing async flows
      status = PaymentStatus.PENDING;
      success = true; // Still considered successful initiation
      this.logger.log('Mock payment: Simulating PENDING status');
    } else {
      // Default: Always succeed for MOCK payments
      status = PaymentStatus.SUCCESS;
      success = true;
      this.logger.log('Mock payment: SUCCESS');
    }

    const response: PaymentResponse = {
      success,
      paymentId,
      status,
      amount: request.amount,
      currency: request.currency || 'USD',
      transactionReference: `TXN_${Date.now()}`,
      errorMessage,
      metadata: request.metadata,
    };

    // Store for verification
    this.payments.set(paymentId, response);

    return response;
  }

  verifyPayment(paymentId: string): Promise<PaymentResponse> {
    this.logger.log(`Verifying mock payment: ${paymentId}`);

    const payment = this.payments.get(paymentId);

    if (!payment) {
      return Promise.resolve({
        success: false,
        paymentId,
        status: PaymentStatus.FAILED,
        amount: 0,
        currency: 'USD',
        errorMessage: 'Payment not found',
      });
    }

    return Promise.resolve(payment);
  }

  async refundPayment(request: RefundRequest): Promise<RefundResponse> {
    this.logger.log(`Processing mock refund for payment: ${request.paymentId}`);

    await this.sleep(300);

    const payment = this.payments.get(request.paymentId);

    if (!payment || !payment.success) {
      return {
        success: false,
        refundId: '',
        amount: 0,
        status: PaymentStatus.FAILED,
        errorMessage: 'Payment not found or already failed',
      };
    }

    const refundAmount = request.amount || payment.amount;

    const refund: RefundResponse = {
      success: true,
      refundId: `refund_${uuidv4()}`,
      amount: refundAmount,
      status: PaymentStatus.REFUNDED,
    };

    // Update payment status
    payment.status = PaymentStatus.REFUNDED;

    return refund;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
