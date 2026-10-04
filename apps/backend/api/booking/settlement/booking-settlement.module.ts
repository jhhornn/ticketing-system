import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../common/database/database.module.js';
import { DiscountsModule } from '../../discounts/discounts.module.js';
import { BookingSettlementService } from './booking-settlement.service.js';

/**
 * Kept separate from BookingModule so PaymentModule (webhooks) can use it
 * without a circular import (BookingModule already imports PaymentModule).
 */
@Module({
  imports: [DatabaseModule, DiscountsModule],
  providers: [BookingSettlementService],
  exports: [BookingSettlementService],
})
export class BookingSettlementModule {}
