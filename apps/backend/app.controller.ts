import { Controller, Get, HttpCode } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@Controller()
@ApiTags('Health')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'API health check and info' })
  getHello() {
    return {
      message: 'Ticketing System API',
      version: '1.0.0',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      documentation: '/api',
      endpoints: {
        health: '/',
        docs: '/api',
        swagger: '/api',
      },
    };
  }

  @Get('favicon.ico')
  @HttpCode(204)
  handleFavicon() {
    return;
  }
}
