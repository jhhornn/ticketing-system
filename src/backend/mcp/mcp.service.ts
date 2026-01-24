import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { EventsTool } from './tools/events.tool.js';
import { SeatsTool } from './tools/seats.tool.js';

@Injectable()
export class McpService implements OnModuleInit {
  private server: McpServer;
  private readonly logger = new Logger(McpService.name);

  constructor(
    private eventsTool: EventsTool,
    private seatsTool: SeatsTool,
  ) {
    this.server = new McpServer({
      name: 'Ticketing System MCP',
      version: '1.0.0',
    });
  }

  onModuleInit() {
    this.registerTools();
    this.startServer();
  }

  private registerTools() {
    // Tool: list_events
    this.server.tool(
      'list_events',
      'List upcoming events',
      EventsTool.listEventsSchema.shape as any,
      async (args: any) => {
        const result = await this.eventsTool.listEvents(args);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result) }],
        };
      }
    );

    // Tool: get_event_details
    this.server.tool(
      'get_event_details',
      'Get detailed information about a specific event',
      EventsTool.getEventDetailsSchema.shape as any,
      async (args: any) => {
        const result = await this.eventsTool.getEventDetails(args);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result) }],
        };
      }
    );

    // Tool: list_available_seats
    this.server.tool(
      'list_available_seats',
      'List available seats for an event (capped at 50)',
      SeatsTool.listAvailableSeatsSchema.shape as any,
      async (args: any) => {
        const result = await this.seatsTool.listAvailableSeats(args);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result) }],
        };
      }
    );

    // Tool: get_seat_availability_summary
    this.server.tool(
      'get_seat_availability_summary',
      'Get a summary of seat availability by type and status',
      SeatsTool.getSeatSummarySchema.shape as any,
      async (args: any) => {
        const result = await this.seatsTool.getSeatSummary(args);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result) }],
        };
      }
    );
  }

  getTools() {
    return [
      {
        name: 'list_events',
        description: 'List upcoming events',
        inputSchema: EventsTool.listEventsSchema.shape,
      },
      {
        name: 'get_event_details',
        description: 'Get detailed information about a specific event',
        inputSchema: EventsTool.getEventDetailsSchema.shape,
      },
      {
        name: 'list_available_seats',
        description: 'List available seats for an event (capped at 50)',
        inputSchema: SeatsTool.listAvailableSeatsSchema.shape,
      },
      {
        name: 'get_seat_availability_summary',
        description: 'Get a summary of seat availability by type and status',
        inputSchema: SeatsTool.getSeatSummarySchema.shape,
      },
    ];
  }

  private async startServer() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.logger.log('MCP Server started on stdio');
  }
}
