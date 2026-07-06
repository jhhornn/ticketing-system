import { Injectable } from '@nestjs/common';
import pino, { Logger as PinoLogger } from 'pino';
import { trace } from '@opentelemetry/api';
import { logs, SeverityNumber } from '@opentelemetry/api-logs';
import {
  createLoggerEnvironmentContext,
  isDevelopmentEnvironment,
  resolveLoggerLevel,
} from './logger.config.js';

/**
 * Logger Service - Implements Wide Events pattern for observability
 *
 * This service provides structured logging following the "wide events" pattern:
 * - One context-rich event per request
 * - High cardinality fields (user IDs, request IDs)
 * - High dimensionality (many fields per event)
 * - Business context included in every log
 *
 * WHY: Wide events let you answer questions you haven't thought of yet.
 * Instead of "checkout failed" you get:
 * "Premium user (user_123) couldn't complete $2,499 purchase (req_xyz)
 * on commit abc123 in us-west-2"
 *
 * TELEMETRY PIPELINE:
 *   Pino (wide events, stdout) ──► stdout / log shipper
 *   OTel auto-instrumentation  ──► Jaeger (traces, metrics, logs via OTLP)
 *
 * Every log emitted here carries trace_id + span_id from the active OTel span
 * so that pino logs can be correlated with Jaeger traces.
 */
@Injectable()
export class LoggerService {
  private readonly logger: PinoLogger;
  private readonly environmentContext: Record<string, unknown>;
  private readonly otelLogger = logs.getLogger('ticketing-api.logger');
  private readonly enableOtelLogBridge: boolean;

