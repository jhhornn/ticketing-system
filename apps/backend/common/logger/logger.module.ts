import { Global, Module } from '@nestjs/common';
import { LoggerService } from './logger.service.js';
import { RequestContextService } from './request-context.service.js';
import { LoggingMiddleware } from './logging.middleware.js';

/**
 * LoggerModule - Makes logging services available globally
 *
 * WHY @Global: Logger should be available everywhere without importing the module.
 * This ensures consistent logging across all features and services.
 *
 * EXPORTS:
 * - LoggerService: For manual logging (wide events, errors)
 * - RequestContextService: For adding business context throughout the request
 * - LoggingMiddleware: Auto-applied to all routes for wide events
 */
@Global()
@Module({
  providers: [LoggerService, RequestContextService, LoggingMiddleware],
  exports: [LoggerService, RequestContextService, LoggingMiddleware],
})
export class LoggerModule {}
