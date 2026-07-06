import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { McpService } from './mcp.service.js';

@ApiTags('MCP')
@Controller('mcp')
export class McpController {
  constructor(private readonly mcpService: McpService) {}

  @Get('tools')
  @ApiOperation({ summary: 'List available MCP tools' })
  @ApiResponse({ status: 200, description: 'List of tools and their schemas.' })
  getTools() {
    return this.mcpService.getTools();
  }
}
