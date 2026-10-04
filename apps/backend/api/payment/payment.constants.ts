import { PaymentMethod } from './strategies/payment-strategy.interface';

export const DEFAULT_PAYMENT_PROVIDER_ENV_KEY = 'DEFAULT_PAYMENT_PROVIDER';
export const DEFAULT_PAYMENT_PROVIDER = PaymentMethod.MOCK;

/** Set to "true" to allow the mock provider outside development/test. */
export const ENABLE_MOCK_PAYMENTS_ENV_KEY = 'ENABLE_MOCK_PAYMENTS';
const MOCK_PAYMENT_ENVIRONMENTS = ['development', 'test'];

/**
 * SECURITY: The mock provider always succeeds, so it must never be reachable
 * in production. It is only enabled for development/test or an explicit
 * opt-in; an unset NODE_ENV fails closed.
 */
export function isMockPaymentEnabled(env = process.env): boolean {
  return (
    env[ENABLE_MOCK_PAYMENTS_ENV_KEY] === 'true' ||
    MOCK_PAYMENT_ENVIRONMENTS.includes(env.NODE_ENV ?? '')
  );
}

export const PAYMENT_MESSAGES = {
  initializedWithDefault: 'Payment service initialized with default:',
  processingWithStrategy: 'Processing payment with',
  processingFailed: 'Payment processing failed:',
  processingRefundForPayment: 'Processing refund for payment:',
  refundFailed: 'Refund failed:',
  webhookNotImplementedFor: 'Webhook handling not implemented for',
  registeredNewStrategy: 'Registered new payment strategy:',
  unsupportedMethod: 'is not supported',
  paymentNotFound: 'Payment not found',
} as const;
