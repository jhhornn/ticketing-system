import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';
import { setupSwagger } from './common/config/swagger.config.js';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security: Add helmet for security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false, // Disable for API
    }),
  );

  // Security: Add cookie parser for HttpOnly cookies
  app.use(cookieParser());

  // Configure CORS with environment variable
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:5173'];

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
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global Response Transformer
  app.useGlobalInterceptors(new TransformInterceptor());

  // Setup API Documentation
  setupSwagger(app);

  await app.listen(process.env.PORT ?? 3000);
  
  console.log(`\n🚀 Application running on: http://localhost:${process.env.PORT ?? 3000}`);
  console.log(`📚 API Documentation: http://localhost:${process.env.PORT ?? 3000}/api\n`);
}
bootstrap();
