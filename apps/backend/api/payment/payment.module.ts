import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { MockPaymentStrategy } from './strategies/mock-payment.strategy';
import { StripePaymentStrategy } from './strategies/stripe-payment.strategy';
import { PaystackPaymentStrategy } from './strategies/paystack-payment.strategy';

@Module({
  controllers: [PaymentController],
  providers: [
    PaymentService,
    MockPaymentStrategy,
    StripePaymentStrategy,
    PaystackPaymentStrategy,
  ],
  exports: [PaymentService],
})
export class PaymentModule {}
