import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { DatabaseModule } from '../../common/database/database.module';
import { LocksModule } from '../../common/locks/locks.module';
import { PaymentModule } from '../payment/payment.module';
import { DiscountsModule } from '../discounts/discounts.module';
import { BookingSettlementModule } from './settlement/booking-settlement.module.js';
import { PendingBookingCleanupService } from './pending-booking-cleanup.service.js';

@Module({
  imports: [
    DatabaseModule,
    LocksModule,
    PaymentModule,
    DiscountsModule,
    BookingSettlementModule,
  ],
  controllers: [BookingController],
  providers: [BookingService, PendingBookingCleanupService],
  exports: [BookingService],
})
export class BookingModule {}
