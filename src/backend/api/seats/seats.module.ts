import { Module } from '@nestjs/common';
import { SeatsService } from './seats.service.js';
import { PrismaService } from '../../common/database/prisma.service.js';
import { SeatsController } from './seats.controller.js';

@Module({
  controllers: [SeatsController],
  providers: [SeatsService, PrismaService],
  exports: [SeatsService],
})
export class SeatsModule {}
