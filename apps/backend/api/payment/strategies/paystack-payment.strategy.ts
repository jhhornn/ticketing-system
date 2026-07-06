import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance, AxiosError } from 'axios';
import * as crypto from 'crypto';
import {
  IPaymentStrategy,
  PaymentRequest,
  PaymentResponse,
  RefundRequest,
  RefundResponse,
  PaymentStatus,
} from './payment-strategy.interface';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

/**
 * Convert major currency units to kobo (Paystack smallest unit).
 * e.g. 100 NGN → 10000 kobo
 * For currencies without sub-units (e.g. JPY) no conversion is needed;
 * for simplicity we multiply by 100 for all currencies as Paystack requires.
 */
function toKobo(amount: number): number {
  return Math.round(amount * 100);
}

interface PaystackInitResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    status: 'success' | 'failed' | 'pending' | 'abandoned';
    reference: string;
    amount: number; // in kobo
    currency: string;
    gateway_response: string;
    paid_at: string | null;
    metadata: Record<string, unknown> | null;
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
    };
    customer: {
      email: string;
    };
  };
}

interface PaystackRefundResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    integration: number;
    deducted_amount: number;
    channel: string;
    merchant_note: string;
    customer_note: string;
    status: string;
    refunded_by: string;
    expected_at: string;
    currency: string;
    domain: string;
    amount: number; // in kobo
    fully_deducted: boolean;
    transaction: {
      id: number;
      reference: string;
    };
    created_at: string;
    updated_at: string;
  };
}

interface PaystackWebhookEvent {
  event: string;
  data: {
    id: number;
    status: string;
    reference: string;
    amount: number;
    currency: string;
    metadata?: Record<string, unknown>;
  };
}

function paystackStatusToPaymentStatus(
  status: PaystackVerifyResponse['data']['status'],
): PaymentStatus {
  switch (status) {
    case 'success':
      return PaymentStatus.SUCCESS;
    case 'failed':
    case 'abandoned':
      return PaymentStatus.FAILED;
    case 'pending':
    default:
      return PaymentStatus.PENDING;
  }
}

/**
 * Paystack payment strategy.
 *
 * Environment variables required:
 *   PAYSTACK_SECRET_KEY  — your Paystack secret key (sk_live_... or sk_test_...)
 *
 * Payment flow:
 *   1. Call processPayment → returns authorization_url in metadata.
 *   2. Redirect the user to metadata.authorizationUrl to complete payment.
 *   3. After Paystack redirects back, call verifyPayment with the reference
 *      (stored in paymentId on the PaymentResponse) to confirm the transaction.
 *
 * Webhook:
 *   Configure your Paystack dashboard webhook URL and call handleWebhook with
 *   the raw request body and the x-paystack-signature header value.
 */
@Injectable()
export class PaystackPaymentStrategy implements IPaymentStrategy {
  private readonly logger = new Logger(PaystackPaymentStrategy.name);
  private readonly client: AxiosInstance;
  private readonly secretKey: string;

  constructor() {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      this.logger.warn(
        'PAYSTACK_SECRET_KEY is not set — Paystack strategy will fail at runtime',
      );
    }
    this.secretKey = secretKey ?? '';

