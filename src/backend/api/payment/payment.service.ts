import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import {
  IPaymentStrategy,
  PaymentRequest,
  PaymentResponse,
  RefundRequest,
  RefundResponse,
  PaymentMethod,
} from './strategies/payment-strategy.interface';
import { MockPaymentStrategy } from './strategies/mock-payment.strategy';
import { StripePaymentStrategy } from './strategies/stripe-payment.strategy';

/**
 * Payment service using Strategy Pattern
 * Allows switching between different payment providers
 */
@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private strategies: Map<PaymentMethod, IPaymentStrategy>;
  private defaultStrategy: PaymentMethod;

  constructor(
    private readonly mockStrategy: MockPaymentStrategy,
    private readonly stripeStrategy: StripePaymentStrategy,
  ) {
    // Register all payment strategies
    this.strategies = new Map();
    this.strategies.set(PaymentMethod.MOCK, mockStrategy);
    this.strategies.set(PaymentMethod.STRIPE, stripeStrategy);

    // Set default strategy from environment or use mock
    this.defaultStrategy =
      (process.env.DEFAULT_PAYMENT_PROVIDER as PaymentMethod) ||
      PaymentMethod.MOCK;

    this.logger.log(`Payment service initialized with default: ${this.defaultStrategy}`);
  }

  /**
   * Process a payment using the specified or default strategy
   */
  async processPayment(
    request: PaymentRequest,
    method?: PaymentMethod,
  ): Promise<PaymentResponse> {
    const strategy = this.getStrategy(method);
    this.logger.log(`Processing payment with ${method || this.defaultStrategy} strategy`);

    try {
      return await strategy.processPayment(request);
    } catch (error) {
      this.logger.error(`Payment processing failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Verify a payment status
   */
  async verifyPayment(
    paymentId: string,
    method?: PaymentMethod,
  ): Promise<PaymentResponse> {
    const strategy = this.getStrategy(method);
    return await strategy.verifyPayment(paymentId);
  }

  /**
   * Refund a payment
   */
  async refundPayment(
    request: RefundRequest,
    method?: PaymentMethod,
  ): Promise<RefundResponse> {
    const strategy = this.getStrategy(method);
    this.logger.log(`Processing refund for payment: ${request.paymentId}`);

    try {
      return await strategy.refundPayment(request);
    } catch (error) {
      this.logger.error(`Refund failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Handle webhook from payment provider
   */
  async handleWebhook(
    payload: any,
    method: PaymentMethod,
  ): Promise<void> {
    const strategy = this.getStrategy(method);

    if (strategy.handleWebhook) {
      await strategy.handleWebhook(payload);
    } else {
      this.logger.warn(`Webhook handling not implemented for ${method}`);
    }
  }

  /**
   * Register a new payment strategy dynamically
   */
  registerStrategy(method: PaymentMethod, strategy: IPaymentStrategy): void {
    this.strategies.set(method, strategy);
    this.logger.log(`Registered new payment strategy: ${method}`);
  }

  /**
   * Get strategy instance by method
   */
  private getStrategy(method?: PaymentMethod): IPaymentStrategy {
    const selectedMethod = method || this.defaultStrategy;
    const strategy = this.strategies.get(selectedMethod);

    if (!strategy) {
      throw new BadRequestException(
        `Payment method ${selectedMethod} is not supported`,
      );
    }

    return strategy;
  }

  /**
   * Get list of available payment methods
   */
  getAvailableMethods(): PaymentMethod[] {
    return Array.from(this.strategies.keys());
  }
}
