// src/backend/api/sections/sections.module.ts
import { Module } from '@nestjs/common';
import { SectionsController } from './sections.controller.js';
import { SectionsService } from './sections.service.js';
import { DatabaseModule } from '../../common/database/database.module.js';
import { AuditLogModule } from '../../common/audit/audit-log.module.js';

@Module({
  imports: [DatabaseModule, AuditLogModule],
  controllers: [SectionsController],
  providers: [SectionsService],
  exports: [SectionsService],
})
export class SectionsModule {}
