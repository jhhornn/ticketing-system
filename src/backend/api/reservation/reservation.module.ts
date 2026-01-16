import { Module } from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { ReservationController } from './reservation.controller';
import { DatabaseModule } from '../../common/database/database.module';
import { LocksModule } from '../../common/locks/locks.module';

@Module({
  imports: [DatabaseModule, LocksModule],
  controllers: [ReservationController],
  providers: [ReservationService],
  exports: [ReservationService],
})
export class ReservationModule {}
