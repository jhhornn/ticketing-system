import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { DatabaseModule } from '../../common/database/database.module';
import { LocksModule } from '../../common/locks/locks.module';
import { PaymentModule } from '../payment/payment.module';
import { DiscountsModule } from '../discounts/discounts.module';

@Module({
  imports: [DatabaseModule, LocksModule, PaymentModule, DiscountsModule],
  controllers: [BookingController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}
