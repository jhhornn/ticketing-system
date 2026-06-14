import { Module } from '@nestjs/common';
import { EventsService } from './events.service.js';
import { EventsController } from './events.controller.js';
import { PrismaService } from '../../common/database/prisma.service.js';
import { AuditLogModule } from '../../common/audit/audit-log.module.js';

@Module({
  imports: [AuditLogModule],
  controllers: [EventsController],
  providers: [EventsService, PrismaService],
  exports: [EventsService],
})
export class EventsModule {}
