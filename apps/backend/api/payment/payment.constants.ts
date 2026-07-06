import { PaymentMethod } from './strategies/payment-strategy.interface';

export const DEFAULT_PAYMENT_PROVIDER_ENV_KEY = 'DEFAULT_PAYMENT_PROVIDER';
export const DEFAULT_PAYMENT_PROVIDER = PaymentMethod.MOCK;

export const PAYMENT_MESSAGES = {
  initializedWithDefault: 'Payment service initialized with default:',
  processingWithStrategy: 'Processing payment with',
  processingFailed: 'Payment processing failed:',
  processingRefundForPayment: 'Processing refund for payment:',
  refundFailed: 'Refund failed:',
  webhookNotImplementedFor: 'Webhook handling not implemented for',
  registeredNewStrategy: 'Registered new payment strategy:',
  unsupportedMethod: 'is not supported',
} as const;