  constructor() {
    this.environmentContext = createLoggerEnvironmentContext();
    this.enableOtelLogBridge = process.env.OTEL_LOG_BRIDGE_ENABLED !== 'false';

    const isDevelopment = isDevelopmentEnvironment();

    // Base pino configuration
    const pinoConfig: pino.LoggerOptions = {
      level: resolveLoggerLevel(isDevelopment),

      // Simplify to two levels: info and error (as per best practices)
      // WHY: Reduces decision fatigue and makes querying simpler
      customLevels: {
        info: 30,
        error: 50,
      },

      // Add environment context to every log
      // WHY: Every log has deployment/environment info automatically
      base: this.environmentContext,

      // Timestamp in ISO format for easy parsing
      // WHY: Consistent timestamps across services enable correlation
      timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,

      // Format error objects properly
      // WHY: Stack traces and error details are preserved in structured format
      serializers: {
        err: pino.stdSerializers.err,
        req: pino.stdSerializers.req,
        res: pino.stdSerializers.res,
      },
    };

    // Development: Pretty print for human readability
    // Production: JSON to stdout — OTel SDK (instrumentation.ts) ships
    //             traces, metrics, and logs to Jaeger via OTLP HTTP.
    if (isDevelopment) {
      this.logger = pino(
        pinoConfig,
        pino.transport({
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
            singleLine: false,
          },
        }),
      );
    } else {
      // Production: structured JSON to stdout.
      // WHY: Keep log emission simple and reliable. Forwarding to external
      // backends (Jaeger, log aggregators) is handled by OTel SDK and the
      // container/platform log pipeline — not the logger itself.
      this.logger = pino(pinoConfig);
    }
  }

  /**
   * Inject the active OTel span's trace_id and span_id into every log event.
   *
   * WHY: Correlate pino wide events with Jaeger traces without manual
   * propagation. When a trace is active, every log emitted during that
   * request carries the same trace_id — so you can jump from a Jaeger
   * span to the full wide-event log in one click.
   */
  private getTraceContext(): Record<string, unknown> {
    const span = trace.getActiveSpan();
    if (!span) return {};
    const ctx = span.spanContext();
    return {
      trace_id: ctx.traceId,
      span_id: ctx.spanId,
    };
  }

  /**
   * Create a wide event object with automatic environment context
   *
   * WHY: Standardizes event structure and ensures environment data is included.
   * Use this to build up context throughout your handler, then emit once.
   *
   * @example
   * const event = this.logger.createWideEvent({
   *   method: 'POST',
   *   path: '/bookings',
   *   request_id: '123',
   * });
   *
   * // Add context as you go
   * event.user = { id: user.id, tier: user.subscription };
   * event.cart = { total_cents: 249900, items: 2 };
   *
   * // Emit once at the end
   * this.logger.info(event, 'Booking completed');
   */
  createWideEvent(
    baseContext: Record<string, unknown> = {},
  ): Record<string, unknown> {
    return {
      ...baseContext,
      // Environment context already included via logger.base
    };
  }

  /**
   * Log an info-level wide event
   *
   * WHY: Info level for successful operations and wide events.
   * All context should be in the object, not the message.
   *
   * @param obj - The wide event object with all context
   * @param msg - Brief message (optional, mainly for human readability)
   */
  info(obj: Record<string, unknown>, msg?: string): void {
    const event = { ...this.getTraceContext(), ...obj };
    this.logger.info(event, msg || '');
    this.emitOtelLog('INFO', SeverityNumber.INFO, event, msg);
  }

  /**
   * Log an error-level wide event
   *
   * WHY: Error level for exceptions and failures.
   * Include error details, user context, and recovery actions taken.
   *
   * @param obj - The wide event object with error context
   * @param msg - Brief error message
   */
  error(obj: Record<string, unknown>, msg?: string): void {
    const event = { ...this.getTraceContext(), ...obj };
    this.logger.error(event, msg || '');
    this.emitOtelLog('ERROR', SeverityNumber.ERROR, event, msg);
  }

  /**
   * Log a debug event (development only)
   *
   * WHY: Useful for development debugging but filtered out in production.
   * Use sparingly - wide events at info level should be your primary tool.
   */
  debug(obj: Record<string, unknown>, msg?: string): void {
    const event = { ...this.getTraceContext(), ...obj };
    this.logger.debug(event, msg || '');
    this.emitOtelLog('DEBUG', SeverityNumber.DEBUG, event, msg);
  }

  private emitOtelLog(
    severityText: 'INFO' | 'ERROR' | 'DEBUG',
    severityNumber: SeverityNumber,
    event: Record<string, unknown>,
    msg?: string,
  ): void {
    if (!this.enableOtelLogBridge) return;

    try {
      const attributes = this.toOtelAttributes(event);
      if (msg) {
        attributes['log.message'] = msg;
      }

      this.otelLogger.emit({
        severityText,
        severityNumber,
        body: msg || 'application_log',
        attributes,
      });
    } catch {
      // Avoid throwing from logging path.
    }
  }

  private toOtelAttributes(
    input: Record<string, unknown>,
  ): Record<string, string | number | boolean | Array<string | number | boolean>> {
    const attributes: Record<
      string,
      string | number | boolean | Array<string | number | boolean>
    > = {};

    for (const [key, value] of Object.entries(input)) {
      const converted = this.toOtelAttributeValue(value);
      if (converted !== undefined) {
        attributes[key] = converted;
      }
    }

    return attributes;
  }

  private toOtelAttributeValue(
    value: unknown,
  ): string | number | boolean | Array<string | number | boolean> | undefined {
    if (value === null || value === undefined) return undefined;

    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return value;
    }

    if (Array.isArray(value)) {
      const converted = value
        .map((item) => {
          if (
            typeof item === 'string' ||
            typeof item === 'number' ||
            typeof item === 'boolean'
          ) {
            return item;
          }

          return JSON.stringify(item);
        })
        .filter(
          (item): item is string | number | boolean =>
            typeof item === 'string' ||
            typeof item === 'number' ||
            typeof item === 'boolean',
        );

      return converted.length ? converted : undefined;
    }

    return JSON.stringify(value);
  }

  /**
   * Get the underlying pino logger instance
   *
   * WHY: For advanced use cases or integration with pino-http middleware
   */
  getPinoLogger(): PinoLogger {
    return this.logger;
  }

  /**
   * Create a child logger with additional context
   *
   * WHY: Useful for adding service-level or class-level context
   * that applies to all logs from that component.
   *
   * @example
   * const bookingLogger = logger.child({ service_component: 'booking' });
   */
  child(bindings: Record<string, unknown>): LoggerService {
    const childLogger = Object.create(LoggerService.prototype) as LoggerService;
    Object.defineProperties(childLogger, {
      logger: {
        value: this.logger.child(bindings),
        writable: false,
        configurable: false,
      },
      environmentContext: {
        value: this.environmentContext,
        writable: false,
        configurable: false,
      },
    });

    return childLogger;
  }
}
