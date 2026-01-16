import { Module } from '@nestjs/common';
import { McpService } from './mcp.service.js';
import { EventsModule } from '../api/events/events.module.js';
import { SeatsModule } from '../api/seats/seats.module.js';
import { EventsTool } from './tools/events.tool.js';
import { SeatsTool } from './tools/seats.tool.js';
import { DatabaseModule } from '../common/database/database.module.js';

import { McpController } from './mcp.controller.js';

@Module({
  imports: [
    DatabaseModule,
    EventsModule,
    SeatsModule,
  ],
  controllers: [McpController],
  providers: [
    McpService,
    EventsTool,
    SeatsTool,
  ],
})
export class McpModule {}
