// src/backend/api/advertisements/advertisements.module.ts
import { Module } from '@nestjs/common';
import { AdvertisementsService } from './advertisements.service.js';
import { AdvertisementsController } from './advertisements.controller.js';
import { DatabaseModule } from '../../common/database/database.module.js';

@Module({
  imports: [DatabaseModule],
  controllers: [AdvertisementsController],
  providers: [AdvertisementsService],
  exports: [AdvertisementsService],
})
export class AdvertisementsModule {}
