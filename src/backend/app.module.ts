import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './common/database/index.js';
import { RedisModule } from './common/redis/index.js';
import { LocksModule } from './common/locks/index.js';
import { AuditLogModule } from './common/audit/audit-log.module.js';
import { PaymentModule } from './api/payment/payment.module.js';
import { ReservationModule } from './api/reservation/reservation.module.js';
import { BookingModule } from './api/booking/booking.module.js';
import { AuthModule } from './api/auth/auth.module.js';
import { EventsModule } from './api/events/events.module.js';
import { SeatsModule } from './api/seats/seats.module.js';
import { DiscountsModule } from './api/discounts/discounts.module.js';
import { StatsModule } from './api/stats/stats.module.js';
import { VenuesModule } from './api/venues/venues.module.js';
import { SectionsModule } from './api/sections/sections.module.js';
import { AdvertisementsModule } from './api/advertisements/advertisements.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    RedisModule,
    LocksModule,
    AuditLogModule,
    PaymentModule,
    ReservationModule,
    BookingModule,
    AuthModule,
    EventsModule,
    SeatsModule,
    DiscountsModule,
    StatsModule,
    VenuesModule,
    SectionsModule,
    AdvertisementsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
