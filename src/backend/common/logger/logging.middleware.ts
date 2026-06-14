import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from './logger.service.js';
import { RequestContextService } from './request-context.service.js';
import { v4 as uuidv4 } from 'uuid';

type SendFn = Response['send'];
type JsonFn = Response['json'];

/**
 * LoggingMiddleware - Implements Wide Events pattern automatically
 *
 * WHY: This middleware does the heavy lifting for observability:
 * 1. Creates request context (request_id, timing, etc.)
 * 2. Builds a wide event object throughout the request
 * 3. Emits ONE context-rich log per request (in finally block)
 *
 * OBSERVABILITY BENEFITS:
 * - Single source of truth for each request
 * - Automatic inclusion of environment, timing, and outcome
 * - High cardinality fields (request_id) for precise querying
 * - Business context (user, endpoint) for understanding impact
 *
 * PATTERN: The middleware handles infrastructure (timing, status, headers).
 * Your handlers only need to add business-specific context via RequestContextService.
 *
 * @example
 * // In your service
 * this.requestContext.addBusinessContext({
 *   booking_id: 123,
 *   total_amount_cents: 249900,
 *   seat_count: 2,
 * });
 * // This context is automatically included in the wide event!
 */
@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(
    private readonly logger: LoggerService,
    private readonly requestContext: RequestContextService,
  ) {}

  use(req: Request, res: Response, next: NextFunction): void {
    // Generate request ID (check for existing from load balancer/proxy)
    // WHY: Request IDs enable tracing across multiple services
    const requestId = (req.headers['x-request-id'] as string) || uuidv4();

    // Extract user agent and IP for debugging
    // WHY: Helps identify browser-specific or network-specific issues
    const userAgent = req.headers['user-agent'] || 'unknown';
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown';

    // Initialize request context - follows the request through all async operations
    // WHY: Makes request_id and user context available everywhere without passing it
    this.requestContext.run(
      {
        request_id: requestId,
        method: req.method,
        path: req.path,
        user_agent: userAgent,
        ip_address: ipAddress,
        start_time: Date.now(),
      },
      () => {
        // Create the wide event object that we'll build up
        const wideEvent = this.logger.createWideEvent({
          request_id: requestId,
          method: req.method,
          path: req.path,
          query: req.query,
          // Note: Be careful logging request body - avoid logging sensitive data
          // body_size: req.headers['content-length'],
        });

        // Track original response methods to capture response details
        const originalSend = res.send;
        const originalJson = res.json;

        // Intercept response to capture status and body
        // WHY: We need the outcome (success/error) and response size for the wide event
        res.send = function interceptSend(this: Response, body?: unknown) {
          Reflect.apply(originalSend as (...args: unknown[]) => unknown, this, [
            body,
          ]);
          return this;
        } as SendFn;

        res.json = function interceptJson(this: Response, body?: unknown) {
          Reflect.apply(originalJson as (...args: unknown[]) => unknown, this, [
            body,
          ]);
          return this;
        } as JsonFn;

        // Capture when response finishes
        // WHY: The "finally" block pattern - emit the wide event when request completes
        res.on('finish', () => {
          try {
            // Get the final request context (may have been enriched by handlers)
            const context = this.requestContext.get();

            // Calculate duration
            // WHY: Performance monitoring - identify slow endpoints
            const durationMs = this.requestContext.getDuration();

            // Determine outcome based on status code
            // WHY: Categorize success vs. error for easier querying
            const statusCode = res.statusCode;
            const outcome =
              statusCode >= 500
                ? 'server_error'
                : statusCode >= 400
                  ? 'client_error'
                  : statusCode >= 300
                    ? 'redirect'
                    : 'success';

            // Build the final wide event with all context
            // WHY: ONE log with EVERYTHING - enables powerful queries in Grafana
            const finalEvent = {
              ...wideEvent,
              ...context, // Includes user_id, user_tier, business context added by handlers
              status_code: statusCode,
              outcome,
              duration_ms: durationMs,
              response_size_bytes: res.get('content-length'),
              // Performance categorization
              // WHY: Quick filtering for performance issues
              is_slow: durationMs > 1000, // > 1 second
              is_very_slow: durationMs > 5000, // > 5 seconds
            };

            // Log at appropriate level
            // WHY: Separate info (normal) from error (problems) for alerting
            if (statusCode >= 500) {
              this.logger.error(
                finalEvent,
                `${req.method} ${req.path} - Server Error`,
              );
            } else if (statusCode >= 400) {
              // Client errors (4xx) are usually not our fault, but still log for monitoring
              this.logger.info(
                finalEvent,
                `${req.method} ${req.path} - Client Error`,
              );
            } else {
              this.logger.info(
                finalEvent,
                `${req.method} ${req.path} - Success`,
              );
            }
          } catch (error) {
            // Failsafe: If logging fails, don't crash the app
            console.error('Logging middleware error:', error);
          }
        });

        // Handle errors that occur before response is sent
        // WHY: Capture exceptions that might not trigger res.on('finish')
        res.on('error', (error: Error) => {
          try {
            const context = this.requestContext.get();
            const durationMs = this.requestContext.getDuration();

            this.logger.error(
              {
                ...wideEvent,
                ...context,
                outcome: 'error',
                duration_ms: durationMs,
                error: {
                  message: error.message,
                  name: error.name,
                  stack: error.stack,
                },
              },
              `${req.method} ${req.path} - Response Error`,
            );
          } catch (logError) {
            console.error('Logging middleware error:', logError);
          }
        });

        // Continue to next middleware/handler
        next();
      },
    );
  }
}
