import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { MockPaymentStrategy } from './strategies/mock-payment.strategy';
import { StripePaymentStrategy } from './strategies/stripe-payment.strategy';

@Module({
  providers: [PaymentService, MockPaymentStrategy, StripePaymentStrategy],
  exports: [PaymentService],
})
export class PaymentModule {}
