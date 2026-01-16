import { NestFactory } from '@nestjs/core';
import { McpModule } from './mcp.module.js';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(McpModule, {
    logger: ['error', 'warn'], // Minimize noise on stdio
  });
  
  // Keep the process alive
  // The Stdio transport handles the communication
}
bootstrap();
