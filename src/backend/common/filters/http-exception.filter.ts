import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponseDto } from '../dto/api-response.dto.js';
import { LoggerService } from '../logger/logger.service.js';
import { RequestContextService } from '../logger/request-context.service.js';

type HttpExceptionResponseShape = {
  message?: string | string[];
  error?: string | object;
};

/**
 * Global exception filter with structured logging
 *
 * WHY STRUCTURED LOGGING IN EXCEPTION FILTER:
 * - Errors become queryable data (filter by error type, user, endpoint)
 * - Full context included (who, what, where, when)
 * - Enables powerful queries: "Show all payment errors for premium users"
 * - Separate client errors (their fault) from server errors (our fault)
 *
 * OBSERVABILITY: Every error log is a wide event with:
 * - Error details (type, message, stack)
 * - User context (user_id, tier, email)
 * - Request context (request_id, endpoint, method)
 * - Environment context (commit, region, version) - automatic
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(LoggerService) private readonly logger: LoggerService,
    @Inject(RequestContextService)
    private readonly requestContext: RequestContextService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error: string | object | undefined;
    let errorType = 'UnknownError';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      errorType = exception.constructor.name;
      const normalized = this.extractHttpExceptionDetails(exception);
      message = normalized.message;
      error = normalized.error;
    } else if (exception instanceof Error) {
      errorType = exception.constructor.name;
      message = exception.message;
      // Don't expose stack traces in production
      if (process.env.NODE_ENV !== 'production') {
        error = exception.stack;
      }
    }

    // Get request context for the wide event
    // WHY: Include user_id, user_tier, business context in error logs
    const context = this.requestContext.get();

    // Build wide event with full error context
    // WHY: ONE log with EVERYTHING - enables queries like:
    // - "Show all 500 errors for user_id=123"
    // - "Show all BookingErrors in the last hour"
    // - "Show payment errors for premium users"
    const errorEvent = {
      ...context, // Includes request_id, user_id, user_tier, business context
      outcome: 'error',
      error_type: errorType,
      error_message: message,
      error_category: statusCode >= 500 ? 'server_error' : 'client_error',
      status_code: statusCode,
      method: request.method,
      path: request.path,
      url: request.url,
      duration_ms: this.requestContext.getDuration(),

      // Include stack trace in non-production for debugging
      // WHY: Root cause analysis requires stack traces
      ...(process.env.NODE_ENV !== 'production' &&
        exception instanceof Error && { error_stack: exception.stack }),

      // Include query params for debugging (be careful with sensitive data)
      query: Object.keys(request.query).length > 0 ? request.query : undefined,
    };

    // Log at error level
    // WHY: Error level triggers alerts and makes errors easy to query
    // Message format: Brief, human-readable summary
    this.logger.error(
      errorEvent,
      `${errorType}: ${request.method} ${request.path}`,
    );

    // Send standardized error response (sanitized for production)
    const errorResponse = new ErrorResponseDto(
      statusCode,
      message,
      process.env.NODE_ENV !== 'production' ? error : undefined,
      request.url,
    );

    response.status(statusCode).json(errorResponse);
  }

  private extractHttpExceptionDetails(exception: HttpException): {
    message: string;
    error?: string | object;
  } {
    const exceptionResponse = exception.getResponse();

    if (typeof exceptionResponse === 'string') {
      return { message: exceptionResponse };
    }

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const response = exceptionResponse as HttpExceptionResponseShape;
      const normalizedMessage = Array.isArray(response.message)
        ? response.message.join(', ')
        : response.message;

      return {
        message: normalizedMessage || exception.message,
        error: response.error,
      };
    }

    return { message: exception.message };
  }
}
