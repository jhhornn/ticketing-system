// IMPORTANT: instrumentation MUST be the very first import so that OTel can
// patch Node.js modules (HTTP, Express, pg, Redis) before they are loaded.
import './instrumentation.js';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';
import { setupSwagger } from './common/config/swagger.config.js';
import {
  DEFAULT_PORT,
  getAllowedOrigins,
} from './common/config/runtime.config.js';
import { LoggerService } from './common/logger/logger.service.js';
import { RequestContextService } from './common/logger/request-context.service.js';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Disable default NestJS logger, use our structured logger
    // WHY: Consistent logging format across the entire application
    logger: false,
    // Preserve raw request body so webhook signature validation works
    rawBody: true,
  });

  // Get our custom logger for bootstrap logs
  const logger = app.get(LoggerService);

  // Security: Add helmet for security headers
  // Relaxed CSP for /api documentation route
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
      // Disable CSP for API docs route to allow Scalar CDN
      res.removeHeader('Content-Security-Policy');
    }
    next();
  });

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "'unsafe-eval'",
            'https://cdn.jsdelivr.net',
          ],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", 'data:', 'https://cdn.jsdelivr.net'],
          workerSrc: ["'self'", 'blob:'],
        },
      },
      crossOriginEmbedderPolicy: false, // Disable for API
    }),
  );

  // Security: Add cookie parser for HttpOnly cookies
  app.use(cookieParser());

  // Configure CORS with environment variable
  const allowedOrigins = getAllowedOrigins();

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global Exception Filter
  // NOTE: Using app.get() to get services with proper dependency injection
  const loggerService = app.get(LoggerService);
  const requestContextService = app.get(RequestContextService);
  app.useGlobalFilters(
    new HttpExceptionFilter(loggerService, requestContextService),
  );

  // Global Response Transformer
  app.useGlobalInterceptors(new TransformInterceptor());

  // Setup API Documentation
  setupSwagger(app);

  const port = process.env.PORT ?? DEFAULT_PORT;
  await app.listen(port);

  // Structured logging for application startup
  // WHY: Bootstrap events should also be structured for consistency
  logger.info(
    {
      event: 'application_started',
      port,
      environment: process.env.NODE_ENV || 'development',
      cors_origins: allowedOrigins,
      api_docs_url: `http://localhost:${port}/api`,
    },
    'Application started successfully',
  );
}
void bootstrap();
