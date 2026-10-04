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
  API_DOCS_PATH,
  DEFAULT_PORT,
  getAllowedOrigins,
  getTrustProxySetting,
  isApiDocsEnabled,
} from './common/config/runtime.config.js';
import { LoggerService } from './common/logger/logger.service.js';
import { RequestContextService } from './common/logger/request-context.service.js';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import type { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // Disable default NestJS logger, use our structured logger
    // WHY: Consistent logging format across the entire application
    logger: false,
    // Preserve raw request body so webhook signature validation works
    rawBody: true,
  });

  // Get our custom logger for bootstrap logs
  const logger = app.get(LoggerService);

  // Behind Render's (or any single) reverse proxy, trust one hop so req.ip is
  // the real client IP. Required for per-client rate limiting.
  app.set('trust proxy', getTrustProxySetting());

  // Security headers. The API only serves JSON, so it gets a locked-down CSP.
  // The interactive docs (when enabled) need inline/eval scripts from the
  // Scalar CDN, so that relaxed policy is scoped to the docs route only.
  const apiDocsEnabled = isApiDocsEnabled();
  const strictHelmet = helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'none'"],
        formAction: ["'none'"],
      },
    },
  });
  const docsHelmet = helmet({
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
    crossOriginEmbedderPolicy: false,
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    const isDocsRoute =
      req.path === API_DOCS_PATH || req.path.startsWith(`${API_DOCS_PATH}/`);
    return apiDocsEnabled && isDocsRoute
      ? docsHelmet(req, res, next)
      : strictHelmet(req, res, next);
  });

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

  // Setup API Documentation (disabled in production unless ENABLE_API_DOCS=true)
  if (apiDocsEnabled) {
    setupSwagger(app);
  }

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
      api_docs_url: apiDocsEnabled
        ? `http://localhost:${port}${API_DOCS_PATH}`
        : 'disabled',
    },
    'Application started successfully',
  );
}
void bootstrap();
