import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
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
import { PaystackPaymentStrategy } from './strategies/paystack-payment.strategy';
import {
  DEFAULT_PAYMENT_PROVIDER,
  DEFAULT_PAYMENT_PROVIDER_ENV_KEY,
  PAYMENT_MESSAGES,
  isMockPaymentEnabled,
} from './payment.constants.js';
import { PrismaService } from '../../common/database/prisma.service.js';
import {
  type AuthRequestUser,
  isAdminUser,
} from '../auth/guards/auth-request.types.js';

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
    private readonly paystackStrategy: PaystackPaymentStrategy,
    private readonly prisma: PrismaService,
  ) {
    // Register all payment strategies
    this.strategies = new Map();
    if (isMockPaymentEnabled()) {
      this.strategies.set(PaymentMethod.MOCK, mockStrategy);
    }
    this.strategies.set(PaymentMethod.STRIPE, stripeStrategy);
    this.strategies.set(PaymentMethod.PAYSTACK, paystackStrategy);

    // Set default strategy from environment or use mock
    this.defaultStrategy =
      (process.env[DEFAULT_PAYMENT_PROVIDER_ENV_KEY] as PaymentMethod) ||
      DEFAULT_PAYMENT_PROVIDER;

    this.logger.log(
      `${PAYMENT_MESSAGES.initializedWithDefault} ${this.defaultStrategy}`,
    );
  }

  /**
   * Process a payment using the specified or default strategy
   */
  async processPayment(
    request: PaymentRequest,
    method?: PaymentMethod,
  ): Promise<PaymentResponse> {
    const strategy = this.getStrategy(method);
    this.logger.log(
      `${PAYMENT_MESSAGES.processingWithStrategy} ${method || this.defaultStrategy} strategy`,
    );

    try {
      return await strategy.processPayment(request);
    } catch (error) {
      const { message, stack } = this.getErrorDetails(error);
      this.logger.error(
        `${PAYMENT_MESSAGES.processingFailed} ${message}`,
        stack,
      );
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
   * Verify a payment on behalf of a user. Only the owner of the booking linked
   * to the payment reference (or an admin) may see its status.
   */
  async verifyPaymentForUser(
    paymentId: string,
    user: Pick<AuthRequestUser, 'id' | 'role'>,
    method?: PaymentMethod,
  ): Promise<PaymentResponse> {
    const booking = await this.prisma.booking.findFirst({
      where: { paymentId },
      select: { userId: true },
    });

    if (!booking || (booking.userId !== user.id && !isAdminUser(user))) {
      throw new NotFoundException(PAYMENT_MESSAGES.paymentNotFound);
    }

    return this.verifyPayment(paymentId, method);
  }

  /**
   * Refund a payment
   */
  async refundPayment(
    request: RefundRequest,
    method?: PaymentMethod,
  ): Promise<RefundResponse> {
    const strategy = this.getStrategy(method);
    this.logger.log(
      `${PAYMENT_MESSAGES.processingRefundForPayment} ${request.paymentId}`,
    );

    try {
      return await strategy.refundPayment(request);
    } catch (error) {
      const { message, stack } = this.getErrorDetails(error);
      this.logger.error(`${PAYMENT_MESSAGES.refundFailed} ${message}`, stack);
      throw error;
    }
  }

  /**
   * Handle webhook from payment provider
   */
  async handleWebhook(payload: any, method: PaymentMethod): Promise<void> {
    const strategy = this.getStrategy(method);

    if (strategy.handleWebhook) {
      await strategy.handleWebhook(payload);
    } else {
      this.logger.warn(
        `${PAYMENT_MESSAGES.webhookNotImplementedFor} ${method}`,
      );
    }
  }

  /**
   * Register a new payment strategy dynamically
   */
  registerStrategy(method: PaymentMethod, strategy: IPaymentStrategy): void {
    this.strategies.set(method, strategy);
    this.logger.log(`${PAYMENT_MESSAGES.registeredNewStrategy} ${method}`);
  }

  /**
   * Get strategy instance by method
   */
  private getStrategy(method?: PaymentMethod): IPaymentStrategy {
    const selectedMethod = method || this.defaultStrategy;
    const strategy = this.strategies.get(selectedMethod);

    if (!strategy) {
      throw new BadRequestException(
        `Payment method ${selectedMethod} ${PAYMENT_MESSAGES.unsupportedMethod}`,
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

  private getErrorDetails(error: unknown): {
    message: string;
    stack?: string;
  } {
    if (error instanceof Error) {
      return {
        message: error.message,
        stack: error.stack,
      };
    }

    return {
      message: String(error),
    };
  }
}
