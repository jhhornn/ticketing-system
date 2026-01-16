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

    // 95% success rate for simulation
    const success = Math.random() > 0.05;
    const paymentId = `mock_${uuidv4()}`;

    const response: PaymentResponse = {
      success,
      paymentId,
      status: success ? PaymentStatus.SUCCESS : PaymentStatus.FAILED,
      amount: request.amount,
      currency: request.currency || 'USD',
      transactionReference: `TXN_${Date.now()}`,
      errorMessage: success ? undefined : 'Mock payment failed for testing',
      metadata: request.metadata,
    };

    // Store for verification
    this.payments.set(paymentId, response);

    return response;
  }

  async verifyPayment(paymentId: string): Promise<PaymentResponse> {
    this.logger.log(`Verifying mock payment: ${paymentId}`);

    const payment = this.payments.get(paymentId);

    if (!payment) {
      return {
        success: false,
        paymentId,
        status: PaymentStatus.FAILED,
        amount: 0,
        currency: 'USD',
        errorMessage: 'Payment not found',
      };
    }

    return payment;
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
