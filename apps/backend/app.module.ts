import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './common/database/index.js';
import { RedisModule } from './common/redis/index.js';
import { LocksModule } from './common/locks/index.js';
import { AuditLogModule } from './common/audit/audit-log.module.js';
import { LoggerModule, LoggingMiddleware } from './common/logger/index.js';
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
import { THROTTLER_DEFAULTS } from './common/config/runtime.config.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: THROTTLER_DEFAULTS.ttl, // Time window in milliseconds (1 minute)
        limit: THROTTLER_DEFAULTS.limit, // Max requests per ttl per user
      },
    ]),
    // Add LoggerModule for wide events observability
    LoggerModule,
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
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  /**
   * Configure middleware for the application
   *
   * WHY: Apply LoggingMiddleware to ALL routes for automatic wide events.
   * This ensures every request gets:
   * - Request ID generation
   * - Timing tracking
   * - Context capture
   * - Automatic log emission
   */
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
