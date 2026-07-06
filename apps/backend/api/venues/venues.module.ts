import { Module } from '@nestjs/common';
import { VenuesController } from './venues.controller.js';
import { VenuesService } from './venues.service.js';
import { PrismaService } from '../../common/database/prisma.service.js';

@Module({
  controllers: [VenuesController],
  providers: [VenuesService, PrismaService],
  exports: [VenuesService],
})
export class VenuesModule {}