    this.client = axios.create({
      baseURL: PAYSTACK_BASE_URL,
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30_000,
    });
  }

  /**
   * Initialize a Paystack transaction.
   *
   * The caller must redirect the user to `metadata.authorizationUrl` to
   * complete payment. Use verifyPayment(reference) afterward.
   *
   * Note: `request.metadata.email` is required by Paystack.
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    const email = request.metadata?.email as string | undefined;
    if (!email) {
      return {
        success: false,
        paymentId: '',
        status: PaymentStatus.FAILED,
        amount: request.amount,
        currency: request.currency ?? 'NGN',
        errorMessage: 'Paystack requires a customer email in metadata.email',
      };
    }

    this.logger.log(
      `Initializing Paystack transaction: ${request.amount} ${request.currency ?? 'NGN'} for ${email}`,
    );

    try {
      const response = await this.client.post<PaystackInitResponse>(
        '/transaction/initialize',
        {
          email,
          amount: toKobo(request.amount),
          currency: (request.currency ?? 'NGN').toUpperCase(),
          reference: request.idempotencyKey,
          metadata: request.metadata,
        },
      );

      const { reference, authorization_url, access_code } = response.data.data;

      return {
        success: true,
        paymentId: reference,
        status: PaymentStatus.PENDING,
        amount: request.amount,
        currency: (request.currency ?? 'NGN').toUpperCase(),
        transactionReference: reference,
        metadata: {
          ...request.metadata,
          authorizationUrl: authorization_url,
          accessCode: access_code,
        },
      };
    } catch (error) {
      const message = this.extractErrorMessage(error);
      this.logger.error(`Paystack initialize failed: ${message}`);
      return {
        success: false,
        paymentId: '',
        status: PaymentStatus.FAILED,
        amount: request.amount,
        currency: (request.currency ?? 'NGN').toUpperCase(),
        errorMessage: message,
      };
    }
  }

  /**
   * Verify a Paystack transaction by its reference (the paymentId returned
   * from processPayment).
   */
  async verifyPayment(paymentId: string): Promise<PaymentResponse> {
    this.logger.log(`Verifying Paystack transaction: ${paymentId}`);

    try {
      const response = await this.client.get<PaystackVerifyResponse>(
        `/transaction/verify/${encodeURIComponent(paymentId)}`,
      );

      const tx = response.data.data;
      const status = paystackStatusToPaymentStatus(tx.status);

      return {
        success: tx.status === 'success',
        paymentId: tx.reference,
        status,
        amount: tx.amount / 100, // convert back from kobo
        currency: tx.currency,
        transactionReference: tx.reference,
        errorMessage: tx.status !== 'success' ? tx.gateway_response : undefined,
        metadata: tx.metadata ?? undefined,
      };
    } catch (error) {
      const message = this.extractErrorMessage(error);
      this.logger.error(`Paystack verify failed: ${message}`);
      return {
        success: false,
        paymentId,
        status: PaymentStatus.FAILED,
        amount: 0,
        currency: 'NGN',
        errorMessage: message,
      };
    }
  }

  /**
   * Create a refund on a Paystack transaction.
   *
   * `request.paymentId` should be the Paystack transaction reference.
   * `request.amount` is optional; omit for a full refund.
   */
  async refundPayment(request: RefundRequest): Promise<RefundResponse> {
    this.logger.log(
      `Creating Paystack refund for transaction: ${request.paymentId}`,
    );

    try {
      const body: Record<string, unknown> = {
        transaction: request.paymentId,
      };
      if (request.amount !== undefined) {
        body.amount = toKobo(request.amount);
      }
      if (request.reason) {
        body.merchant_note = request.reason;
        body.customer_note = request.reason;
      }

      const response = await this.client.post<PaystackRefundResponse>(
        '/refund',
        body,
      );

      const refund = response.data.data;

      return {
        success: response.data.status,
        refundId: String(refund.id),
        amount: refund.amount / 100,
        status: refund.status,
      };
    } catch (error) {
      const message = this.extractErrorMessage(error);
      this.logger.error(`Paystack refund failed: ${message}`);
      return {
        success: false,
        refundId: '',
        amount: 0,
        status: 'failed',
        errorMessage: message,
      };
    }
  }

  /**
   * Validate and process a Paystack webhook event.
   *
   * @param payload  Object with `body` (raw Buffer or string) and
   *                 `signature` (value of the x-paystack-signature header).
   */
  async handleWebhook(payload: {
    body: Buffer | string;
    signature: string;
  }): Promise<void> {
    const rawBody: string =
      payload.body instanceof Buffer
        ? payload.body.toString('utf8')
        : (payload.body as string);

    if (!this.verifyWebhookSignature(rawBody, payload.signature)) {
      this.logger.warn(
        'Paystack webhook signature validation failed — ignoring event',
      );
      return;
    }

    let event: PaystackWebhookEvent;
    try {
      event = JSON.parse(rawBody) as PaystackWebhookEvent;
    } catch {
      this.logger.warn('Paystack webhook: failed to parse payload');
      return;
    }

    this.logger.log(`Paystack webhook event received: ${event.event}`);

    switch (event.event) {
      case 'charge.success':
        this.logger.log(
          `Payment successful — reference: ${event.data.reference}, amount: ${event.data.amount / 100} ${event.data.currency}`,
        );
        // TODO: update your order/booking status here
        break;

      case 'charge.failed':
        this.logger.warn(`Payment failed — reference: ${event.data.reference}`);
        // TODO: handle failed payment
        break;

      case 'transfer.success':
        this.logger.log(`Transfer successful — id: ${event.data.id}`);
        break;

      case 'transfer.failed':
      case 'transfer.reversed':
        this.logger.warn(
          `Transfer failed/reversed — id: ${event.data.id}, event: ${event.event}`,
        );
        break;

      default:
        this.logger.log(`Unhandled Paystack event: ${event.event}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Verify HMAC-SHA512 signature from Paystack.
   * https://paystack.com/docs/payments/webhooks/#ip-whitelisting
   */
  private verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!this.secretKey) return false;
    const expected = crypto
      .createHmac('sha512', this.secretKey)
      .update(rawBody)
      .digest('hex');
    const expectedBuf = Buffer.from(expected, 'hex');
    const signatureBuf = Buffer.from(signature, 'hex');
    if (expectedBuf.length !== signatureBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, signatureBuf);
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof AxiosError) {
      const data = error.response?.data as { message?: string } | undefined;
      return data?.message ?? error.message;
    }
    if (error instanceof Error) return error.message;
    return String(error);
  }
}
