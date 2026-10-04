import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { MockPaymentStrategy } from './strategies/mock-payment.strategy';
import { StripePaymentStrategy } from './strategies/stripe-payment.strategy';
import { PaystackPaymentStrategy } from './strategies/paystack-payment.strategy';
import { DatabaseModule } from '../../common/database/database.module';
import { BookingSettlementModule } from '../booking/settlement/booking-settlement.module.js';

@Module({
  imports: [DatabaseModule, BookingSettlementModule],
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
